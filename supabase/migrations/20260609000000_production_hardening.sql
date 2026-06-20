begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

delete from public.challenges;

do $$
begin
  if exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime drop table public.messages;
  end if;
end
$$;

drop table if exists public.messages cascade;

alter table public.profiles
  alter column username set not null,
  alter column display_name set not null;

alter table public.profiles
  drop constraint if exists profiles_username_format;
alter table public.profiles
  add constraint profiles_username_format
  check (username ~ '^[a-z0-9_]{3,30}$');

alter table public.artworks
  alter column user_id set not null;

alter table public.artworks
  drop constraint if exists artworks_anonymous_receiver;
alter table public.artworks
  add constraint artworks_anonymous_receiver
  check (not is_anonymous or receiver_id is not null);

alter table public.comments
  drop constraint if exists comments_content_length;
alter table public.comments
  add constraint comments_content_length
  check (char_length(btrim(content)) between 1 and 500);

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_like_change on public.likes;
drop trigger if exists on_repost_change on public.reposts;
drop trigger if exists on_comment_change on public.comments;

drop function if exists public.handle_new_user();
drop function if exists public.update_artwork_likes_count();
drop function if exists public.update_artwork_reposts_count();
drop function if exists public.update_artwork_comments_count();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base_username text;
  safe_username text;
begin
  base_username := lower(coalesce(
    new.raw_user_meta_data ->> 'preferred_username',
    new.raw_user_meta_data ->> 'user_name',
    split_part(coalesce(new.email, 'pixel_artist'), '@', 1)
  ));
  base_username := regexp_replace(base_username, '[^a-z0-9_]+', '_', 'g');
  base_username := trim(both '_' from base_username);
  if char_length(base_username) < 3 then
    base_username := 'pixel_artist';
  end if;
  safe_username := left(base_username, 21) || '_' || left(replace(new.id::text, '-', ''), 8);

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    safe_username,
    left(coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      safe_username
    ), 80),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create or replace function private.sync_artwork_counter()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_id uuid := coalesce(new.artwork_id, old.artwork_id);
  delta integer := case when tg_op = 'INSERT' then 1 else -1 end;
begin
  if tg_table_name = 'likes' then
    update public.artworks
    set likes_count = greatest(0, likes_count + delta)
    where id = target_id;
  elsif tg_table_name = 'reposts' then
    update public.artworks
    set reposts_count = greatest(0, reposts_count + delta)
    where id = target_id;
  elsif tg_table_name = 'comments' then
    update public.artworks
    set comments_count = greatest(0, comments_count + delta)
    where id = target_id;
  end if;
  return null;
end;
$$;

create trigger on_like_change
  after insert or delete on public.likes
  for each row execute function private.sync_artwork_counter();
create trigger on_repost_change
  after insert or delete on public.reposts
  for each row execute function private.sync_artwork_counter();
create trigger on_comment_change
  after insert or delete on public.comments
  for each row execute function private.sync_artwork_counter();

create or replace function private.create_social_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid;
  notification_type text;
begin
  if tg_table_name = 'follows' then
    owner_id := new.following_id;
    notification_type := 'follow';
  else
    select user_id into owner_id
    from public.artworks
    where id = new.artwork_id;
    notification_type := case tg_table_name
      when 'likes' then 'like'
      when 'reposts' then 'repost'
      when 'comments' then 'comment'
    end;
  end if;

  if owner_id is not null and owner_id <> (select auth.uid()) then
    insert into public.notifications (user_id, actor_id, artwork_id, type)
    values (
      owner_id,
      (select auth.uid()),
      case when tg_table_name = 'follows' then null else new.artwork_id end,
      notification_type
    );
  end if;
  return new;
end;
$$;

create trigger notify_on_like
  after insert on public.likes
  for each row execute function private.create_social_notification();
create trigger notify_on_repost
  after insert on public.reposts
  for each row execute function private.create_social_notification();
create trigger notify_on_comment
  after insert on public.comments
  for each row execute function private.create_social_notification();
create trigger notify_on_follow
  after insert on public.follows
  for each row execute function private.create_social_notification();

create or replace function private.notify_received_artwork()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_anonymous and new.receiver_id is not null then
    insert into public.notifications (user_id, actor_id, artwork_id, type)
    values (new.receiver_id, null, new.id, 'received_pixel');
  end if;
  return new;
end;
$$;

create trigger notify_on_received_artwork
  after insert on public.artworks
  for each row execute function private.notify_received_artwork();

revoke all on all functions in schema private from public, anon, authenticated;

drop view if exists public.profile_stats;
create view public.profile_stats
with (security_invoker = true)
as
select
  p.*,
  (select count(*)::integer from public.follows f where f.following_id = p.id) as followers_count,
  (select count(*)::integer from public.follows f where f.follower_id = p.id) as following_count,
  (select count(*)::integer from public.artworks a where a.user_id = p.id and a.visibility = 'public') as paints_count,
  (select coalesce(sum(a.likes_count), 0)::integer from public.artworks a where a.user_id = p.id and a.visibility = 'public') as likes_count
from public.profiles p;

drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);
create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Anyone can send anonymous artwork" on public.artworks;
drop policy if exists "Authenticated users can create artworks" on public.artworks;
drop policy if exists "Public artworks are viewable by everyone" on public.artworks;
drop policy if exists "Users can update own artworks" on public.artworks;
drop policy if exists "Users can delete own artworks" on public.artworks;
create policy "Visible artworks are readable"
  on public.artworks for select to anon, authenticated
  using (
    visibility = 'public'
    or user_id = (select auth.uid())
    or receiver_id = (select auth.uid())
  );
create policy "Authenticated users can create artworks"
  on public.artworks for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (
      (is_anonymous and receiver_id is not null and visibility = 'anonymous')
      or (not is_anonymous and visibility in ('public', 'private'))
    )
  );
create policy "Creators can update artworks"
  on public.artworks for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "Creators or recipients can delete artworks"
  on public.artworks for delete to authenticated
  using (user_id = (select auth.uid()) or receiver_id = (select auth.uid()));

drop policy if exists "Authenticated users can like" on public.likes;
drop policy if exists "Users can unlike" on public.likes;
create policy "Authenticated users can like"
  on public.likes for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can unlike"
  on public.likes for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Authenticated users can repost" on public.reposts;
drop policy if exists "Users can unrepost" on public.reposts;
create policy "Authenticated users can repost"
  on public.reposts for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can unrepost"
  on public.reposts for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Authenticated users can follow" on public.follows;
drop policy if exists "Users can unfollow" on public.follows;
create policy "Authenticated users can follow"
  on public.follows for insert to authenticated
  with check (
    (select auth.uid()) = follower_id
    and follower_id <> following_id
  );
create policy "Users can unfollow"
  on public.follows for delete to authenticated
  using ((select auth.uid()) = follower_id);

drop policy if exists "Authenticated users can comment" on public.comments;
drop policy if exists "Users can delete own comments" on public.comments;
create policy "Authenticated users can comment"
  on public.comments for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can delete own comments"
  on public.comments for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "System can create notifications" on public.notifications;
drop policy if exists "Users can view own notifications" on public.notifications;
drop policy if exists "Users can update own notifications" on public.notifications;
drop policy if exists "Users can delete own notifications" on public.notifications;
create policy "Users can view own notifications"
  on public.notifications for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can update own notifications"
  on public.notifications for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users can delete own notifications"
  on public.notifications for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can view own bookmarks" on public.bookmarks;
drop policy if exists "Authenticated users can bookmark" on public.bookmarks;
drop policy if exists "Users can remove bookmarks" on public.bookmarks;
create policy "Users can view own bookmarks"
  on public.bookmarks for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Authenticated users can bookmark"
  on public.bookmarks for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can remove bookmarks"
  on public.bookmarks for delete to authenticated
  using ((select auth.uid()) = user_id);

create index if not exists idx_bookmarks_artwork on public.bookmarks (artwork_id);
create index if not exists idx_comments_user on public.comments (user_id);
create index if not exists idx_notifications_actor on public.notifications (actor_id);
create index if not exists idx_notifications_artwork on public.notifications (artwork_id);
create index if not exists idx_artworks_feed on public.artworks (visibility, created_at desc);
create index if not exists idx_artworks_received on public.artworks (receiver_id, created_at desc);

drop policy if exists "Avatar images are publicly accessible" on storage.objects;
drop policy if exists "Banner images are publicly accessible" on storage.objects;
drop policy if exists "Preview images are publicly accessible" on storage.objects;
drop policy if exists "Authenticated users can upload previews" on storage.objects;
drop policy if exists "Users can update own avatar" on storage.objects;
drop policy if exists "Users can upload own avatar" on storage.objects;
drop policy if exists "Users can upload own banner" on storage.objects;

create policy "Users can upload own media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('avatars', 'banners', 'previews')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Users can update own media"
  on storage.objects for update to authenticated
  using (
    bucket_id in ('avatars', 'banners', 'previews')
    and owner_id = (select auth.uid())::text
  )
  with check (
    bucket_id in ('avatars', 'banners', 'previews')
    and owner_id = (select auth.uid())::text
  );
create policy "Users can delete own media"
  on storage.objects for delete to authenticated
  using (
    bucket_id in ('avatars', 'banners', 'previews')
    and owner_id = (select auth.uid())::text
  );

grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.profile_stats, public.artworks,
  public.likes, public.reposts, public.follows, public.comments, public.challenges
  to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant insert, update, delete on public.artworks to authenticated;
grant insert, delete on public.likes, public.reposts, public.follows,
  public.comments, public.bookmarks to authenticated;
grant select on public.bookmarks, public.notifications to authenticated;
grant update, delete on public.notifications to authenticated;

commit;

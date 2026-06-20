begin;

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

  safe_username := left(base_username, 30);
  if exists (select 1 from public.profiles where username = safe_username) then
    safe_username := left(base_username, 21) || '_' || left(replace(new.id::text, '-', ''), 8);
  end if;

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

revoke all on function private.handle_new_user() from public, anon, authenticated;

drop policy if exists "Likes are viewable by everyone" on public.likes;
create policy "Likes follow artwork visibility"
  on public.likes for select to anon, authenticated
  using (
    exists (
      select 1 from public.artworks
      where public.artworks.id = likes.artwork_id
    )
  );

drop policy if exists "Reposts are viewable by everyone" on public.reposts;
create policy "Reposts follow artwork visibility"
  on public.reposts for select to anon, authenticated
  using (
    exists (
      select 1 from public.artworks
      where public.artworks.id = reposts.artwork_id
    )
  );

drop policy if exists "Comments are viewable by everyone" on public.comments;
create policy "Comments follow artwork visibility"
  on public.comments for select to anon, authenticated
  using (
    exists (
      select 1 from public.artworks
      where public.artworks.id = comments.artwork_id
    )
  );

commit;

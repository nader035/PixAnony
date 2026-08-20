begin;

-- Keep the original square grid_size column for backwards compatibility while
-- adding explicit dimensions for rectangular artwork. Every existing artwork
-- remains byte-for-byte compatible with its current pixel_data and layers JSON.
alter table public.artworks
  add column if not exists grid_width integer,
  add column if not exists grid_height integer,
  add column if not exists artwork_kind text not null default 'standard',
  add column if not exists source_challenge_id uuid;

update public.artworks
set grid_width = grid_size,
    grid_height = grid_size
where grid_width is null or grid_height is null;

alter table public.artworks
  alter column grid_width set default 16,
  alter column grid_height set default 16,
  alter column grid_width set not null,
  alter column grid_height set not null;

alter table public.artworks
  drop constraint if exists artworks_grid_dimensions,
  add constraint artworks_grid_dimensions check (
    grid_width between 8 and 128
    and grid_height between 8 and 128
    and grid_width * grid_height <= 16384
  ),
  drop constraint if exists artworks_pixel_data_dimensions,
  add constraint artworks_pixel_data_dimensions check (
    jsonb_typeof(pixel_data) = 'array'
    and jsonb_array_length(pixel_data) = grid_width * grid_height
  ),
  drop constraint if exists artworks_kind_check,
  add constraint artworks_kind_check check (
    artwork_kind in (
      'standard',
      'challenge_template',
      'challenge_submission',
      'admin_studio',
      'admin_delivery'
    )
  );

-- Expand the existing challenges table instead of replacing it. Temporal
-- state (upcoming, active, ended) is derived from the published lifecycle and
-- the start/end dates, which avoids stale status values.
alter table public.challenges
  add column if not exists slug text,
  add column if not exists instructions text,
  add column if not exists starts_at timestamptz,
  add column if not exists status text not null default 'draft',
  add column if not exists grid_width integer,
  add column if not exists grid_height integer,
  add column if not exists template_artwork_id uuid,
  add column if not exists template_mode text not null default 'editable',
  add column if not exists cover_artwork_id uuid,
  add column if not exists created_by uuid,
  add column if not exists published_at timestamptz,
  add column if not exists archived_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

update public.challenges
set slug = coalesce(
      nullif(slug, ''),
      'challenge-' || left(replace(id::text, '-', ''), 12)
    ),
    starts_at = coalesce(starts_at, created_at, now()),
    grid_width = coalesce(grid_width, 16),
    grid_height = coalesce(grid_height, 16)
where slug is null
   or starts_at is null
   or grid_width is null
   or grid_height is null;

alter table public.challenges
  alter column slug set not null,
  alter column starts_at set not null,
  alter column grid_width set not null,
  alter column grid_height set not null,
  alter column participants_count set default 0,
  alter column participants_count set not null,
  drop constraint if exists challenges_slug_format,
  add constraint challenges_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  drop constraint if exists challenges_status_check,
  add constraint challenges_status_check check (status in ('draft', 'published', 'archived')),
  drop constraint if exists challenges_template_mode_check,
  add constraint challenges_template_mode_check check (template_mode in ('editable', 'locked')),
  drop constraint if exists challenges_schedule_check,
  add constraint challenges_schedule_check check (ends_at > starts_at),
  drop constraint if exists challenges_grid_dimensions,
  add constraint challenges_grid_dimensions check (
    grid_width between 8 and 128
    and grid_height between 8 and 128
    and grid_width * grid_height <= 16384
  ),
  drop constraint if exists challenges_participants_nonnegative,
  add constraint challenges_participants_nonnegative check (participants_count >= 0);

create unique index if not exists challenges_slug_unique
  on public.challenges (slug);
create index if not exists challenges_lifecycle_dates
  on public.challenges (status, starts_at, ends_at);
create index if not exists challenges_created_by
  on public.challenges (created_by);

alter table public.challenges
  drop constraint if exists challenges_template_artwork_id_fkey,
  add constraint challenges_template_artwork_id_fkey
    foreign key (template_artwork_id) references public.artworks(id) on delete set null,
  drop constraint if exists challenges_cover_artwork_id_fkey,
  add constraint challenges_cover_artwork_id_fkey
    foreign key (cover_artwork_id) references public.artworks(id) on delete set null,
  drop constraint if exists challenges_created_by_fkey,
  add constraint challenges_created_by_fkey
    foreign key (created_by) references public.profiles(id) on delete set null;

alter table public.artworks
  drop constraint if exists artworks_source_challenge_id_fkey,
  add constraint artworks_source_challenge_id_fkey
    foreign key (source_challenge_id) references public.challenges(id) on delete set null,
  drop constraint if exists artworks_challenge_kind_consistency,
  add constraint artworks_challenge_kind_consistency check (
    artwork_kind not in ('challenge_template', 'challenge_submission')
    or source_challenge_id is not null
  ),
  drop constraint if exists artworks_anonymous_receiver,
  add constraint artworks_anonymous_receiver check (
    not is_anonymous
    or receiver_id is not null
    or (artwork_kind = 'admin_delivery' and visibility = 'public')
  );

create index if not exists artworks_source_challenge
  on public.artworks (source_challenge_id, created_at desc)
  where source_challenge_id is not null;
create index if not exists artworks_kind_created
  on public.artworks (artwork_kind, created_at desc);

create table if not exists public.challenge_submissions (
  id uuid primary key default extensions.uuid_generate_v4(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  artwork_id uuid not null unique references public.artworks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'submitted',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  submitted_at timestamptz not null default now(),
  constraint challenge_submissions_status_check
    check (status in ('submitted', 'featured')),
  constraint challenge_submissions_one_per_user
    unique (challenge_id, user_id)
);

alter table public.challenge_submissions enable row level security;

create index if not exists challenge_submissions_challenge_date
  on public.challenge_submissions (challenge_id, submitted_at desc);
create index if not exists challenge_submissions_user_date
  on public.challenge_submissions (user_id, submitted_at desc);
create index if not exists challenge_submissions_reviewed_by
  on public.challenge_submissions (reviewed_by)
  where reviewed_by is not null;

create table if not exists public.admin_pixel_deliveries (
  id uuid primary key default extensions.uuid_generate_v4(),
  artwork_id uuid not null unique references public.artworks(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  target_user_id uuid references public.profiles(id) on delete set null,
  audience text not null,
  identity text not null,
  created_at timestamptz not null default now(),
  constraint admin_pixel_deliveries_audience_check
    check (audience in ('user', 'everyone')),
  constraint admin_pixel_deliveries_identity_check
    check (identity in ('admin', 'anonymous')),
  constraint admin_pixel_deliveries_target_check
    check (
      (audience = 'user' and target_user_id is not null)
      or (audience = 'everyone' and target_user_id is null)
    )
);

alter table public.admin_pixel_deliveries enable row level security;

create index if not exists admin_pixel_deliveries_created
  on public.admin_pixel_deliveries (created_at desc);
create index if not exists admin_pixel_deliveries_target
  on public.admin_pixel_deliveries (target_user_id, created_at desc)
  where target_user_id is not null;

create or replace function private.touch_challenge_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.published_at := case
    when new.status = 'published' and old.status is distinct from 'published'
      then now()
    else new.published_at
  end;
  new.archived_at := case
    when new.status = 'archived' and old.status is distinct from 'archived'
      then now()
    when new.status <> 'archived' then null
    else new.archived_at
  end;
  return new;
end;
$$;

revoke all on function private.touch_challenge_updated_at() from public, anon, authenticated;
drop trigger if exists touch_challenge_updated_at on public.challenges;
create trigger touch_challenge_updated_at
  before update on public.challenges
  for each row execute function private.touch_challenge_updated_at();

create or replace function private.sync_challenge_participant_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_challenge_id uuid := coalesce(new.challenge_id, old.challenge_id);
begin
  update public.challenges c
  set participants_count = (
    select count(*)::integer
    from public.challenge_submissions s
    where s.challenge_id = resolved_challenge_id
  )
  where c.id = resolved_challenge_id;
  return null;
end;
$$;

revoke all on function private.sync_challenge_participant_count() from public, anon, authenticated;
drop trigger if exists sync_challenge_participant_count on public.challenge_submissions;
create trigger sync_challenge_participant_count
  after insert or delete on public.challenge_submissions
  for each row execute function private.sync_challenge_participant_count();

-- Public users can discover only published challenges. Admin management remains
-- enforced by the existing platform.manage permission at the database layer.
drop policy if exists "Challenges are viewable by everyone" on public.challenges;
create policy "Published challenges are viewable"
  on public.challenges for select to anon, authenticated
  using (status = 'published');
create policy "Admins can view all challenges"
  on public.challenges for select to authenticated
  using ((select public.has_permission('platform.manage')));
create policy "Admins can create challenges"
  on public.challenges for insert to authenticated
  with check (
    (select public.has_permission('platform.manage'))
    and created_by = (select auth.uid())
  );
create policy "Admins can update challenges"
  on public.challenges for update to authenticated
  using ((select public.has_permission('platform.manage')))
  with check ((select public.has_permission('platform.manage')));
create policy "Admins can delete challenges"
  on public.challenges for delete to authenticated
  using ((select public.has_permission('platform.manage')));

create policy "Published challenge submissions are viewable"
  on public.challenge_submissions for select to anon, authenticated
  using (
    exists (
      select 1
      from public.challenges c
      where c.id = challenge_submissions.challenge_id
        and c.status = 'published'
    )
  );
create policy "Admins can view all challenge submissions"
  on public.challenge_submissions for select to authenticated
  using ((select public.has_permission('platform.manage')));

create policy "Admins can read pixel delivery records"
  on public.admin_pixel_deliveries for select to authenticated
  using ((select public.has_permission('platform.manage')));

-- Regular clients may create only ordinary artwork. Challenge, template,
-- studio, and delivery rows are written through permission-checked RPCs.
drop policy if exists "Authenticated users can create artworks" on public.artworks;
create policy "Authenticated users can create standard artworks"
  on public.artworks for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and artwork_kind = 'standard'
    and source_challenge_id is null
    and (
      (is_anonymous and receiver_id is not null and visibility = 'anonymous')
      or (not is_anonymous and visibility in ('public', 'private'))
    )
  );

drop policy if exists "Creators can update artworks" on public.artworks;
create policy "Creators can update standard artworks"
  on public.artworks for update to authenticated
  using (
    user_id = (select auth.uid())
    and artwork_kind = 'standard'
  )
  with check (
    user_id = (select auth.uid())
    and artwork_kind = 'standard'
    and source_challenge_id is null
  );

-- Preserve the existing report-first moderation workflow while ensuring a
-- moderator cannot use it to delete admin-only templates or studio drafts.
create or replace function public.moderate_artwork(
  target_artwork_id uuid,
  linked_report_id uuid default null,
  note text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  acting_user_id uuid := (select auth.uid());
  artwork_owner_id uuid;
  target_artwork_kind text;
  can_manage_all boolean := public.has_permission('platform.manage');
  has_active_report boolean;
begin
  if acting_user_id is null
    or not public.has_permission('artworks.moderate') then
    raise exception 'Insufficient permission to remove artwork'
      using errcode = '42501';
  end if;

  if note is not null and char_length(btrim(note)) > 2000 then
    raise exception 'Moderation note is too long';
  end if;

  select a.user_id, a.artwork_kind
  into artwork_owner_id, target_artwork_kind
  from public.artworks a
  where a.id = target_artwork_id
  for update;

  if not found then
    return false;
  end if;

  if not can_manage_all
    and target_artwork_kind not in ('standard', 'challenge_submission', 'admin_delivery') then
    raise exception 'This artwork requires an administrator'
      using errcode = '42501';
  end if;

  select exists (
    select 1
    from public.reports r
    where r.target_id = target_artwork_id
      and r.status in ('open', 'in_review')
  ) into has_active_report;

  if not can_manage_all and not has_active_report then
    raise exception 'Moderators can remove only reported artwork'
      using errcode = '42501';
  end if;

  if linked_report_id is not null and not exists (
    select 1
    from public.reports r
    where r.id = linked_report_id
      and r.target_id = target_artwork_id
  ) then
    raise exception 'Report does not match the artwork';
  end if;

  update public.reports
  set status = 'resolved',
      assigned_to = coalesce(assigned_to, acting_user_id),
      resolved_by = acting_user_id,
      resolution_note = coalesce(nullif(btrim(note), ''), 'Artwork removed'),
      resolved_at = now(),
      updated_at = now()
  where target_id = target_artwork_id
    and status in ('open', 'in_review');

  insert into public.moderation_actions (
    actor_id,
    action,
    report_id,
    target_id,
    target_owner_id,
    note
  )
  values (
    acting_user_id,
    'artwork_removed',
    linked_report_id,
    target_artwork_id,
    artwork_owner_id,
    coalesce(nullif(btrim(note), ''), 'Artwork removed')
  );

  delete from public.artworks where id = target_artwork_id;
  return true;
end;
$$;

revoke all on function public.moderate_artwork(uuid, uuid, text) from public, anon;
grant execute on function public.moderate_artwork(uuid, uuid, text) to authenticated;

create or replace function public.save_challenge_template(
  target_challenge_id uuid,
  template_grid_width integer,
  template_grid_height integer,
  template_pixel_data jsonb,
  template_layers jsonb,
  lock_template boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  acting_user_id uuid := (select auth.uid());
  challenge_record public.challenges%rowtype;
  saved_artwork_id uuid;
begin
  if acting_user_id is null
    or not public.has_permission('platform.manage') then
    raise exception 'Insufficient permission to manage challenge templates'
      using errcode = '42501';
  end if;

  if template_grid_width not between 8 and 128
    or template_grid_height not between 8 and 128
    or template_grid_width * template_grid_height > 16384
    or jsonb_typeof(template_pixel_data) <> 'array'
    or jsonb_array_length(template_pixel_data) <> template_grid_width * template_grid_height
    or jsonb_typeof(template_layers) <> 'array' then
    raise exception 'Invalid challenge template data';
  end if;

  select * into challenge_record
  from public.challenges
  where id = target_challenge_id
  for update;

  if not found then
    raise exception 'Challenge not found';
  end if;

  saved_artwork_id := challenge_record.template_artwork_id;
  if saved_artwork_id is null then
    insert into public.artworks (
      user_id,
      title,
      caption,
      grid_size,
      grid_width,
      grid_height,
      pixel_data,
      layers,
      visibility,
      is_anonymous,
      artwork_kind,
      source_challenge_id
    )
    values (
      acting_user_id,
      challenge_record.title || ' template',
      challenge_record.description,
      template_grid_width,
      template_grid_width,
      template_grid_height,
      template_pixel_data,
      template_layers,
      'public',
      false,
      'challenge_template',
      target_challenge_id
    )
    returning id into saved_artwork_id;
  else
    update public.artworks
    set user_id = acting_user_id,
        title = challenge_record.title || ' template',
        caption = challenge_record.description,
        grid_size = template_grid_width,
        grid_width = template_grid_width,
        grid_height = template_grid_height,
        pixel_data = template_pixel_data,
        layers = template_layers,
        visibility = 'public',
        is_anonymous = false,
        artwork_kind = 'challenge_template',
        source_challenge_id = target_challenge_id
    where id = saved_artwork_id;
  end if;

  update public.challenges
  set template_artwork_id = saved_artwork_id,
      cover_artwork_id = coalesce(cover_artwork_id, saved_artwork_id),
      grid_width = template_grid_width,
      grid_height = template_grid_height,
      template_mode = case when lock_template then 'locked' else 'editable' end
  where id = target_challenge_id;

  return saved_artwork_id;
end;
$$;

revoke all on function public.save_challenge_template(uuid, integer, integer, jsonb, jsonb, boolean)
  from public, anon;
grant execute on function public.save_challenge_template(uuid, integer, integer, jsonb, jsonb, boolean)
  to authenticated;

create or replace function public.submit_challenge_entry(
  target_challenge_id uuid,
  entry_title text,
  entry_caption text,
  entry_grid_width integer,
  entry_grid_height integer,
  entry_pixel_data jsonb,
  entry_layers jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  acting_user_id uuid := (select auth.uid());
  challenge_record public.challenges%rowtype;
  template_pixels jsonb;
  saved_artwork_id uuid;
begin
  if acting_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select * into challenge_record
  from public.challenges
  where id = target_challenge_id
  for share;

  if not found then
    raise exception 'Challenge not found';
  end if;
  if challenge_record.status <> 'published'
    or challenge_record.starts_at > now()
    or challenge_record.ends_at <= now() then
    raise exception 'Challenge is not accepting submissions'
      using errcode = '42501';
  end if;
  if entry_grid_width <> challenge_record.grid_width
    or entry_grid_height <> challenge_record.grid_height
    or jsonb_typeof(entry_pixel_data) <> 'array'
    or jsonb_array_length(entry_pixel_data) <> entry_grid_width * entry_grid_height
    or jsonb_typeof(entry_layers) <> 'array' then
    raise exception 'Entry dimensions do not match the challenge';
  end if;
  if char_length(coalesce(entry_title, '')) > 120
    or char_length(coalesce(entry_caption, '')) > 2000 then
    raise exception 'Entry text is too long';
  end if;

  if challenge_record.template_mode = 'locked'
    and challenge_record.template_artwork_id is not null then
    select pixel_data into template_pixels
    from public.artworks
    where id = challenge_record.template_artwork_id;

    if exists (
      select 1
      from generate_series(0, jsonb_array_length(template_pixels) - 1) as pixel_index
      where coalesce(template_pixels ->> pixel_index, 'transparent') <> 'transparent'
        and entry_pixel_data ->> pixel_index is distinct from template_pixels ->> pixel_index
    ) then
      raise exception 'Locked challenge pixels cannot be changed'
        using errcode = '42501';
    end if;
  end if;

  insert into public.artworks (
    user_id,
    title,
    caption,
    grid_size,
    grid_width,
    grid_height,
    pixel_data,
    layers,
    visibility,
    is_anonymous,
    artwork_kind,
    source_challenge_id
  )
  values (
    acting_user_id,
    coalesce(nullif(btrim(entry_title), ''), challenge_record.title),
    nullif(btrim(entry_caption), ''),
    entry_grid_width,
    entry_grid_width,
    entry_grid_height,
    entry_pixel_data,
    entry_layers,
    'public',
    false,
    'challenge_submission',
    target_challenge_id
  )
  returning id into saved_artwork_id;

  insert into public.challenge_submissions (challenge_id, artwork_id, user_id)
  values (target_challenge_id, saved_artwork_id, acting_user_id);

  return saved_artwork_id;
end;
$$;

revoke all on function public.submit_challenge_entry(uuid, text, text, integer, integer, jsonb, jsonb)
  from public, anon;
grant execute on function public.submit_challenge_entry(uuid, text, text, integer, integer, jsonb, jsonb)
  to authenticated;

create or replace function public.save_admin_pixel_art(
  target_artwork_id uuid,
  artwork_title text,
  artwork_caption text,
  artwork_grid_width integer,
  artwork_grid_height integer,
  artwork_pixel_data jsonb,
  artwork_layers jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  acting_user_id uuid := (select auth.uid());
  saved_artwork_id uuid;
begin
  if acting_user_id is null
    or not public.has_permission('platform.manage') then
    raise exception 'Insufficient permission to use Pixel Studio'
      using errcode = '42501';
  end if;
  if artwork_grid_width not between 8 and 128
    or artwork_grid_height not between 8 and 128
    or artwork_grid_width * artwork_grid_height > 16384
    or jsonb_typeof(artwork_pixel_data) <> 'array'
    or jsonb_array_length(artwork_pixel_data) <> artwork_grid_width * artwork_grid_height
    or jsonb_typeof(artwork_layers) <> 'array'
    or char_length(coalesce(artwork_title, '')) > 120
    or char_length(coalesce(artwork_caption, '')) > 2000 then
    raise exception 'Invalid Pixel Studio artwork data';
  end if;

  if target_artwork_id is null then
    insert into public.artworks (
      user_id,
      title,
      caption,
      grid_size,
      grid_width,
      grid_height,
      pixel_data,
      layers,
      visibility,
      is_anonymous,
      artwork_kind
    )
    values (
      acting_user_id,
      coalesce(nullif(btrim(artwork_title), ''), 'Pixel Studio artwork'),
      nullif(btrim(artwork_caption), ''),
      artwork_grid_width,
      artwork_grid_width,
      artwork_grid_height,
      artwork_pixel_data,
      artwork_layers,
      'private',
      false,
      'admin_studio'
    )
    returning id into saved_artwork_id;
  else
    update public.artworks
    set user_id = acting_user_id,
        title = coalesce(nullif(btrim(artwork_title), ''), 'Pixel Studio artwork'),
        caption = nullif(btrim(artwork_caption), ''),
        grid_size = artwork_grid_width,
        grid_width = artwork_grid_width,
        grid_height = artwork_grid_height,
        pixel_data = artwork_pixel_data,
        layers = artwork_layers
    where id = target_artwork_id
      and artwork_kind = 'admin_studio'
    returning id into saved_artwork_id;

    if saved_artwork_id is null then
      raise exception 'Pixel Studio artwork not found';
    end if;
  end if;

  return saved_artwork_id;
end;
$$;

revoke all on function public.save_admin_pixel_art(uuid, text, text, integer, integer, jsonb, jsonb)
  from public, anon;
grant execute on function public.save_admin_pixel_art(uuid, text, text, integer, integer, jsonb, jsonb)
  to authenticated;

create or replace function public.deliver_admin_pixel_art(
  source_artwork_id uuid,
  delivery_audience text,
  delivery_target_user_id uuid default null,
  delivery_identity text default 'admin'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  acting_user_id uuid := (select auth.uid());
  source_record public.artworks%rowtype;
  delivered_artwork_id uuid;
  anonymous_delivery boolean;
begin
  if acting_user_id is null
    or not public.has_permission('platform.manage') then
    raise exception 'Insufficient permission to deliver Pixel Studio artwork'
      using errcode = '42501';
  end if;
  if delivery_audience not in ('user', 'everyone')
    or delivery_identity not in ('admin', 'anonymous')
    or (delivery_audience = 'user' and delivery_target_user_id is null)
    or (delivery_audience = 'everyone' and delivery_target_user_id is not null) then
    raise exception 'Invalid delivery options';
  end if;
  if delivery_target_user_id is not null
    and not exists (select 1 from public.profiles where id = delivery_target_user_id) then
    raise exception 'Delivery recipient not found';
  end if;

  select * into source_record
  from public.artworks
  where id = source_artwork_id
    and artwork_kind = 'admin_studio';

  if not found then
    raise exception 'Pixel Studio artwork not found';
  end if;

  anonymous_delivery := delivery_identity = 'anonymous';
  insert into public.artworks (
    user_id,
    receiver_id,
    title,
    caption,
    grid_size,
    grid_width,
    grid_height,
    pixel_data,
    layers,
    visibility,
    is_anonymous,
    artwork_kind
  )
  values (
    acting_user_id,
    case when delivery_audience = 'user' then delivery_target_user_id else null end,
    source_record.title,
    source_record.caption,
    source_record.grid_size,
    source_record.grid_width,
    source_record.grid_height,
    source_record.pixel_data,
    source_record.layers,
    case
      when delivery_audience = 'everyone' then 'public'
      when anonymous_delivery then 'anonymous'
      else 'private'
    end,
    anonymous_delivery,
    'admin_delivery'
  )
  returning id into delivered_artwork_id;

  insert into public.admin_pixel_deliveries (
    artwork_id,
    created_by,
    target_user_id,
    audience,
    identity
  )
  values (
    delivered_artwork_id,
    acting_user_id,
    delivery_target_user_id,
    delivery_audience,
    delivery_identity
  );

  if delivery_audience = 'everyone' then
    insert into public.notifications (user_id, actor_id, artwork_id, type)
    select
      p.id,
      case when anonymous_delivery then null else acting_user_id end,
      delivered_artwork_id,
      'received_pixel'
    from public.profiles p
    where p.id <> acting_user_id;
  end if;

  return delivered_artwork_id;
end;
$$;

revoke all on function public.deliver_admin_pixel_art(uuid, text, uuid, text)
  from public, anon;
grant execute on function public.deliver_admin_pixel_art(uuid, text, uuid, text)
  to authenticated;

-- Keep administrative templates and drafts out of public profile statistics.
drop view if exists public.profile_stats;
create view public.profile_stats
with (security_invoker = true)
as
select
  p.*,
  (select count(*)::integer from public.follows f where f.following_id = p.id) as followers_count,
  (select count(*)::integer from public.follows f where f.follower_id = p.id) as following_count,
  (
    select count(*)::integer
    from public.artworks a
    where a.user_id = p.id
      and a.visibility = 'public'
      and a.artwork_kind not in ('challenge_template', 'admin_studio')
  ) as paints_count,
  (
    select coalesce(sum(a.likes_count), 0)::integer
    from public.artworks a
    where a.user_id = p.id
      and a.visibility = 'public'
      and a.artwork_kind not in ('challenge_template', 'admin_studio')
  ) as likes_count
from public.profiles p;

revoke all on public.challenge_submissions, public.admin_pixel_deliveries
  from public, anon, authenticated;
grant select on public.challenges, public.challenge_submissions to anon, authenticated;
grant insert, update, delete on public.challenges to authenticated;
grant select on public.admin_pixel_deliveries to authenticated;
grant select on public.profile_stats to anon, authenticated;

commit;

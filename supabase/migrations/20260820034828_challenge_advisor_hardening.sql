begin;

-- Cover every newly introduced foreign key that is used during cleanup or
-- dashboard filtering.
create index if not exists challenges_template_artwork
  on public.challenges (template_artwork_id)
  where template_artwork_id is not null;
create index if not exists challenges_cover_artwork
  on public.challenges (cover_artwork_id)
  where cover_artwork_id is not null;
create index if not exists admin_pixel_deliveries_created_by
  on public.admin_pixel_deliveries (created_by, created_at desc);

-- Keep one SELECT policy per role/action. Anonymous visitors only need the
-- public branch, while signed-in users can additionally use permission checks.
drop policy if exists "Published challenges are viewable" on public.challenges;
drop policy if exists "Admins can view all challenges" on public.challenges;
create policy "Published challenges are viewable anonymously"
  on public.challenges for select to anon
  using (status = 'published');
create policy "Published or admin challenges are viewable"
  on public.challenges for select to authenticated
  using (
    status = 'published'
    or (select public.has_permission('platform.manage'))
  );

drop policy if exists "Published challenge submissions are viewable"
  on public.challenge_submissions;
drop policy if exists "Admins can view all challenge submissions"
  on public.challenge_submissions;
create policy "Published challenge submissions are viewable anonymously"
  on public.challenge_submissions for select to anon
  using (
    exists (
      select 1
      from public.challenges c
      where c.id = challenge_submissions.challenge_id
        and c.status = 'published'
    )
  );
create policy "Published or admin challenge submissions are viewable"
  on public.challenge_submissions for select to authenticated
  using (
    exists (
      select 1
      from public.challenges c
      where c.id = challenge_submissions.challenge_id
        and c.status = 'published'
    )
    or (select public.has_permission('platform.manage'))
  );

-- The reported-artwork helper is meaningful only for authenticated staff.
-- Give anonymous visitors a simple public-artwork policy so the helper no
-- longer needs to be exposed as an anonymous RPC.
drop policy if exists "Visible and staff-authorized artworks are readable"
  on public.artworks;
create policy "Public artworks are readable anonymously"
  on public.artworks for select to anon
  using (visibility = 'public');
create policy "Visible and staff-authorized artworks are readable"
  on public.artworks for select to authenticated
  using (
    visibility = 'public'
    or user_id = (select auth.uid())
    or receiver_id = (select auth.uid())
    or (select public.has_permission('content.read_all'))
    or (select public.can_read_reported_artwork(artworks.id))
  );

revoke execute on function public.can_read_reported_artwork(uuid) from anon;

commit;

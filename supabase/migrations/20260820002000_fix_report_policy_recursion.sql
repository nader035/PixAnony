begin;

-- Keep the reported-artwork lookup outside the two tables' RLS expressions.
-- Without this narrow helper, reports INSERT -> artworks SELECT -> reports SELECT
-- can recurse even though each individual policy is otherwise valid.
create or replace function public.can_read_reported_artwork(
  target_artwork_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_permission('reports.read')
    and exists (
      select 1
      from public.reports r
      where r.target_id = target_artwork_id
        and r.status in ('open', 'in_review')
    );
$$;

revoke all on function public.can_read_reported_artwork(uuid) from public;
grant execute on function public.can_read_reported_artwork(uuid) to anon, authenticated;

drop policy if exists "Visible and staff-authorized artworks are readable"
  on public.artworks;

create policy "Visible and staff-authorized artworks are readable"
  on public.artworks for select to anon, authenticated
  using (
    visibility = 'public'
    or user_id = (select auth.uid())
    or receiver_id = (select auth.uid())
    or (select public.has_permission('content.read_all'))
    or (select public.can_read_reported_artwork(artworks.id))
  );

commit;

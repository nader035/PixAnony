begin;

-- These tables are intentionally RPC-only. Explicit false policies document
-- that direct reads are denied and keep the security advisor signal clean.
create policy "No direct user role reads"
  on public.user_roles for select to authenticated
  using (false);

create policy "No direct permission map reads"
  on public.role_permissions for select to authenticated
  using (false);

-- Merge staff and ordinary visibility rules into one SELECT policy so each
-- artwork query evaluates a single permissive policy for authenticated users.
drop policy if exists "Visible artworks are readable" on public.artworks;
drop policy if exists "Admins can read all artworks" on public.artworks;
drop policy if exists "Moderators can read reported artworks" on public.artworks;

create policy "Visible and staff-authorized artworks are readable"
  on public.artworks for select to anon, authenticated
  using (
    visibility = 'public'
    or user_id = (select auth.uid())
    or receiver_id = (select auth.uid())
    or (select public.has_permission('content.read_all'))
    or (
      (select public.has_permission('reports.read'))
      and exists (
        select 1
        from public.reports r
        where r.target_id = artworks.id
          and r.status in ('open', 'in_review')
      )
    )
  );

drop policy if exists "Users can read their own reports" on public.reports;
drop policy if exists "Staff can read reports" on public.reports;

create policy "Owners and staff can read reports"
  on public.reports for select to authenticated
  using (
    reporter_id = (select auth.uid())
    or (select public.has_permission('reports.read'))
  );

create index if not exists idx_user_roles_assigned_by
  on public.user_roles (assigned_by);
create index if not exists idx_role_audit_actor
  on public.role_audit_log (actor_id);
create index if not exists idx_role_audit_target
  on public.role_audit_log (target_user_id);
create index if not exists idx_reports_artwork
  on public.reports (artwork_id);
create index if not exists idx_reports_target_owner
  on public.reports (target_owner_id);
create index if not exists idx_reports_assigned_to
  on public.reports (assigned_to);
create index if not exists idx_reports_resolved_by
  on public.reports (resolved_by);
create index if not exists idx_moderation_actions_actor
  on public.moderation_actions (actor_id);
create index if not exists idx_moderation_actions_report
  on public.moderation_actions (report_id);
create index if not exists idx_moderation_actions_target_owner
  on public.moderation_actions (target_owner_id);

commit;

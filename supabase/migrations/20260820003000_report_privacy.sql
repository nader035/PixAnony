begin;

-- A reporter only needs to submit a report. Queue metadata contains internal
-- target-account references and is therefore visible only to authorized staff.
drop policy if exists "Owners and staff can read reports" on public.reports;

create policy "Staff can read reports"
  on public.reports for select to authenticated
  using ((select public.has_permission('reports.read')));

commit;

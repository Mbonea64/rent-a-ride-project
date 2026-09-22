create table if not exists public.vehicle_issue_reports (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  vendor_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null,
  note text,
  status text not null default 'open'
    check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.vehicle_change_requests (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  vendor_id uuid not null references public.profiles (id) on delete cascade,
  proposed_changes jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists vehicle_issue_reports_status_idx
  on public.vehicle_issue_reports (status, created_at desc);
create index if not exists vehicle_issue_reports_vendor_idx
  on public.vehicle_issue_reports (vendor_id, created_at desc);
create index if not exists vehicle_change_requests_status_idx
  on public.vehicle_change_requests (status, created_at desc);
create index if not exists vehicle_change_requests_vendor_idx
  on public.vehicle_change_requests (vendor_id, created_at desc);

alter table public.vehicle_issue_reports enable row level security;
alter table public.vehicle_change_requests enable row level security;

revoke all on public.vehicle_issue_reports, public.vehicle_change_requests from anon, authenticated;
grant select, insert, update on public.vehicle_issue_reports to authenticated;
grant select, insert, update on public.vehicle_change_requests to authenticated;

create policy "vehicle_issue_reports_participant_select"
on public.vehicle_issue_reports
for select
to authenticated
using (vendor_id = (select auth.uid()) or public.is_admin());

create policy "vehicle_issue_reports_vendor_insert"
on public.vehicle_issue_reports
for insert
to authenticated
with check (
  vendor_id = (select auth.uid())
  and exists (
    select 1
    from public.vehicles
    where vehicles.id = vehicle_issue_reports.vehicle_id
      and vehicles.owner_id = (select auth.uid())
  )
);

create policy "vehicle_issue_reports_admin_update"
on public.vehicle_issue_reports
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "vehicle_change_requests_participant_select"
on public.vehicle_change_requests
for select
to authenticated
using (vendor_id = (select auth.uid()) or public.is_admin());

create policy "vehicle_change_requests_vendor_insert"
on public.vehicle_change_requests
for insert
to authenticated
with check (
  vendor_id = (select auth.uid())
  and exists (
    select 1
    from public.vehicles
    where vehicles.id = vehicle_change_requests.vehicle_id
      and vehicles.owner_id = (select auth.uid())
  )
);

create policy "vehicle_change_requests_admin_update"
on public.vehicle_change_requests
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

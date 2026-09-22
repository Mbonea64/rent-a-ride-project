alter table public.vehicles
  add column if not exists odometer_km integer check (odometer_km is null or odometer_km >= 0),
  add column if not exists vehicle_condition text check (
    vehicle_condition is null
    or vehicle_condition in ('excellent', 'good', 'fair', 'needs_minor_attention')
  ),
  add column if not exists ownership_status text check (
    ownership_status is null
    or ownership_status in ('owner', 'authorized_agent', 'company_vehicle')
  ),
  add column if not exists inspection_status text check (
    inspection_status is null
    or inspection_status in ('valid', 'pending_renewal', 'not_available')
  ),
  add column if not exists tracker_status text check (
    tracker_status is null
    or tracker_status in ('installed', 'not_installed', 'can_install')
  ),
  add column if not exists service_history text,
  add column if not exists paperwork_status text,
  add column if not exists rental_notes text,
  add column if not exists last_service_on date;

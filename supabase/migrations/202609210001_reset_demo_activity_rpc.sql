create or replace function public.reset_demo_activity()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  booking_ids uuid[];
  deleted_bookings integer := 0;
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  select coalesce(array_agg(id), '{}'::uuid[])
  into booking_ids
  from public.bookings;

  if coalesce(array_length(booking_ids, 1), 0) = 0 then
    return jsonb_build_object('deleted_bookings', 0);
  end if;

  delete from public.payments
  where booking_id = any(booking_ids);

  delete from public.invoices
  where booking_id = any(booking_ids);

  delete from public.loyalty_transactions
  where booking_id = any(booking_ids);

  delete from public.bookings
  where id = any(booking_ids);

  get diagnostics deleted_bookings = row_count;

  return jsonb_build_object('deleted_bookings', deleted_bookings);
end;
$$;

revoke all on function public.reset_demo_activity() from public;
grant execute on function public.reset_demo_activity() to authenticated;

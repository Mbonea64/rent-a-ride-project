create or replace function public.submit_booking_payment(
  p_booking_id uuid,
  p_provider text default 'Customer submitted',
  p_reference text default null
)
returns public.payments
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_payment public.payments;
begin
  if not exists (
    select 1
    from public.bookings as booking
    where booking.id = p_booking_id
      and booking.customer_id = (select auth.uid())
  ) then
    raise exception 'Only the booking customer can submit payment proof'
      using errcode = '42501';
  end if;

  update public.payments
  set
    status = 'submitted'::public.payment_status,
    provider = coalesce(nullif(p_provider, ''), provider),
    provider_reference = nullif(p_reference, ''),
    updated_at = now()
  where booking_id = p_booking_id
  returning * into updated_payment;

  if updated_payment.id is null then
    insert into public.payments (
      booking_id,
      provider,
      provider_reference,
      amount,
      status
    )
    select
      booking.id,
      coalesce(nullif(p_provider, ''), 'Customer submitted'),
      nullif(p_reference, ''),
      booking.total_price,
      'submitted'::public.payment_status
    from public.bookings as booking
    where booking.id = p_booking_id
    returning * into updated_payment;
  end if;

  return updated_payment;
end;
$$;

create or replace function public.set_booking_payment_review_status(
  p_booking_id uuid,
  p_status text,
  p_provider text default null,
  p_reference text default null
)
returns public.payments
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_status public.payment_status;
  updated_payment public.payments;
begin
  if not public.is_admin() then
    raise exception 'Only admins can update payment review status'
      using errcode = '42501';
  end if;

  if p_status not in ('pending', 'submitted', 'awaiting_confirmation', 'under_review', 'paid', 'failed', 'refunded') then
    raise exception 'Unsupported payment status %', p_status
      using errcode = '22023';
  end if;

  requested_status := p_status::public.payment_status;

  update public.payments
  set
    status = requested_status,
    provider = coalesce(nullif(p_provider, ''), provider),
    provider_reference = coalesce(nullif(p_reference, ''), provider_reference),
    updated_at = now()
  where booking_id = p_booking_id
  returning * into updated_payment;

  if updated_payment.id is null then
    insert into public.payments (
      booking_id,
      provider,
      provider_reference,
      amount,
      status
    )
    select
      booking.id,
      coalesce(nullif(p_provider, ''), 'Admin review'),
      nullif(p_reference, ''),
      booking.total_price,
      requested_status
    from public.bookings as booking
    where booking.id = p_booking_id
    returning * into updated_payment;
  end if;

  return updated_payment;
end;
$$;

revoke all on function public.submit_booking_payment(uuid, text, text) from public;
revoke all on function public.set_booking_payment_review_status(uuid, text, text, text) from public;
grant execute on function public.submit_booking_payment(uuid, text, text) to authenticated;
grant execute on function public.set_booking_payment_review_status(uuid, text, text, text) to authenticated;

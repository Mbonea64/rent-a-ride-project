alter table public.profiles
  add column if not exists email text;

update public.profiles as profile
set email = auth_user.email
from auth.users as auth_user
where profile.id = auth_user.id
  and profile.email is null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role public.app_role;
begin
  requested_role := case
    when new.raw_user_meta_data ->> 'role' = 'vendor' then 'vendor'::public.app_role
    else 'customer'::public.app_role
  end;

  insert into public.profiles (id, username, email, avatar_url, role)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'username', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(coalesce(new.email, 'new-user'), '@', 1)
    ),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    requested_role
  );

  return new;
end;
$$;

grant update (email) on public.profiles to authenticated;

create or replace function public.confirm_booking_payment(
  p_booking_id uuid,
  p_provider text default 'Admin verified',
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
  if not public.is_admin() then
    raise exception 'Only admins can confirm payments'
      using errcode = '42501';
  end if;

  update public.payments
  set
    status = 'paid',
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
      coalesce(nullif(p_provider, ''), 'Admin verified'),
      nullif(p_reference, ''),
      booking.total_price,
      'paid'::public.payment_status
    from public.bookings as booking
    where booking.id = p_booking_id
    returning * into updated_payment;
  end if;

  if updated_payment.id is null then
    raise exception 'Booking payment could not be confirmed'
      using errcode = 'P0002';
  end if;

  return updated_payment;
end;
$$;

revoke all on function public.confirm_booking_payment(uuid, text, text) from public;
grant execute on function public.confirm_booking_payment(uuid, text, text) to authenticated;

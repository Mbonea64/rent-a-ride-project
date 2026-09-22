alter type public.payment_status add value if not exists 'submitted';
alter type public.payment_status add value if not exists 'awaiting_confirmation';
alter type public.payment_status add value if not exists 'under_review';

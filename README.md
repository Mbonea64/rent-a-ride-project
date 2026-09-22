# Rent a Ride

Rent a Ride is a Vite/React application backed by Supabase. Supabase provides the
PostgreSQL database, authentication, Row-Level Security, file storage, and database
functions used by the booking flow. There is no Express server or MongoDB dependency.

## Backend structure

- `supabase/migrations/202609090001_initial_schema.sql` creates the tables, constraints,
  indexes, authorization policies, Storage bucket, and transactional booking functions.
- `supabase/seed.sql` provides three sample vehicles for local development.
- `client/src/services` is the browser-facing data layer.
- `client/src/lib/supabase.js` is the only place that creates the Supabase client.

The database prevents overlapping active reservations with a PostgreSQL exclusion
constraint. Booking price, rental days, delivery fee, and coupon discount are calculated
inside `create_booking`; values sent by the browser are not trusted.

## Configure Supabase

1. Create a Supabase project.
2. Install or invoke the Supabase CLI, sign in, and link this folder:

   ```bash
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npm run supabase:push:dry-run
   npm run supabase:push
   npx supabase functions deploy delete-account
   npx supabase functions deploy send-whatsapp
   npx supabase functions deploy send-email
   ```

3. Copy `client/.env.example` to `client/.env` and add the project URL and publishable key:

   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
   ```

4. In Supabase Auth, set the Site URL to the deployed frontend URL and add local and
   deployed callback URLs. Enable Google only after the provider credentials and callback
   URLs are configured.
5. Create the first account normally, then promote it once from the SQL editor:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = (select id from auth.users where email = 'admin@example.com');
   ```

Never place a Supabase secret/service-role key in a `VITE_` variable or in browser code.

## Configure Google login

The customer and vendor login screens already call Supabase OAuth for Google. The remaining
setup is in Supabase and Google Cloud:

1. In Supabase Dashboard > Authentication > Providers > Google, copy the callback URL.
   It is usually:

   ```text
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```

2. In Google Cloud Console > APIs & Services > Credentials, create an OAuth Client ID for a
   Web application. Add the Supabase callback URL as an authorized redirect URI.
3. Copy the Google Client ID and Client Secret back into Supabase's Google provider settings,
   then enable the provider.
4. In Supabase Dashboard > Authentication > URL Configuration, add these redirect URLs:

   ```text
   http://localhost:5173/**
   http://localhost:5184/**
   https://YOUR_DEPLOYED_FRONTEND_URL/**
   ```

No Google secret belongs in `client/.env`. The browser only needs the Supabase URL and
publishable key.

## Configure WhatsApp Cloud API

Payment confirmation messages are sent through the `send-whatsapp` Supabase Edge Function.
The browser never receives the Meta access token.

1. In Meta for Developers, create or open a WhatsApp Business app.
2. In WhatsApp > API Setup, copy:
   - Phone Number ID
   - A system user access token with `whatsapp_business_messaging`
3. Add the secrets locally in `supabase/functions/.env`:

   ```env
   WHATSAPP_ACCESS_TOKEN=EAAG...
   WHATSAPP_PHONE_NUMBER_ID=123456789012345
   WHATSAPP_GRAPH_VERSION=v20.0
   ```

4. Add the same secrets to the hosted Supabase project:

   ```bash
   npx supabase secrets set --env-file supabase/functions/.env
   npx supabase functions deploy send-whatsapp
   ```

5. For real customer notifications outside the WhatsApp 24-hour support window, create and
   approve a WhatsApp message template in Meta, then add:

   ```env
   WHATSAPP_TEMPLATE_NAME=payment_confirmation
   WHATSAPP_TEMPLATE_LANGUAGE=en_US
   ```

The admin payment confirmation flow will attempt WhatsApp delivery and show the provider
status in the Notifications dashboard.

## Configure Email delivery

Payment confirmation emails are sent through the `send-email` Supabase Edge Function. This
project uses Brevo by default because its transactional email API can send to normal customer
emails after you verify a sender address.

1. Create a Brevo account, open the developer/API area, and generate an SMTP/API key.
2. In Brevo, create and verify the sender email you want Rent a Ride to send from.
2. Add the email secrets in `supabase/functions/.env`:

   ```env
   EMAIL_PROVIDER=brevo
   BREVO_API_KEY=xkeysib-...
   EMAIL_FROM=Rent a Ride <your-verified-sender@example.com>
   ```

3. Push the secrets and deploy the function:

   ```bash
   npx supabase secrets set --env-file supabase/functions/.env
   npx supabase functions deploy send-email
   ```

For a controlled demo inbox, you can optionally set `EMAIL_DEMO_TO=you@example.com`. Remove
that value when you want the app to send to the customer's real checkout email.

## Local development

Docker is required only for the local Supabase stack. To apply migrations to a
hosted Supabase project, use `npm run supabase:push` instead of
`npm run supabase:reset`.

```bash
npm run supabase:start
npm run supabase:reset
npm run dev
```

The local reset applies migrations and loads `supabase/seed.sql`. Email confirmation is
disabled only in the checked-in local configuration; hosted-project Auth settings control
the production behavior.

## Verification

```bash
npm run build
npm run lint
```

The existing app still has unrelated lint warnings in legacy admin UI files. The production
Vite build is the current release gate until those are cleaned up.

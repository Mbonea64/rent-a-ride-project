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
   ```

3. Copy `client/.env.example` to `client/.env` and add the project URL and publishable key:

   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
   ```

4. In Supabase Auth, set the Site URL to the deployed frontend URL and add local and
   deployed callback URLs. Enable Google and Facebook only after their provider credentials
   and callback URLs are configured.
5. Create the first account normally, then promote it once from the SQL editor:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = (select id from auth.users where email = 'admin@example.com');
   ```

Never place a Supabase secret/service-role key in a `VITE_` variable or in browser code.

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

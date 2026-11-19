# TeachMatch

TeachMatch connects teachers with schools hiring across Nigeria. This starter includes the public homepage, teacher and school sign-up, sign-in, and the first Supabase profile schema.

## Run locally

1. Install Node.js with npm.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and add your Supabase project URL and publishable key.
4. Run the SQL in `supabase/migrations/202611040001_initial_profiles.sql` in your Supabase project's SQL Editor.
5. Add `http://localhost:3000/auth/callback` to the allowed Auth redirect URLs in Supabase.
6. Run `npm run dev` and open `http://localhost:3000`.

Use only the Supabase **publishable** key in `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Never put a secret or service-role key in a `NEXT_PUBLIC_` variable or browser code.

Without Supabase credentials, the homepage and forms render, but sign-up and sign-in explain that the connection is not configured. School accounts start with a `pending` verification status.

## Main routes

- `/` — job search and TeachMatch introduction
- `/register` — teacher or school account registration
- `/login` — account sign-in
- `/dashboard` — signed-in welcome page
- `/auth/callback` — email confirmation callback

The files in `reference/` preserve the first standalone homepage mockup.

# ZaKumbukumbu

React/Vite memorial and eulogy site backed by Supabase Auth, Supabase Database, and Supabase Storage.

The app no longer needs the old Express/MySQL backend. New memorial creators log in with Supabase Auth, memorial/eulogy records are stored in Supabase tables, and uploaded photos are stored in the public `eulogy-photos` Storage bucket.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create a Supabase project.

3. In Supabase, open SQL Editor and run:

```txt
supabase/eulogies.sql
```

4. Create `.env.local` from `.env.example`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_SUPABASE_PHOTO_BUCKET=eulogy-photos
```

5. Start the local site:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

## Supabase Notes

- Use the public anon key in the React app. Do not put the Supabase service-role key in any frontend environment variable.
- `supabase/eulogies.sql` creates the database tables, Row Level Security policies, and the public `eulogy-photos` bucket.
- New memorials require a logged-in creator account.
- Guests can add extra eulogies and photos to an existing published memorial.
- Only the memorial creator, or a user with `role: admin` in Supabase Auth user metadata, can delete a memorial, eulogy entry, or photo metadata.

## Build

```bash
npm run build
```

The production files are generated in `dist/`.

## Hosting

Deploy this as a static site. The hosting platform only needs to run:

```bash
npm install && npm run build
```

and publish:

```txt
dist
```

Set these production environment variables on the hosting platform before building:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_SUPABASE_PHOTO_BUCKET=eulogy-photos
```

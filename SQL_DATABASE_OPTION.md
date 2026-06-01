# Supabase Database Setup

This project now uses Supabase directly instead of a custom MySQL or PostgreSQL backend.

Supabase provides:

- PostgreSQL tables for memorials, eulogy entries, and photo metadata
- Supabase Auth for creator accounts
- Supabase Storage for uploaded memorial photos
- Row Level Security so the browser can safely call Supabase with the public anon key

## Schema File

Run this file once in your Supabase SQL Editor:

```txt
supabase/eulogies.sql
```

It creates:

- `memorials`
- `eulogy_entries`
- `memorial_photos`
- the public `eulogy-photos` Storage bucket
- policies for public reading, creator-owned memorial management, and guest eulogy/photo submissions

## Environment Variables

Use these in `.env.local` for local development and in your hosting provider for production:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_SUPABASE_PHOTO_BUCKET=eulogy-photos
```

Never expose a Supabase service-role key in React. Only the anon key belongs in the frontend.

## If You Want MySQL Later

A React app should not connect directly to MySQL because browser environment variables are public. For MySQL, you would need:

```txt
React app -> Backend API -> MySQL database
```

For this version, Supabase replaces that backend/database layer.

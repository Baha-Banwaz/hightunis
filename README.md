# HighTunis

Luxury real-estate showcase for Tunisia — Next.js 16 (App Router) + Supabase, with a password-protected admin panel at `/admin`.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Create `.env.local` (and set the same values in Vercel → Project → Settings → Environment Variables):

| Variable | Exposure | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Supabase anon key (safe to expose — RLS protects data) |
| `SUPABASE_SERVICE_ROLE_KEY` | **server-only** | Used by the admin API to bypass RLS. Never expose. |
| `ADMIN_PASSWORD` | **server-only** | Password for `/admin/login` |
| `ADMIN_SESSION_SECRET` | **server-only** | Signs the admin session cookie. Generate with `openssl rand -hex 32` |
| `NEXT_PUBLIC_SITE_URL` | public | Canonical site URL for SEO/sitemap (optional; defaults to the Vercel URL) |

⚠️ Never prefix a secret with `NEXT_PUBLIC_` — those values are compiled into the JavaScript sent to every visitor.

## Database setup

1. Run `supabase-schema.sql` in the Supabase SQL Editor to create tables + seed data (fresh projects only).
2. Run `supabase-migration-security.sql` on the **existing** project to lock down Row Level Security and add indexes. Public visitors can only read published content and submit contact inquiries; all admin writes go through `/api/admin/*` with the service role.

## Admin panel

- `/admin/login` — single password (`ADMIN_PASSWORD`), verified server-side. On success an HTTP-only signed session cookie (8h) is set.
- `proxy.ts` redirects unauthenticated visitors away from `/admin/*`; the API routes independently verify the cookie.
- Content edits automatically revalidate the affected public pages (`revalidatePath`), so changes appear immediately; pages also re-generate hourly (ISR).

## Site configuration

Brand facts (contact emails, HQ, social URLs) live in `lib/site-config.ts`. **Update the social links there to your real profiles** — they currently point at placeholder handles.

## Adding image hosts

`next/image` only loads remote images from hosts allowed in `next.config.ts` (`images.remotePatterns`). Unsplash, Pexels, and Supabase Storage are allowed; add any new host there.

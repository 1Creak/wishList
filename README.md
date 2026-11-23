# Wishlist

Wishlist site with multiple users: Google / email sign-in, item rarity (colour-coded), secret reservations
(visible to everyone except the list owner), private lists by invite link, UA/EN interface.

**Stack:** Vite + React + TypeScript + Tailwind CSS v4 · Supabase (Postgres, Auth, Storage) · GitHub Pages.

Live: https://1creak.github.io/wishList/

## Local development

```bash
npm install
cp .env.example .env   # fill in the Supabase URL and publishable key
npm run dev
```

## Supabase setup (one time)

1. **Database:** open *SQL Editor → New query*, paste `supabase/migrations/0001_init.sql`, press *Run*.
2. **Auth → URL Configuration**
   - Site URL: `https://1creak.github.io/wishList/`
   - Redirect URLs: `https://1creak.github.io/wishList/**` and `http://localhost:5173/wishList/**`
3. **Auth → Providers → Google:** enable and paste the Client ID / Secret from Google Cloud Console
   (OAuth client of type *Web application*, authorized redirect URI:
   `https://pkqlejtnznfhxjsynyvo.supabase.co/auth/v1/callback`).

## GitHub Pages

*Settings → Pages → Build and deployment → Source: GitHub Actions.* Every push to `main` deploys the site.
The `keep-alive` workflow pings Supabase every 3 days so the free project is not paused.

## Security notes

- The publishable key in `.env.production` is public by design; all data is protected by Row Level Security.
- Reservations live in a separate table that the list owner cannot read (enforced in the database, not the UI).
- Images: only JPEG/PNG/WebP, ≤ 5 MB and ≤ 3000×3000 px on input; re-encoded in the browser to ≤ 1200 px WebP
  (strips EXIF). The storage bucket additionally enforces 1 MB and the MIME whitelist server-side.

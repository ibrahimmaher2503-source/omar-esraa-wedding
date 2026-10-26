# Omar & Esraa — Our Wedding Invitation

React + TypeScript, Vite, Tailwind CSS, Framer Motion and Lucide.
Run npm ci, then npm run dev. Build with npm run build.

Wedding configuration is in src/main.tsx; styles in src/style.css.
Friday November 6, 2026. Cairo time (Africa/Cairo). Arrival 14:00, celebration 15:00, refreshments 17:00, photographs 18:00.
Al Masa Hall, Banha — Kafr El-Gazzar. Address unconfirmed; venue link intentionally opens a search.

No fictional, magical or Harry Potter themed copy is used. Stock couple photographs and invented family/church details are no longer displayed. Original floral illustration assets remain. User-supplied background music is configured.
RSVP and guestbook submit to Vercel Functions and a shared Neon Postgres database. Messages and responses are private; `/admin` requires sign-in and provides attendance counts and paginated responses. No guest data is exposed through a public listing endpoint.

Run `npm test` for input, session, request-boundary, and audio tests; `npm run build` for TypeScript and production assets. The real database integration test runs when `DATABASE_URL`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`, and `ADMIN_TEST_PASSWORD` are available. It removes only its own test records.

The gift QR section is removed. User-supplied audio is bundled at public/assets/audio/wedding-song.m4a.

Audio: AAC copied losslessly from the uploaded file, with cover artwork removed and fast-start enabled. Autoplay is attempted on mount; Open Invitation retries synchronously on a user gesture if browser autoplay is blocked. Playback loops at 55% volume, without an on-page audio control.

The envelope displays the user-provided couple photograph, optimized to WebP without retouching.

Deployment needs the full repository on Vercel (Vite assets plus `api/` functions), not just `dist/`. Connect the Neon integration to production, configure the server-only variables from `.env.example`, and run `npm run db:migrate` once using an ignored `.env.local`. Migrations are additive and idempotent. Never prefix database credentials or admin secrets with `VITE_`.

The single administrator username is `admin`. Store `ADMIN_PASSWORD_HASH` as `<random salt in hex>:<64-byte scrypt hash in hex>` using Node's default scrypt parameters. Set `ADMIN_SESSION_SECRET` to a separate random secret. To change the password, replace the hash in Vercel, rotate the session secret to revoke existing sessions, and redeploy. The local `admin-access.txt` is intentionally excluded from Git and deployments.

`npm run dev` previews the frontend only. Use Vercel development tooling with an isolated database for local API work. Public writes allow 20 attempts per IP per 10 minutes; admin login allows 5 per IP per 15 minutes. IPs are stored only as HMAC hashes in the rate-limit table. Shared networks use the same allowance.

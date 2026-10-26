# Omar & Esraa — Our Wedding Invitation

React + TypeScript, Vite, Tailwind CSS, Framer Motion and Lucide.
Run npm ci, then npm run dev. Build with npm run build.

Wedding configuration is in src/main.tsx; styles in src/style.css.
Friday November 6, 2026. Cairo time (Africa/Cairo). Arrival 14:00, celebration 15:00, refreshments 17:00, photographs 18:00.
Al Masa Hall, Banha — Kafr El-Gazzar. Address unconfirmed; venue link intentionally opens a search.

No fictional, magical or Harry Potter themed copy is used. Stock couple photographs and invented family/church details are no longer displayed. Original floral illustration assets remain. User-supplied background music is configured.
RSVP and guestbook use localStorage and explicitly state that they are not sent to the couple. A shared backend is needed for real guest-response collection.

Validation: TypeScript and production build; browser opening and successful RSVP local saving; November 6 calendar and Cairo time checked.

Gift QR is a genuine scannable QR encoding DEMO ONLY text. It contains no bank account, payment link or financial recipient. User-supplied audio is bundled at public/assets/audio/wedding-song.m4a.

Audio: AAC copied losslessly from the uploaded file, with cover artwork removed and fast-start enabled. Autoplay is attempted on mount; Open Invitation retries synchronously on a user gesture if browser autoplay is blocked. The music button pauses/resumes playback; playback loops at 55% volume.

The envelope displays the user-provided couple photograph, optimized to WebP without retouching.

# Clay Studio

GitHub Pages frontend for the clay printing booking system.

The frontend requires school email verification through the separate Cloudflare backend. Student contact details, bookings, availability and authentication secrets are not stored in this repository. Login tokens are kept only in browser memory.

Build: `npm ci && npm run build`. Publish `main` / `docs` in Settings → Pages. After source changes, rebuild and commit the generated `docs` directory.

The backend must allow this Pages origin and validate every request. Cloudflare Access must allow OPTIONS preflight requests to reach that backend. Course data must be migrated before bookings can be used.

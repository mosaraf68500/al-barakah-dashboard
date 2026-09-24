# al-barakah-admin (Phase 2)

Admin dashboard for Al Barakah Premium — Next.js 15 (App Router) · React 19 · TypeScript strict · Tailwind v4 · TanStack Query · Zustand · Zod · react-hook-form (login/OTP forms).
**No Firebase anywhere.** The UI is a pixel-faithful port of the legacy `AdminDashboard` (see `../ADMIN_MIGRATION_REPORT.md`, `../BUG_FIXES.md`).

```bash
npm install
npm run dev -- -p 3002      # http://localhost:3002  (storefront default: 3000/3001)
```

Sign in with any e-mail + password, then any 6-digit code (**stub auth**, nothing is verified — Phase 3 replaces it).

## Data (TEMP until Phase 3)
- Reads: `data/seed/*.json` — a one-time Firestore export, **git-ignored** (real customer PII + live credentials). Duplicated from the storefront repo so each repo stays independent.
- Writes: every mutation is persisted to `data/runtime/*.json` (git-ignored, marked `// TEMP: Phase 2 only, replaced by real API in Phase 3`). Delete `data/runtime/` to reset.
- All data access goes through `lib/api/*` → `/api/*` route handlers → `lib/server/adminStore.ts`. Components never touch storage.
- The admin store is **separate from the storefront's**: admin edits do not show on the storefront yet (`../KNOWN_LIMITATIONS.md`).

## Integrations are simulated
Steadfast, Pathao, Telegram and Facebook (test buttons + auto-dispatch) return `[SIMULATED]` results and never leave this machine unless the server is started with `ENABLE_LIVE_INTEGRATIONS=true` (see `.env.example`). Do not enable it while the seed contains live credentials unless you mean it.

## Layout
`app/(admin)/*` routes · `components/<feature>/*` · `lib/api` (client wrappers) · `lib/server` (store, integrations, route helpers) · `lib/domain` (stock rule, metrics, customers, filters — pure) · `lib/validation` (Zod at the API boundary) · `providers/AdminAuthProvider` + `lib/auth/*` (adapter pattern; stub adapter).

## Do not deploy publicly
Until Phase 3: stub auth, PII and secrets in the data files.

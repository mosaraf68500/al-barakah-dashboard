# Admin seed data (snapshot - NOT production)

These JSON files are a **one-time export of the legacy Firestore database** (see `migration-scripts/`), duplicated from the storefront repo so that each repo stays independent (02-ARCHITECTURE §1). They are a point-in-time snapshot; nothing here is connected to production.

- `data/seed/*.json` is git-ignored: it contains **real customer PII** (orders) and **live credentials** (settings.json: Telegram token, courier keys, Facebook CAPI token).
- All admin edits are written to `data/runtime/` (git-ignored). Delete that folder to reset to this snapshot.
- Real integrations (Steadfast, Pathao, Telegram, Facebook) are **simulated** unless the server is started with `ENABLE_LIVE_INTEGRATIONS=true`.

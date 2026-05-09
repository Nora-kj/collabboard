# CollabBoard

Real-time collaborative whiteboard built for Gauntlet AI G4 Week 1. Spec: `docs/superpowers/specs/2026-05-09-collabboard-mvp-design.md`.

## Local development

1. Copy `.env.local.example` → `.env.local` and fill in Supabase + Liveblocks keys.
2. Run Supabase migrations (`supabase db push` from the `supabase/` directory).
3. `npm install`
4. `npm run dev`

## Tests

- Unit: `npm test`
- E2E (Playwright): `npm run test:e2e`

## Deploy

Push to `main` → Vercel auto-deploys.

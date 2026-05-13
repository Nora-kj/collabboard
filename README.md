# CollabBoard

Real-time collaborative whiteboard built for Gauntlet AI G4 Week 1.

**Live demo:** https://collabboard-lilac.vercel.app
**Spec:** [`docs/superpowers/specs/2026-05-09-collabboard-mvp-design.md`](docs/superpowers/specs/2026-05-09-collabboard-mvp-design.md)

## Architecture

- **Frontend:** Next.js 16 (App Router) + React + TypeScript + Konva.js
- **Realtime:** Liveblocks Storage (Yjs CRDT) + Liveblocks Presence
- **Auth + DB:** Supabase (email/password + magic link + anonymous for public boards)
- **Hosting:** Vercel

Conflict model: **field-level last-write-wins via Yjs CRDT**, with character-level merge for sticky/text bodies via `Y.Text`.

## Local development

1. Create a Supabase project and a Liveblocks project (see `docs/superpowers/plans/2026-05-09-collabboard-mvp.md` Task 0).
2. `cp .env.local.example .env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY`, `LIVEBLOCKS_SECRET_KEY`
3. Apply `supabase/migrations/20260509000000_init.sql` via the Supabase SQL editor.
4. In Supabase → Authentication → Sign In / Up: enable **Anonymous sign-ins** and disable **Confirm email** (for local dev).
5. `npm install`
6. `npm run dev`

## Tests

- Unit: `npm test`
- E2E: `npm run test:e2e`

## Manual MVP-gate verification

1. Two browser windows on the same `/b/<slug>` URL.
2. Window A creates a sticky → visible in B within ~150 ms.
3. Window A drags the sticky → final position appears in B on release.
4. Window A double-clicks → types text → blurs → text appears in B.
5. Window A creates a rectangle → appears in B.
6. Refresh window A → all objects persist.
7. Throttle network on A in DevTools → "reconnecting…" pill → restore → "live".
8. 5+ tabs simultaneously → all show synchronized cursors and edits.

## Deploy

Push to `main` → Vercel auto-deploys. Set the same env vars in Vercel project settings.

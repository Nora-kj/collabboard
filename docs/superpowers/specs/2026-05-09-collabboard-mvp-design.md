# CollabBoard — MVP Design

**Date:** 2026-05-09
**Project:** Gauntlet AI G4 Week 1 — CollabBoard
**Sprint deadlines:** Pre-Search Mon · MVP gate Tue (24h) · Early submission Fri · Final Sun 2026-05-17 22:59 CT
**Goal:** real-time collaborative whiteboard (Miro-style) + AI agent driven by natural-language commands.

---

## 1. Constraints (Pre-Search summary)

| Area | Constraint |
|---|---|
| Stack comfort | Deep React + TypeScript |
| Realtime experience | Prior Yjs / Liveblocks |
| Budget | $0 — free tiers only |
| AI provider | Anthropic Claude (Sonnet 4.6) |
| Time | 7 days; 24h hard MVP gate |
| Auth model | Email/password + magic link + anonymous (for public boards) |
| Performance targets | 60 FPS, <100 ms object sync, <50 ms cursor sync, 500+ objects, 5+ users |
| AI targets | <2 s single-step, ≥6 command types, multi-step planning |

## 2. Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│ Browser (Next.js 15 App Router · React 19 · TS · Konva)           │
│                                                                    │
│  ┌────────────────┐   ┌──────────────────┐   ┌─────────────────┐ │
│  │ Canvas surface │◄──┤ Liveblocks React │◄──┤ Supabase Auth   │ │
│  │ (Konva)        │   │ hooks (Yjs)      │   │ session         │ │
│  └────────────────┘   └─────────┬────────┘   └─────────────────┘ │
│                                  │                                 │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ AI command bar  ─►  POST /api/ai (SSE)  ─►  streams text +   │ │
│  │                       tool_use events; final mutation list   │ │
│  └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────┬─────────────────────────────────┘
                                   │
            ┌──────────────────────┼─────────────────────┐
            ▼                      ▼                     ▼
   ┌─────────────────┐   ┌──────────────────┐   ┌────────────────┐
   │ Liveblocks      │   │ Supabase         │   │ Anthropic API  │
   │ • Storage(Yjs)  │   │ • Auth           │   │ Claude Sonnet  │
   │ • Presence      │   │ • Postgres:      │   │ + tool use     │
   │ • Broadcast     │   │   boards,members │   │                │
   │ • Cursors       │   │   ai_command_log │   │                │
   └─────────────────┘   └──────────────────┘   └────────────────┘
```

Three planes of state:
1. **Per-board collaborative state** — Liveblocks Storage (Yjs document). Sticky notes, shapes, frames, connectors, transforms. CRDT, conflict-free.
2. **Per-board ephemeral state** — Liveblocks Presence/Broadcast. Cursors, current selection, name + assigned color.
3. **Account / board metadata** — Supabase Postgres. `profiles`, `boards`, `board_members`, `ai_command_log`.

Auth bridge: browser logs in via Supabase. Next.js route `/api/liveblocks-auth` reads the Supabase JWT, looks up board access in Postgres, and mints a Liveblocks access token scoped to room `<board_id>`.

## 3. Canvas library

**Konva.js + react-konva.** Brief explicitly lists it. Maintains 1:1 mapping between AI tool schema and Yjs Map mutations. tldraw v3 was considered (faster ship) but rejected to keep the "I built the multiplayer whiteboard" signal clear in the demo.

## 4. Data model

### 4.1 Liveblocks Storage (Yjs document, one per board)

```
y.doc
├── objects: Y.Map<objectId, Y.Map<field, value>>
│     // Each object is its own Y.Map → per-field edits never overwrite each other.
│     // sticky:    { type, x, y, width, height, color, text: Y.Text, rotation, z, createdBy }
│     // shape:     { type, kind: 'rect'|'ellipse'|'line', x, y, width, height,
│     //             color, stroke, strokeWidth, rotation, z, createdBy }
│     // text:      { type, x, y, width, color, fontSize, text: Y.Text, rotation, z, createdBy }
│     // frame:     { type, title, x, y, width, height, color, z, createdBy }
│     // connector: { type, fromId, toId, fromAnchor, toAnchor, style, color, z, createdBy }
│
└── zOrder: Y.Array<objectId>
      // Single source of truth for stacking. Move-to-front = remove + push.
```

Rules:
- One `Y.Map` per object so concurrent field edits both win.
- `text` is `Y.Text` for character-level merge in note bodies.
- World coordinates only. Pan/zoom is local UI state, never synced.

### 4.2 Liveblocks Presence

```ts
type Presence = {
  cursor: { x: number; y: number } | null;   // world coords, throttled to ~30 Hz
  selection: string[];                        // selected object ids
  name: string;                               // from Supabase profile or anon-otter
  color: string;                              // assigned per-session
}
```

### 4.3 Supabase Postgres

```sql
profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  display_name text NOT NULL,
  avatar_color text NOT NULL,
  created_at timestamptz DEFAULT now()
);

boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner uuid NOT NULL REFERENCES profiles(id),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  visibility text NOT NULL DEFAULT 'public'        -- 'public' | 'private'
    CHECK (visibility IN ('public','private')),
  created_at timestamptz DEFAULT now()
);

board_members (
  board_id uuid REFERENCES boards(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','editor','viewer')),
  PRIMARY KEY (board_id, user_id)
);

ai_command_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid REFERENCES boards(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  prompt text NOT NULL,
  model text NOT NULL,
  input_tokens int NOT NULL,
  output_tokens int NOT NULL,
  tool_calls jsonb NOT NULL,
  latency_ms int NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

`ai_command_log` powers the cost-analysis deliverable.

## 5. Realtime, conflicts, persistence

| Requirement | Implementation |
|---|---|
| Object sync <100 ms | Yjs delta auto-broadcast via Liveblocks WebSocket. |
| Cursor sync <50 ms | `useUpdateMyPresence` for cursor; throttle local emits to ~30 Hz with rAF debounce; cursors render in a separate Konva layer. |
| Conflict resolution | Field-level last-write-wins via Yjs CRDT. Character-level merge for text bodies via `Y.Text`. **Documented in README.** |
| Move conflicts | Two users dragging the same sticky → final position resolves by last write to `position`. Acceptable per brief. |
| Persistence | Liveblocks auto-persists the Yjs doc; survives all users disconnecting. |
| Reconnect | Liveblocks WebSocket reconnect with backoff + delta replay. UI shows pill: `live / reconnecting / offline`. |
| 5+ concurrent users | Liveblocks free tier supports many more; bottleneck is local rendering. |
| 500+ objects @ 60 FPS | (a) `Layer.cache()` on object layer when not editing. (b) Viewport culling — skip render for off-screen objects. (c) `doc.transact()` to batch bulk mutations into one broadcast. |

Two failure modes designed for explicitly:
1. **AI agent burst** — wrap multi-mutation tool runs in one `doc.transact()` so all stickies appear atomically.
2. **Drag storm** — throttle position writes to Yjs at ~60 Hz max during drag, commit final position on drop.

## 6. AI agent

**Execution model:** server plans, client applies.

```
User types command → client POSTs { prompt, boardSnapshot, boardId, viewportCenter } to /api/ai (SSE)
                                                                  │
Server (Next.js route handler):
  1. Verify Supabase JWT → confirm user is a board member.
  2. Initialize virtual board from boardSnapshot.
  3. Agentic loop with Anthropic SDK + tools:
       on each tool_use block:
         • simulate it on virtual board (mint IDs, update positions)
         • record the mutation in an ordered list
         • return tool_result so the model can plan its next step
       stop on stop_reason: "end_turn"
  4. Insert ai_command_log row (input/output tokens, latency_ms, tool_calls jsonb).
  5. Stream events back to client:
         event: text       { delta: "..." }
         event: tool_use   { name, input }
         event: complete   { message, mutations[] }
                                                                  ▼
Client receives `complete` → wraps mutations in doc.transact() → all users see it atomically.
```

Why server-plans / client-applies:
- One Yjs transaction per command → other users see "SWOT template appears" as one event, not 12 staggered creations.
- Avoids Liveblocks REST API rate limits and HTTP-per-write latency.
- Agent loop is pure data on the server — no Yjs doc needs to be threaded through Node.

### Tool schema (mirrors brief, plus viewport-aware defaults)

```ts
createStickyNote(text, x?, y?, color?)          // x/y default to viewportCenter
createShape(kind, x, y, width, height, color)
createFrame(title, x, y, width, height)
createConnector(fromId, toId, style?)
moveObject(objectId, x, y)
resizeObject(objectId, width, height)
updateText(objectId, newText)
changeColor(objectId, color)
getBoardState()                                  // simplified JSON snapshot
```

### Concurrency

Multiple users can hit `/api/ai` at the same time. Each command runs independently and commits a separate Yjs transaction. Yjs handles spatial overlap; Liveblocks broadcast handles ordering.

### Latency expectations

- Single-step (one tool call): ~700 ms – 1.5 s with Sonnet 4.6.
- Multi-step (SWOT, retro): 3 – 6 s. UI streams `text` events immediately so perceived latency stays low.

### Cost-analysis hook

Every `/api/ai` call writes one row to `ai_command_log`. End-of-week SQL aggregation populates the 100 / 1K / 10K / 100K user projections.

## 7. Auth & authorization

```
1. User visits /                 → Supabase Auth UI
2. Sign in via:
   • email + password   (instant, no SMTP setup)
   • magic link         (Supabase default email)
3. Browser holds Supabase session (httpOnly cookie via @supabase/ssr).
4. User opens /b/<slug>:
   • Server component checks board_members.
   • If member: render board page.
   • If not + board.visibility = 'public': auto-add as editor (anon if no account).
   • Else: 404.
5. Browser POSTs /api/liveblocks-auth on board mount:
   • Reads Supabase JWT.
   • Confirms board access in Postgres.
   • Mints Liveblocks access token scoped to room <board_id>,
     userInfo: { name, color }.
6. Browser uses token to connect Liveblocks WebSocket.
```

**Roles (MVP):** `owner` (delete/rename/manage members), `editor` (read+write+AI), `viewer` (read-only — post-MVP).

**Sharing:** `boards.visibility = 'public'` auto-grants editor to anyone with the link. New boards default to `public` to make grading trivial.

**Anonymous identity:** anonymous users get a generated `Anonymous Otter`-style display name, persisted in localStorage so refresh keeps the same identity.

**Token refresh:** Liveblocks token TTL handled automatically by `LiveblocksProvider`'s `authEndpoint` callback.

## 8. Module layout

```
collabboard/
├── src/
│   ├── app/                              # Next.js 15 App Router
│   │   ├── (auth)/sign-in/page.tsx
│   │   ├── (app)/page.tsx                # board list (logged-in home)
│   │   ├── (app)/b/[slug]/
│   │   │   ├── page.tsx                  # server: auth + access check
│   │   │   └── board-client.tsx          # client: <LiveblocksProvider>
│   │   ├── api/
│   │   │   ├── liveblocks-auth/route.ts  # mints scoped Liveblocks token
│   │   │   └── ai/route.ts               # SSE endpoint (Anthropic loop)
│   │   └── layout.tsx
│   │
│   ├── canvas/                           # Konva whiteboard
│   │   ├── Board.tsx                     # Stage + Layers (objects, cursors, ui)
│   │   ├── camera.ts                     # pan/zoom math
│   │   ├── selection.ts                  # single + marquee select
│   │   ├── tools/
│   │   │   ├── select-tool.ts
│   │   │   ├── sticky-tool.ts
│   │   │   ├── shape-tool.ts
│   │   │   └── connector-tool.ts
│   │   ├── nodes/
│   │   │   ├── StickyNode.tsx
│   │   │   ├── ShapeNode.tsx
│   │   │   ├── TextNode.tsx
│   │   │   ├── FrameNode.tsx
│   │   │   └── ConnectorNode.tsx
│   │   ├── cursors/CursorsLayer.tsx
│   │   └── presence/PresenceBar.tsx
│   │
│   ├── store/                            # Yjs ↔ React glue
│   │   ├── liveblocks.ts                 # createClient, Room types
│   │   ├── yjs-bindings.ts               # useObjects, useObject, useZOrder
│   │   ├── mutations.ts                  # createObject/move/resize/...
│   │   └── snapshot.ts                   # boardSnapshot() for AI route
│   │
│   ├── ai/
│   │   ├── tools.ts                      # Anthropic tool schemas
│   │   ├── agent.ts                      # server-side agentic loop
│   │   ├── stream.ts                     # SSE encoder/decoder
│   │   ├── CommandBar.tsx                # client UI
│   │   └── apply-mutations.ts            # client applies in doc.transact
│   │
│   ├── auth/
│   │   ├── supabase-client.ts
│   │   ├── supabase-server.ts            # @supabase/ssr
│   │   └── anon.ts                       # anonymous sign-in helper
│   │
│   └── lib/
│       ├── colors.ts                     # sticky + cursor palette
│       ├── ids.ts                        # nanoid wrapper
│       └── viewport.ts                   # culling helpers
│
├── supabase/migrations/                  # SQL migrations
├── docs/superpowers/specs/               # this design
├── tests/
│   ├── e2e/                              # Playwright multi-browser
│   └── unit/                             # Vitest
├── .env.local.example
└── README.md
```

**Boundary rules:**
- `canvas/` only knows Konva + React. Never imports `@liveblocks/*` directly — consumes hooks from `store/`.
- `store/` is the only place that knows Yjs/Liveblocks. AI's mutation-replay path uses the same `mutations.ts` as user interactions.
- `ai/agent.ts` is pure server logic — `(snapshot, prompt) → mutations[]`. Unit-testable without a live board.
- `app/api/*` routes are thin glue, no business logic.

## 9. Testing

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | `mutations.ts`, `camera.ts`, `selection.ts`, `ai/agent.ts` (mocked Anthropic) |
| Integration | Vitest + `@liveblocks/node` | In-memory Yjs doc, two simulated clients, assert convergence |
| E2E | Playwright | Two browser contexts → real-time sync, refresh persistence, AI SWOT visible to both users |
| Manual | Browser windows + DevTools throttling | The brief's 5 testing scenarios before each submission |

Coverage target: none for MVP. Push to ~70% on `mutations.ts` and `ai/agent.ts` between MVP and Friday.

## 10. Deployment

- **Frontend + API:** Vercel hobby. Auto-deploy on push to `main`. Preview deploys on PRs.
- **Database:** Supabase free project. Migrations via `supabase db push`.
- **Liveblocks:** one project on liveblocks.io.
- **Domain:** `collabboard.vercel.app`.

**Env vars (`.env.local.example`):**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=
LIVEBLOCKS_SECRET_KEY=
ANTHROPIC_API_KEY=
```

## 11. Scope cuts

| ✅ MVP (24h gate) | ⏭️ Post-MVP (by Fri) | ❌ Cut entirely |
|---|---|---|
| Infinite pan/zoom | Frames | Real-time voice/chat |
| Sticky notes (text + color) | Connectors / arrows | Comments / threads |
| Rectangles (one shape type) | Standalone text elements | Version history UI |
| Create / move / edit | Multi-select + marquee | Permissions UI beyond owner/editor |
| Real-time sync | Resize + rotate | Embedded media |
| Multiplayer cursors + names | Copy/paste/duplicate | Templates browser |
| Presence avatars | All shape types (circle, line) | RBAC granularity |
| Supabase Auth (email + magic + anon) | AI agent (all 6+ commands) | Mobile/touch optimization |
| Public board sharing | Streaming AI responses | Export to PNG/PDF |
| Vercel deploy | Cost-analysis SQL aggregation | |
| | Demo video + AI dev log | |

## 12. Risk register

1. **Konva + 500 objects perf** — viewport culling and `Layer.cache()` from day one, not bolted on later.
2. **Liveblocks free-tier MAU** — 100 MAU is well above grading needs.
3. **Anthropic latency on multi-step** — stream early; show "thinking…" text immediately so 5 s feels like 1 s.
4. **Anonymous auth identity drift** — store generated name in localStorage so refresh keeps the same identity.

## 13. Deliverable mapping (brief → design)

| Brief deliverable | Where it's covered |
|---|---|
| GitHub repo (setup + architecture + deployed link) | README + this spec |
| Demo video (3–5 min) | Manual recording after Friday cutoff |
| Pre-Search document | Source for §1 of this spec |
| AI Development Log (1 page) | Separate doc, drafted continuously |
| AI Cost Analysis | Driven by `ai_command_log` aggregation (§4.3, §6) |
| Deployed application | §10 |
| Social post | Manual after final |

---

**Status:** design complete, awaiting user review before implementation planning.

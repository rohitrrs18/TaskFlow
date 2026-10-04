# Known Limitations & Future Work

Honest disclosure of what this project does **not** do, and how it would be
improved with more time.

---

## Current Limitations

### 1. Sync peer is simulated client-side

The "remote store" is a `localStorage`-backed shim in `lib/sync.ts`. This was a
deliberate choice to satisfy the PS's "zero API" constraint during development
and demo.

**Trade-off:** The app demonstrates the full offline-first workflow — queuing,
pending states, auto-sync on reconnect, conflict resolution — but does not
exercise a real network round-trip.

**Why it's still valid:** The sync interface (`pushPendingTasks`,
`pullRemoteTasks`, `runFullSync`) is designed so that swapping in any REST
backend requires replacing only those 4 functions. The rest of the app is
untouched. See `ARCHITECTURE.md` for the interface contract.

**Production fix:** Replace `localStorage` calls with `fetch()` to
`/api/tasks` backed by **Vercel KV**, **Supabase**, or **Neon Postgres** —
all free tier, no API keys required. Estimated effort: 1 hour.

---

### 2. Cross-tab device simulation is manual

To demo a conflict between two "devices," the user clicks **Simulate remote
edit** in the sync panel. This writes a conflicting version into the fake
remote store. It's not a real cross-device session.

**Why:** Cross-device requires either a real backend (Limitation #1) or
WebRTC signaling (heavier to set up).

**Production fix:** With a real backend, two browser tabs (or two physical
devices) pointing at the same store would produce genuine cross-device
conflicts without manual simulation.

---

### 3. CRDT is field-level LWW only

The merge strategy is **last-write-wins per field** with a monotonic clock.
This is a pragmatic CRDT, not a full one like Yjs Automerge.

**Consequences:**
- Two edits to the same field → one wins deterministically (by deviceId)
- Rich-text or list-merging scenarios would lose data (LWW can't merge them)
- No causal consistency beyond per-field ordering

**Why it's fine for tasks:** Task fields are primitives (string, enum, date).
LWW is the correct choice for these. Only if we added collaborative text
editing or reorderable lists would we need Automerge/Yjs.

**Production fix:** Swap `lib/crdt.ts` for a Yjs document per task. Estimated
effort: 4 hours.

---

### 4. Service worker uses cache-first for assets, network-first for navigation

Simple strategy. Doesn't do:
- Stale-while-revalidate for API responses
- Background sync API (only listens for `sync` events if triggered externally)
- Version-aware cache invalidation beyond `VERSION` constant bump

**Production fix:** Use Workbox for battle-tested caching strategies.
Estimated effort: 2 hours.

---

### 5. No authentication or multi-user support

Anyone with the URL sees the same tasks. This is fine for a single-user
productivity tool but not for shared team workspaces.

**Production fix:** NextAuth.js (Auth.js) with a free OAuth provider
(GitHub OAuth has no cost). Estimated effort: 3 hours.

---

### 6. Not tested on Firefox / Safari

Only Chrome 130 was tested. Service workers, IndexedDB, and BroadcastChannel
are standardized and should work, but subtle differences exist (especially
Safari's PWA handling).

**Production fix:** Add Playwright browser tests. Estimated effort: 3 hours.

---

### 7. No server-side validation

Since there's no server, there's no validation of task fields on a remote
endpoint. A malicious client could push malformed tasks.

**Production fix:** Add zod schemas to the API route and validate on POST.
Estimated effort: 1 hour.

---

### 8. Accessibility not formally audited

- Keyboard navigation works (Tab, Escape, Enter)
- ARIA labels added to icon-only buttons
- Focus rings visible on interactive elements
- **Not audited:** screen reader compatibility, reduced-motion preferences,
  color-contrast on all combinations

**Production fix:** Lighthouse a11y audit + manual NVDA/VoiceOver testing.
Estimated effort: 3 hours.

---

## What's Deliberately Out of Scope

These are **not** limitations — they're intentional exclusions:

- **No LLM/AI features** — the PS didn't request them
- **No analytics** — privacy-first by design
- **No auth** — single-user demo scope
- **No email/notifications** — offline-first means no network dependency

---

## Priority Order If Given More Time

1. **Real backend** (Limitation #1) — highest value, unlocks real cross-device
2. **Yjs integration** (Limitation #3) — richer conflict handling
3. **Auth** (Limitation #5) — multi-user support
4. **Playwright tests** (Limitation #6) — cross-browser confidence
5. **Workbox rewrite** (Limitation #4) — production-grade SW
6. **A11y audit** (Limitation #8) — inclusive design
7. **Server validation** (Limitation #7) — hardened API
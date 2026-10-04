# Disclosure — External Dependencies, APIs, and AI Assistance

Full transparency about what this project uses.

---

## External APIs Used

**None.**

This application does **not** call any external API:
- ❌ No OpenAI / Anthropic / Google AI
- ❌ No Stripe / payments
- ❌ No Auth0 / OAuth providers
- ❌ No Firebase / Supabase
- ❌ No analytics services
- ❌ No CDN-hosted services (all assets bundled)

The app runs entirely on:
- The user's browser (compute + storage)
- Vercel's edge network (static hosting + Next.js runtime, if deployed)

---

## Datasets Used

**None.**

No external datasets are used. Sample tasks in screenshots were created manually
during testing.

---

## API Keys / Secrets Required

**None.**

The project has **zero** environment variables. Deploying to Vercel requires no
configuration — `vercel deploy` works out of the box.

---

## AI-Assisted Components

This codebase was developed with AI assistance (Claude by Anthropic) for:

- Initial scaffolding of Next.js App Router structure
- Tailwind CSS configuration and theme setup
- CRDT merge logic design (field-level LWW with monotonic clock)
- Service worker caching strategy
- Documentation drafting (this file and the 4 others)

**Every line of code was reviewed, tested, and adjusted by a human developer.**
The AI did not introduce any runtime dependencies, external calls, or
undisclosed data flows.

The AI was used as a **productivity tool** (like an IDE or a linter), not as a
runtime component. The deployed app contains no AI logic.

---

## Full Dependency Inventory

### Runtime dependencies (`package.json`)

| Package | Version | Purpose | License |
|---|---|---|---|
| `next` | 15.5.27 | React framework | MIT |
| `react` | 19.3.0 | UI library | MIT |
| `react-dom` | 19.3.0 | React DOM bindings | MIT |
| `dexie` | ^4.0.8 | IndexedDB wrapper | Apache-2.0 |
| `dexie-react-hooks` | ^1.1.7 | React hooks for Dexie | Apache-2.0 |
| `yjs` | ^13.6.18 | CRDT primitives (available; LWW impl. is custom) | MIT |
| `framer-motion` | ^11.3.0 | Animation library | MIT |
| `lucide-react` | ^0.417.0 | Icon set | ISC |
| `clsx` | ^2.1.1 | Class name utility | MIT |

### Dev dependencies

| Package | Version | Purpose | License |
|---|---|---|---|
| `typescript` | 5.5.3 | Type system | Apache-2.0 |
| `tailwindcss` | ^4 | Utility CSS | MIT |
| `@tailwindcss/postcss` | ^4 | Tailwind PostCSS plugin | MIT |
| `postcss` | 8.5.6 | CSS transformation | MIT |
| `autoprefixer` | 10.4.20 | CSS vendor prefixes | MIT |
| `@types/*` | latest | TypeScript type definitions | MIT |

**Total:** 15 direct dependencies, all open-source, all MIT/Apache/ISC licensed.

### Transitive dependencies

Managed by npm. Run `npm ls --all` for the full tree. All transitive deps are
also open-source; none require API keys or paid tiers.

---

## Storage & Data Handling

### What is stored, where, and for how long

| Data | Location | Lifetime |
|---|---|---|
| Task records | Browser IndexedDB (Dexie) | Until user clears site data |
| Sync log (last 20 entries) | Browser IndexedDB | Until user clears site data |
| Device ID | Browser localStorage | Until user clears site data |
| Theme preference | Browser localStorage | Until user clears site data |
| Service worker cache | Browser Cache Storage | Until user clears site data |
| Demo "remote" store | Browser localStorage | Until user clears site data |

**Nothing leaves the browser.** There is no server-side storage of user data in
the current implementation. If deployed with a real backend (see
`LIMITATIONS.md`), user data would be stored on that backend — which would be
disclosed separately.

### Telemetry / analytics

**None.** No `gtag`, no `posthog`, no `mixpanel`, no `plausible`. The app
performs zero outbound analytics calls.

### Cookies

**None.** The app does not set any cookies. Session state (if any) lives in
`sessionStorage`.

---

## Third-Party UI Assets

- **Icons:** Lucide React (`lucide-react`) — MIT licensed, no attribution required
- **Fonts:** System font stack (no Google Fonts, no network requests)
- **Images:** None externally loaded; the app has no external images

---

## Licensing

All code in this repository is original work unless otherwise noted in file
headers. The full project is available under the MIT license.

---

## Contact / Attribution

**Project:** TaskFlow — Offline-First Workspace
**Event:** ALGOTHON'26 · Problem Statement ALG-WEB-02
**License:** MIT

For questions about specific dependency usage, see the package's own
`LICENSE` file in `node_modules/<package>/`.


**By Rohit Sawant (RS)**
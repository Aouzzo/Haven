# [PRODUCT NAME] website

Marketing site + caregiver dashboard for a camera-free, wearable-free fall detection system for senior living.
WiFi signals plus an AI classifier detect possible falls and alert staff faster.

**Prototype. Not a medical device.** All dashboard data is simulated **SAMPLE DATA** until the live sensor feed is connected.

## Run locally

Requirements: Node.js 20.9+ (tested with Node 24 LTS).

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000.

- Demo dashboard: http://localhost:3000/login → **Use demo account**
  - `caregiver@demo.com` (Caregiver) or `director@demo.com` (Director/Admin), password `demo1234`
  - Mock auth only: the session is stored in `localStorage`. No real auth provider.
- Hidden demo controls inside the dashboard: **Ctrl+Shift+D** (trigger a sample fall, reset alerts, toggle automatic falls)
- Pilot leads (Director only): http://localhost:3000/admin/leads

Other scripts: `npm run build`, `npm run start`, `npm run lint`.

## Environment variables

Copy `.env.example` to `.env.local`. Never commit real values.

| Variable | Needed for | Notes |
|---|---|---|
| `LEADS_ADMIN_KEY` | `/admin/leads` in production | Any long random string. Without it, the leads API refuses reads in production (open in local dev). |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Keeping pilot leads on Vercel | Vercel KV / Upstash Redis REST credentials. Without them, leads go to `.data/leads.json` locally, or to `/tmp` on Vercel (temporary). |

## Deploy to Vercel

1. Import the repo in Vercel and set **Root Directory** to `web`.
2. Add `LEADS_ADMIN_KEY` (and KV variables if you want leads to persist).
3. Deploy. Or from the CLI: `cd web && npx vercel` then `npx vercel --prod`.

## Where the data comes from (swap point for live data)

All dashboard pages read from **one hook**, `useFacilityData()`, and never generate data themselves.

| File | What it is |
|---|---|
| `src/lib/facility/types.ts` | Data contract: `RoomStatusUpdate` (room_id, timestamp, status, per-activity probabilities, motion_level, still_seconds, optional alert) and the `FacilityDataSource` interface |
| `src/lib/facility/sample-data.ts` | **The only place sample data is generated** (rooms, simulated room states, a sample fall ~every 60 s, sensors, 8 weeks of alert history) |
| `src/lib/facility/source.ts` | **Swap point.** `createFacilitySource()` returns the sample source today. Return a live source (e.g. WebSocket) tomorrow. |
| `src/providers/facility-data-provider.tsx` | `FacilityDataProvider` + `useFacilityData()`: alert lifecycle, escalation timer, settings, evacuation state |
| `public/model_metrics.json` | AI model page metrics. Currently **PLACEHOLDER** values; replace with real test results. |

To go live: implement `FacilityDataSource` (`getSnapshot`, `subscribe`) over the real feed, set `kind: "live"` (the header badge switches from SAMPLE DATA to LIVE, or use `"replay"` for REPLAY), and return it from `createFacilitySource()`.

## Project structure

```
src/app/(marketing)/      Homepage, /about, /credits, /privacy
src/app/login/            Mock sign-in with demo accounts
src/app/dashboard/        Overview, rooms/[roomId], alerts, evacuation, reports, model, sensors, settings
src/app/admin/leads/      Pilot requests (Director only)
src/app/api/leads/        POST pilot form, GET leads (needs LEADS_ADMIN_KEY in production)
src/components/marketing/ Homepage sections
src/components/dashboard/ Shell, floor map, alert banner/modal, charts
src/lib/site.ts           Product name, price, team, stat sources (placeholders live here)
src/lib/status.ts         Status colors used everywhere
```

## Rules this codebase follows

- No testimonials, customer logos, user counts, or traction claims.
- Statistics link to their sources (verify the links in `src/lib/site.ts`).
- "Detects possible falls" / "alerts staff faster". Never a medical claim.
- Rooms by number only. No resident names, photos, or health info.
- The pilot form collects only name, work email, facility, role, number of rooms, and an optional message.
- Status colors: empty = gray, occupied/still = blue, moving = green, possible fall = red (pulsing).

## CREDITS

Open-source libraries (see also the `/credits` page):

| Library | License |
|---|---|
| [Next.js](https://nextjs.org) | MIT |
| [React](https://react.dev) | MIT |
| [Tailwind CSS](https://tailwindcss.com) | MIT |
| [shadcn/ui](https://ui.shadcn.com) (+ `cn`) | MIT |
| [Radix UI](https://www.radix-ui.com) | MIT |
| [Recharts](https://recharts.org) | MIT |
| [Lucide](https://lucide.dev) (lucide-react) | ISC |
| [class-variance-authority](https://cva.style) | Apache-2.0 |
| [tw-animate-css](https://github.com/Wombosvideo/tw-animate-css) | MIT |
| [Inter](https://rsms.me/inter/), [Plus Jakarta Sans](https://github.com/tokotype/PlusJakartaSans) fonts | SIL OFL 1.1 |

AI tools used (team to complete honestly):

- [TOOL]: [what it did]
- [TOOL]: [what it did]

Statistics: CDC (older adult falls); Fleming & Brayne, BMJ 2008 (long lies in people over 90). Links in `src/lib/site.ts`.

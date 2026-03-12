# Tevah — Built for the Three-Party Deal

## Stack
- **Frontend**: Vite + React 19 + TypeScript + Tailwind 4 + motion (framer-motion v11) + GSAP + Lucide icons
- **Backend**: FastAPI (serve.py) on Oracle server (158.101.101.234:8787)
- **Database**: SQLite 1.5GB (shlish.db, 94 tables, WAL mode) on Oracle
- **Brain API**: port 8900 (LanceDB + SentenceTransformer, 22,922 docs)
- **Auditor API**: port 8901 (forensic analysis, 818 findings)

## Commands
- `npm run dev` — Vite dev server (localhost:5173, proxies /api to Oracle)
- `npm run build` — production build
- `ssh oracle 'pm2 restart shlish-app'` — restart API
- `ssh oracle 'pm2 logs shlish-app --lines 30'` — check API logs
- `ssh oracle "sqlite3 ~/ai-os/projects/tevah/tevah-standalone/shlish-engine/data/shlish.db 'QUERY'"` — query DB

## Visual Verification (CRITICAL)
After ANY frontend edit, use Playwright MCP to:
1. Navigate to http://localhost:5173/app
2. Authenticate: `fetch('/auth/tevah', {method:'POST', body: new URLSearchParams({password:'geel2026'}), credentials:'include'})`
3. Take screenshot and verify against design system

## Design System (DSV2)
- Light theme: canvas #F5F3F7, cards #FFFFFF, text #1A1625, accent lavender-400/500
- Dark scope: `.the-call` class overrides ALL CSS vars to dark (#0C0A14)
- Glass tiers: glass-tint → glass-surface → glass-elevated → glass-overlay
- The Call cards use `.glass-deep` (light glass on dark stage with specular highlights)
- 3-Way Pricing: Vendor=#3B82F6 (blue), Tevah=#9333EA (purple), Customer=#059669 (green)
- NEVER hardcode colors. Use CSS custom properties or Tailwind theme tokens.
- Min text size: 11px. No 7-10px text anywhere.

## API Endpoints (serve.py on Oracle:8787)
All require `tevah_auth` cookie. Grouped by usage:

### Currently called by frontend (LIVE):
- `GET /api/call/today` — 178 decision cards, priority-sorted
- `GET /api/pipeline/v2` — 5-phase grouped cards with counts/values
- `GET /api/card/{id}` — full card + deal join + emails + actions
- `POST /api/card/{id}/action` — create action with side effects
- `POST /api/command` — free-form command parser

### Built but NOT called by frontend (wire these next):
- `GET /api/dashboard` — dashboard stats
- `GET /api/stats` — summary stats
- `GET /api/deals` — all deals with filters
- `GET /api/deal/{deal_id}` — single deal detail
- `GET /api/deal/{deal_id}/full` — deal + emails + brain intelligence
- `GET /api/customers` — customer list with revenue
- `GET /api/vendors` — vendor list with deal counts
- `GET /api/brands` — brand list with metrics
- `GET /api/products` — product catalog
- `GET /api/pipeline` — legacy pipeline (use /v2 instead)
- `GET /api/emails/recent` — recent emails
- `GET /api/finance` — financial overview
- `GET /api/search` — global search
- `GET /api/classify/status` — classification progress
- `GET /api/omniscience/{type}/{id}` — entity profiles (table empty)

## DB Column Names (caused 4+ hours of bugs — MEMORIZE)
| Table | CORRECT | WRONG (never use) |
|---|---|---|
| monday_deals | `vendor` | ~~supplier~~ |
| monday_deals | `customer_payment` | ~~customer_amount_paid~~ |
| monday_deals | `customer_due` | ~~customer_amount_due~~ |
| monday_deals | `cst_status` | ~~customer_status~~ |
| emails | `from_email` | ~~from_address~~ |
| entities | `canonical_name` | ~~name~~ |

## What's REAL vs THEATER
- **2/21 views use live API** (TheCallView, PipelineView)
- **19 views use 19,935 lines of hardcoded data** in src/data/*.ts
- Sidebar counts come from hardcoded data (data/monday.ts, data/decisions.ts)
- Backend is solid: 20+ API endpoints, all verified, all returning real data
- The gap is frontend wiring, NOT backend capability

## Hardcoded Data Files (TO KILL — replace with API hooks)
- `src/data/monday.ts` (635 lines) — ALL_DEALS, used by 12+ views
- `src/data/deal-intelligence.ts` (15,192 lines) — DEALS_BY_NUMBER
- `src/data/decisions.ts` (511 lines) — getDecisions, advisors
- `src/data/emails.ts` (282 lines) — email stats, stage mapping
- `src/data/deal-items.ts` (2,387 lines) — line items
- `src/data/buys.ts` (174 lines) — purchase data
- `src/data/recon.ts` (235 lines) — vendor reconnaissance
- `src/data/constants.ts` (65 lines) — shared constants
- `src/data/schema-v3.ts` (454 lines) — schema types

## Sacred Rules
1. Build here (`tevah-standalone/`), NEVER in `hercules-live/`
2. NEVER run multiple writers on shlish.db (WAL mode, single writer)
3. Classifier batch_size = 15 ONLY (25/50 cause JSON parse errors)
4. Real data only — never mock
5. Use Playwright to verify every UI change visually
6. Don't produce strategy docs — BUILD

## Financial Context
$16.36M revenue, 12.8% margin, $2.09M GP, 84.1% collection rate, $2.9M outstanding, $903K negative working capital, 72% revenue in top 5 customers

## Nesting Architecture
```
shlish.app → landing page (dark, no intelligence shown)
  → 5-click shin logo + password (geel2026) → TEVAH (this app)
    → 5-click ARK logo inside Tevah → HARVEST (hidden)
  → /admin (password: geel2026) → brain stats dashboard
```

## FIRST TASK — READ BEFORE ANYTHING ELSE
**MAC-SESSION-BRIEFING.md** — Contains ALL corrections, what's wrong with the current build plan, what the REAL vision is, and instructions to REBUILD the build plan before writing code. Read it first.

## The Vision (Decision Infrastructure)
Tevah is NOT an OMS or email client. It's **Decision Infrastructure** — a new product category where email becomes invisible transport and humans only make decisions via cards. Every email creates/moves/questions a card. The card is the workspace. 5 AI advisors (Shark/margin, Negotiator/tactics, Savant/strategy, Comptroller/CFO, Watchtower/portfolio) analyze every deal with multi-paragraph expert analysis. The cascade shows 3-way pricing at 9 touchpoints. 471 people need individual profiles. Classification at 2% (batch=15 only).

### Pipeline (5-PHASE MODEL — replaces B1-B15)
DEAL → COMMIT → PROCURE → FULFILL → CLOSE (34 sub-statuses, event-driven transitions, VPOs as child state machines). See TEVAH-FORWARD-PLAN.html Section 03 for details. The old B1-B15 linear DAG and CPO/VPO dual-track are REPLACED.

### VPO = Living Allocation Matrix
Not a simple purchase order. SKUs × Customers pivot table. 8-step allocation flow. 3 order paths (Pivot, 1-to-1, Submission Form). See TEVAH-FORWARD-PLAN.html Section 04.

## Build Documents
- **MAC-SESSION-BRIEFING.md** — READ FIRST. All corrections + what's wrong + what to do
- **TEVAH-FORWARD-PLAN.html** — THE vision document (Decision Infrastructure paradigm, 18 sections)
- **SESSION4-ROADMAP.md** — Ground truth (what's real vs theater) + contrarian review
- **SHLISH-BUILD-PLAN.md** — OUTDATED build plan (262 items, needs REBUILD — see briefing)
- **HANDOVER.md** — Current state, what works, what's broken

## Immediate Priority
1. Read MAC-SESSION-BRIEFING.md
2. Read TEVAH-FORWARD-PLAN.html
3. Rebuild the build plan (TEVAH-BUILD-V4.md) — use Gemini, sequential thinking, all tools
4. Then start building: wire frontend views to live APIs first

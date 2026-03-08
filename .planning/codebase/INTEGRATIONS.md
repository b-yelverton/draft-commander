# External Integrations

**Analysis Date:** 2026-03-08

## APIs & External Services

### Sleeper API (Primary Data Source)

The Sleeper API is the core integration -- it provides draft state, player database, league settings, and user identity. All endpoints are unauthenticated public REST.

- **Base URL:** `https://api.sleeper.app/v1` (constant `SLEEPER`, line 368)
- **Auth:** None (public API, no key required)
- **SDK/Client:** Raw `fetch()` via `fetchJSON()` helper (line 405)

**Endpoints used:**
| Function | Endpoint | Purpose |
|---|---|---|
| `lookupUser(u)` | `GET /user/{username}` | Resolve username to user_id |
| `getDraft(id)` | `GET /draft/{draftId}` | Draft metadata, settings, status |
| `getDraftPicks(id)` | `GET /draft/{draftId}/picks` | All picks made so far |
| `getLeagueUsers(id)` | `GET /league/{leagueId}/users` | League member list for display names |
| `getPlayers()` | `GET /players/nfl` | Full NFL player database (~10k players) |
| (inline, line 1904) | `GET /user/{userId}/drafts/nfl/{year}` | User's drafts for a given season |
| (inline, line 1910) | `GET /league/{leagueId}` | League settings (roster positions, scoring) |

**Polling:** Draft state is polled every 10 seconds via `setInterval` in `startPolling()` (line 853). Polls both `/draft/{id}` and `/draft/{id}/picks` in parallel.

### FantasyCalc API

- **URL:** `https://api.fantasycalc.com/values/current` (constant `FC_API`, line 369)
- **Auth:** None (public API)
- **Function:** `loadFC(numQbs, numTeams, ppr)` (line 415)
- **Query params:** `isDynasty=true&numQbs={1|2}&numTeams={N}&ppr={0|0.5|1}`
- **Returns:** Player dynasty trade values, rankings, trends, position ranks
- **Data mapping:** Players keyed by both Sleeper ID and normalized name (`n:` prefix)
- **Status:** Required -- loaded first during draft connection, blocks UI until complete

### KeepTradeCut (KTC) - Web Scraping

- **URL:** `https://keeptradecut.com/dynasty-rankings` (and `/superflex` variant)
- **Auth:** None
- **Function:** `loadKTC()` (line 431)
- **Method:** Fetches HTML page through CORS proxies, parses embedded `playersArray` JSON from page source
- **CORS Proxies (line 370):**
  1. `https://api.codetabs.com/v1/proxy?quest=`
  2. `https://corsproxy.io/?`
  3. `https://api.allorigins.win/raw?url=`
- **Fallback:** Manual paste via modal -- user copies page content from KTC, app parses it (`parseKTCPaste()`, line 477)
- **Caching:** Parsed data cached in `localStorage` as `draftcmdr_ktc_cache`
- **Status:** Optional -- gracefully degrades to `unavailable` if all proxies fail

### Dynasty Daddy (DD)

- **URL:** `https://dynasty-daddy.com/api/v1/player/all/today` (line 553)
- **Auth:** None
- **Function:** `loadDD()` (line 550)
- **Method:** Direct `fetch` first, falls back to CORS proxies if blocked
- **Returns:** Player trade values with both SF and 1QB variants
- **Caching:** Parsed data cached in `localStorage` as `draftcmdr_dd_cache`
- **Status:** Optional

### DynastyProcess (DP) - GitHub Raw CSV

- **URL:** `https://raw.githubusercontent.com/dynastyprocess/data/master/files/values.csv` (line 588)
- **Auth:** None
- **Function:** `loadDP()` (line 585)
- **Method:** Direct `fetch` of CSV file, parsed client-side
- **CSV columns used:** `player`, `pos`, `team`, `age`, `value_1qb`/`value_2qb`, `ecr_1qb`/`ecr_2qb`
- **Caching:** Parsed data cached in `localStorage` as `draftcmdr_dp_cache`
- **Status:** Optional

### Custom CSV Upload

- **Function:** `parseCSV(text, srcName)` (line 615)
- **Method:** User uploads a CSV file via file input; parsed client-side
- **Expected columns:** `name`, `pos`/`position`, `value`/`val`, `team`, `rank`, `age`
- **Separator:** Auto-detects `,` or `;`
- **Caching:** Parsed data cached in `localStorage` as `draftcmdr_csv_cache`

## Data Storage

**Databases:**
- None -- fully client-side application

**Local Storage:**
- Browser `localStorage` with `draftcmdr_` key prefix
- Keys: `username`, `weights`, `ktc_cache`, `dd_cache`, `dp_cache`, `csv_cache`
- Used for: Persisting user preferences and caching expensive API/scrape results across sessions

**File Storage:**
- None (no server-side storage)

**Caching:**
- All ranking source data (KTC, DD, DP, CSV) cached in `localStorage` with timestamps
- Cached data auto-restores on page load (lines 381-384)
- Source status auto-set to `live` on restore if sufficient data exists (lines 398-401)

## Authentication & Identity

**Auth Provider:**
- None -- no user authentication
- User identity resolved via Sleeper public API (`lookupUser()`)
- Username stored in `localStorage` for convenience; no session/token management

## Monitoring & Observability

**Analytics:**
- Vercel Analytics - Inline snippet at `index.html` line 1963-1964
- Vercel Speed Insights - Inline snippet at `index.html` line 1966-1967

**Error Tracking:**
- None (no external error tracking service)
- Console logging for API errors: `console.error('FC:', e)`, `console.error('KTC JSON parse:', e)`, etc.
- Render errors caught and displayed inline as red error panel (line 887-889)

**Logs:**
- Browser console only (`console.log`, `console.error`)

## CI/CD & Deployment

**Hosting:**
- Vercel (static site)
- Config: `vercel.json` -- no build command, serves root directory directly

**CI Pipeline:**
- Not detected (no `.github/workflows`, no CI config files)

## Environment Configuration

**Required env vars:**
- None for production (fully client-side)
- `BASE_URL` - Optional, used only by `playwright.config.js` for test target

**Secrets:**
- None required -- all APIs used are public/unauthenticated

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## CORS Proxy Strategy

The app uses three CORS proxy services as fallbacks for APIs that don't support browser CORS (KTC, DD):

```javascript
// index.html line 370
const KTC_PROXIES = [
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url='
];
```

**Fallback behavior:**
1. For KTC: Tries each proxy sequentially until one returns HTML containing `playersArray`
2. For DD: Tries direct fetch first, then falls back to proxies if direct fails
3. For DP: Direct fetch only (GitHub raw serves with permissive CORS)
4. For FC: Direct fetch only (FantasyCalc API supports CORS)

**When all proxies fail:** KTC/DD status set to `unavailable`; KTC offers manual paste fallback via modal

## Data Source Weight System

Sources are combined into composite rankings using a weighted average system (line 644-751):

| Source | Default Weight | Adjustable |
|--------|---------------|------------|
| FantasyCalc | 30% | Yes (slider) |
| KTC | 25% | Yes (slider) |
| Dynasty Daddy | 25% | Yes (slider) |
| DynastyProcess | 20% | Yes (slider) |
| Custom CSV | 0% | Yes (slider) |

Weights are saved to `localStorage` as `draftcmdr_weights` and persist across sessions.

## External Links

- **Buy Me a Coffee:** `https://buymeacoffee.com/northofzero` (tip jar link in setup page, line 946)

---

*Integration audit: 2026-03-08*

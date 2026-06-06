# ⚡ Anime Power Scaling Battle Simulator

A self-contained AI battle simulator. AI generates balanced combat profiles,
a 100-battle Monte Carlo engine fights them, results animate. Characters are
served from a self-growing database — AI is only used (and paid for) once per
new character, then cached forever.

## Files
| File | What it is |
|---|---|
| `anime-battle-simulator.html` | The game (single file). |
| `admin.html` | Roster manager — import CSV/JSON, edit stats, AI-fill, export DB. |
| `data/characters.json` | The character database (source of truth). |
| `server.js` | Zero-dependency backend: serves the app + the `/api/scout` proxy. |
| `data/prompts/` | Prompts for bulk-building the roster (see `data/README.md`). |

## Run it (local)

```bash
# roster-only mode — no key, AI fallback disabled, instant for known characters
node server.js
#   -> http://localhost:3000   (admin at /admin)

# with AI fallback for unknown characters (key stays server-side)
ANTHROPIC_API_KEY=sk-ant-... node server.js
```

Requires Node 18+ (uses built-in `fetch`). Nothing to install.

## The limit (this is the important part)

The cost cap lives in the **backend**, where it can't be bypassed. Tune via env:

| Env var | Default | Meaning |
|---|---|---|
| `SCOUT_DAILY_CAP` | `200` | Max AI scouts/day across *all* users (your spend ceiling). |
| `SCOUT_PER_IP_HOURLY` | `10` | Max AI scouts/hour per visitor. |
| `SCOUT_PROVIDER` | `anthropic` | `anthropic` \| `gemini` \| `openai`. |
| `SCOUT_MODEL` | `claude-haiku-4-5` | Cheap model for tiny JSON profiles. |
| `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` / `OPENAI_API_KEY` | — | Key for the chosen provider. |

Also set a hard **spend limit in the provider console** as a backstop.

### Why the spend trends to ~zero
Each unknown character is fetched by AI **once**, then written to
`data/characters.json` and served free to everyone after. As real traffic
fills the long tail, AI calls (and cost) keep dropping. You don't need the full
10k DB before launch — ship the seeds and let it grow.

## How a fight resolves
1. Look up each fighter in `characters.json` → instant + free if present.
2. Miss → `/api/scout` (backend): re-check cache → enforce limits → AI fetch →
   validate/clamp → cache to DB → return.
3. 100-battle Monte Carlo sim → animated reveal.

> Without the backend (e.g. opening the HTML directly / artifact preview), the
> game still works: roster lookups from `characters.json`, plus an optional
> client-side AI path using a key entered in ⚙ settings (personal use only —
> never ship a key in the browser on a public site).

## Building the roster (10k)
See `data/README.md` — run the chat prompt in `data/prompts/1-roster-builder.md`
per slice, import the CSVs in the admin panel (or drop them in `data/roster/`),
then fill stats via the admin's AI button or let the live `/api/scout` grow it
organically.

## Deploy
Host `server.js` on any Node platform (Render, Railway, Fly, a VPS, etc.) with
the env vars set. The character DB persists to `data/characters.json` on disk —
on ephemeral/serverless hosts, point it at a persistent volume or swap the
`loadDB`/`saveDB` functions for a KV store so the auto-cache survives restarts.

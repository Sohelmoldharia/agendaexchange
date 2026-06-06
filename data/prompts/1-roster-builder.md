# Prompt 1 — Roster Builder (run in Claude.ai with Web Search ON)

Builds the character list in the **rich 11-column format** (matches
`data/roster/battle_simulator_roster_2.csv`). The ingest step
(`node data/ingest.mjs`) derives the 7 numeric battle stats from the
**Power Tier** + keywords — so you do **not** need an AI step for stats.

Run once **per slice** (see `data/README.md`). Paste each output block into a
file under `data/roster/` (e.g. `data/roster/one-piece.csv`). Cross-run dupes
are fine — ingest dedupes by `name+franchise`.

---

## THE PROMPT — copy below, fill the `{...}` slots, paste into Claude

```
You are building the roster for an anime/cartoon/movie BATTLE SIMULATOR.
Use web search to confirm characters are real and genuinely popular.
Do NOT invent characters. Do NOT hallucinate franchises.

TASK: List {N} of the most popular / iconic characters from: {SLICE}

MEDIUM SCOPE: anime, manga, cartoon (any animation), movie.
- NO pure comic-book characters — comic power scaling is broken.
- Movie versions of any character ARE allowed (use their movie portrayal).

OUTPUT RULES — follow EXACTLY:
- Output ONLY one fenced code block. Nothing before or after it.
- CSV with this EXACT header row first:
  Name,Franchise,Medium,Role,Powers,Strengths,Weaknesses,Signature Abilities,Power Tier,Confidence,Cross-Medium Note
- One character per row after the header.
    Medium      = anime | manga | cartoon | movie
    Role        = short label (Hero, Villain, Pirate, Ninja, Mutant, …)
    Powers      = comma-separated abilities (inside one quoted field)
    Strengths   = comma-separated (quoted field)
    Weaknesses  = comma-separated (quoted field)
    Signature Abilities = comma-separated named moves (quoted field)
    Power Tier  = EXACTLY one of (high→low):
                  Universal, Star, Planet, Continent, Island, City, Building, Wall, Human
    Confidence  = High | Med | Low  (how well-documented their combat feats are)
    Cross-Medium Note = optional short note (e.g. "cartoon Batman ≠ live-action")
- Any field containing a comma MUST be wrapped in double quotes.
- No numbering, no commentary, no blank lines.

POWER TIER GUIDE:
  Universal = universe/reality scale (Goku, Saitama)
  Star      = star/solar-system (Femto, Genie)
  Planet    = planet-buster (Frieza, Thor)
  Continent = continent/region (Naruto, Aang, The Flash)
  Island    = island/small-country (Gojo, Luffy, Hulk, Godzilla)
  City      = city-leveling (Zoro, Iron Man, Gandalf)
  Building  = building/block (Killua, Wolverine, Predator)
  Wall      = room/wall (Tanjiro, SpongeBob, Harry Potter)
  Human     = peak human or below (Levi, John Wick, Batman)

Generate {N} now.
```

- `{N}` → `200`–`300` per run.
- `{SLICE}` → one row from the slicing plan in `data/README.md`.

> The older name-only `name,franchise,medium` CSV still imports fine (stats just
> won't auto-derive without a Power Tier). The rich format above is preferred.

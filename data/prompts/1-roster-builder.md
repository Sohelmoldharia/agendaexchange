# Prompt 1 — Roster Builder (run in Claude.ai with Web Search ON)

Build the character list. Run this once **per slice** from the slicing plan in
`data/README.md`. Each run drops ~300 characters. Paste the output code block
into a new file under `data/roster/` (e.g. `data/roster/one-piece.csv`).

You do **NOT** need to dedupe across runs — the ingest script dedupes
automatically by normalized `name+franchise`. Just keep each run on-topic.

---

## THE PROMPT — copy everything below, fill the `{...}` slots, paste into Claude

```
You are building the roster for an anime/cartoon/movie BATTLE SIMULATOR.
Use web search to confirm characters are real and genuinely popular.
Do NOT invent characters. Do NOT hallucinate franchises.

TASK: List {N} of the most popular / iconic characters from: {SLICE}

MEDIUM SCOPE: anime, manga, cartoon (any animation), movie.
- NO pure comic-book characters — comic power scaling is broken.
- Movie versions of any character ARE allowed (use their movie portrayal).
Prefer characters who fight or have powers, but iconic non-combatants are fine.

OUTPUT RULES — follow EXACTLY:
- Output ONLY one fenced code block. Nothing before or after it.
- One character per line, CSV: name,franchise,medium
    name     = common English name, no titles/honorifics
    franchise= the series / movie / franchise
    medium   = exactly one of: anime | manga | cartoon | movie
- No header row. No numbering. No commentary. No blank lines.
- No duplicates within this list.
- If a name contains a comma, wrap the field in double quotes.

Generate {N} now.
```

---

### Slot values
- `{N}` — `300` is a safe per-run target (fits in one response). Push to `400` if it keeps formatting clean.
- `{SLICE}` — one entry from the slicing plan, e.g.
  - `all notable characters from the One Piece franchise`
  - `the top 300 most popular standalone anime characters ranked roughly #301–#600 on MyAnimeList/AniList, excluding any from One Piece, Naruto, Bleach, or Dragon Ball`
  - `major characters from popular Western cartoons (Avatar, Ben 10, Teen Titans, etc.)`
  - `combat-relevant characters from major action/fantasy/sci-fi movie franchises`

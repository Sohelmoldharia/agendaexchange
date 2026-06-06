# Prompt 2 — Profile Generator (turns names into combat stats)

Takes a batch of names and produces the strict combat-profile JSON the
simulator uses. The **anchor ladder** below is the key trick: it forces every
batch — generated in separate chat runs — to calibrate to the *same* yardstick,
so scaling doesn't drift between batches.

- **Chat path (free, Claude Business):** run ~20-25 characters per batch (output
  fits in one response). Paste each JSON array into a file under
  `data/profiles/` (e.g. `data/profiles/batch-001.json`).
- **API/Batch path (cheap, automated, capped):** the ingest script can call the
  Batch API instead — recommended for the full 10k since 250+ manual chat runs
  is a grind. Set a spend cap in the Anthropic Console first.

---

## THE PROMPT — copy below, paste your name list into `{LIST}`, run in Claude

```
You are a rigorous power-scaling analyst for a cross-franchise battle simulator.
Use web search if unsure about a character's feats or abilities.

For EACH character in INPUT, output a combat profile.
Output ONLY a JSON array — no prose, no markdown fences, no commentary.

Each object must match EXACTLY this schema (no extra keys):
{
  "name": "string",
  "anime": "string (the franchise it's from)",
  "stats": { "power":0,"speed":0,"durability":0,"technique":0,
             "intelligence":0,"stamina":0,"range":0 },
  "pros": ["string","string","string"],
  "weaknesses": ["string","string"],
  "wildcards": [{ "name":"string","trigger_chance":0.0,"effect_desc":"string","stat_boost":0 }],
  "signature_move": "string",
  "tier": "low|mid|high|top|godtier"
}

ABSOLUTE SCALING LADDER — calibrate EVERY character to this fixed scale so all
batches stay consistent. Stats are integers 0-100 (100 = the strongest beings in
all of fiction-that-isn't-comics):

  godtier (90-100): reality/universe-level — e.g. Saitama, Zeno, Goku (late-game),
                    Rimuru, Lord of Nightmares. Rare. Most rosters have none.
  top     (75-89):  world/planet threats — admirals & yonko-tier, Madara, Gojo,
                    Yhwach, top Hunter x Hunter, Aizen.
  high    (60-74):  city/island busters — captain-class, elite jonin, S-class.
  mid     (40-59):  skilled super-humans — strong named fighters, lieutenant-class.
  low     (15-39):  street-level — trained humans, early-series protagonists,
                    most cartoon/movie martial artists (John Wick ~ power 30).
  A normal trained soldier ~ power 18. A civilian ~ 5.

RULES:
- Be HONEST and balanced. Do NOT cluster everyone at 90+. Spread the roster
  across the ladder. Most characters are low/mid.
- Each stat reflects THAT stat: a genius strategist with weak body = high
  intelligence, low power.
- Give 2 genuine weaknesses that could realistically cost a fight.
- 1-3 wildcards. trigger_chance 0.0-1.0 (per turn). stat_boost 0-30 (temporary).
- tier must match the stat ladder above.

INPUT (name | franchise):
{LIST}

Output the JSON array now.
```

---

### Notes
- Keep batches small in chat (~20-25) or the JSON gets truncated.
- The ingest script validates + clamps every field, so minor formatting slips
  are auto-repaired; truncated arrays are the only real failure — re-run those.

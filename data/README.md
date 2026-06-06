# Character Database — build plan

Goal: a static `characters.json` of **10,000+** characters (anime, manga,
cartoon, movie — **no comics**) so the simulator does instant, free, consistent
lookups in the browser. Live AI is only a fallback for characters not in the DB.

```
Roster (names)  ──▶  Profiles (stats JSON)  ──▶  characters.json  ──▶  app
   Prompt 1            Prompt 2                    ingest script       cache-first
 (chat + search)     (chat OR Batch API)          (dedupe+validate)    lookup
```

## Folders
- `prompts/1-roster-builder.md` — generate the name list (run per slice).
- `prompts/2-profile-generator.md` — turn names into combat stats.
- `roster/` — drop the CSVs from Prompt 1 here (any filenames).
- `profiles/` — drop the JSON arrays from Prompt 2 here.
- `characters.json` — final merged DB (produced by the ingest script, later).

## Workflow
1. Run **Prompt 1** in Claude.ai (web search ON), once per slice below. Paste
   each code block into a `roster/*.csv` file.
2. Once the roster is assembled, run **Prompt 2** in batches to produce
   `profiles/*.json`. (Or let the ingest script call the Batch API for the bulk.)
3. Ingest script dedupes + validates → `characters.json`. App loads it.

Cross-run duplicates are fine — the ingest step dedupes by normalized
`name+franchise`. Don't hand-dedupe.

---

## Slicing plan (~10k)

Run Prompt 1 once per row. `N≈300` per run unless noted.

### Phase A — Anime & Manga  (~6,000)
Run `all notable characters from the {X} franchise` for each:

> One Piece · Naruto/Boruto · Bleach · Dragon Ball (all) · Jujutsu Kaisen ·
> Demon Slayer · My Hero Academia · Hunter x Hunter · Fairy Tail · Black Clover ·
> Fullmetal Alchemist · Attack on Titan · Tokyo Ghoul · JoJo's Bizarre Adventure ·
> One Punch Man · Seven Deadly Sins · Fire Force · Chainsaw Man · Blue Lock ·
> Haikyuu · Yu Yu Hakusho · Hokage/Boruto · Sword Art Online · Re:Zero ·
> That Time I Got Reincarnated as a Slime · Mob Psycho 100 · Vinland Saga ·
> Berserk · Dr. Stone · Pokémon · Digimon · Yu-Gi-Oh · Saint Seiya ·
> Soul Eater · Toriko · Gintama · Hellsing · Bungo Stray Dogs · Code Geass

Then fill with popularity tiers:
- `top standalone anime characters ranked ~#1–#300 on MyAnimeList, excluding the franchises above`
- repeat for `#301–#600`, `#601–#900`, `#901–#1200` …

### Phase B — Cartoons  (~1,500)
`major characters from {X}` for:
> Avatar: TLA / Legend of Korra · Ben 10 · Teen Titans · Steven Universe ·
> Adventure Time · Rick and Morty · Samurai Jack · He-Man · ThunderCats ·
> Powerpuff Girls · Danny Phantom · Gravity Falls · Voltron · Transformers ·
> Star Wars: Clone Wars · Castlevania · Arcane · RWBY · Generator Rex · Bravest Warriors

### Phase C — Movies  (~2,000)
`combat-relevant characters from {X}` for:
> Star Wars (films) · Lord of the Rings / Hobbit · Harry Potter ·
> MCU (movie portrayals) · DCEU (movie portrayals) · Monsterverse (Godzilla/Kong) ·
> Jurassic Park/World · The Matrix · Terminator · Predator · Alien ·
> John Wick · Kung Fu Panda · How to Train Your Dragon · Pacific Rim ·
> Mortal Kombat (films) · Kingsman · 300 · Crouching Tiger · The Mummy

> **Note on MCU/DCEU:** these are comic-derived but their *movie* portrayals are
> far more bounded than the comics. Included as "movie" medium. Drop them if you
> want a stricter "no superhero" roster — your call.

---

## Final DB schema (`characters.json`)
An object keyed by `id` (= slugified `name|franchise`), each value is the
combat-profile object from Prompt 2 plus a `medium` field. The app loads a
lightweight name index first, then the full profile on demand.

# Leonida 55 — GTA VI Trophy Guide & Tracker

[![gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/quintana111/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/quintana111/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

The best guide and tracker for the 55 PlayStation 5 trophies of Grand Theft
Auto VI — every trophy with its own guide in plain words, a cited source for
every fact, and a checklist that remembers what you have earned. Fully
offline: open it once, then use it with the network off.

## What it covers

- **All 55 trophies** — 1 platinum, 2 gold, 6 silver, 46 bronze — with the
  official name, description and grade for each, byte-exact from the
  published list.
- **A guide for every trophy**: what to do, where, when, and what can be
  missed, written in our own words and cited to the guide it came from
  (GTABase and Output Lag, accessed 2026-11-19). Where the guide sites say
  a method is still unconfirmed, the guide says so and labels the rest a
  builder note.
- **The one missable trophy, flagged everywhere**: Positive Mental Attitude.
  Lucia's balcony meditation in Chapter 1 disappears after that chapter and
  there is no mission replay. The warning is on the roadmap, on the
  trophy's own page, and in its guide.
- **A roadmap in 8 stages** (Setup, Chapters 1–4, Final mission, Side
  cleanup, 100% gate) with per-stage progress bars and a "do this before
  advancing" note on each stage.
- **Filters and search**: by kind (Story, Strangers, Activities,
  Collectibles, Robberies, Exploration), Hidden (28), Missable (exactly 1),
  100% Critical (11), and Online (0 — GTA VI has no online trophies, so
  the filter is empty by design). Search matches names, guide text,
  locations and source labels.
- **Spoiler masking**: hidden trophies stay masked — name, description and
  guide — until earned or revealed, unless Spoilers is on.
- **Tracker**: the same checklist grouped by roadmap stage, then by kind,
  with progress bars per group, the 100% gate, and a "Next unchecked"
  button.
- **Sources view**: every source used, with the trophies it supports.
- **Export / import**: a versioned JSON export of your earned trophies,
  reveals and spoiler setting. Export, reset, import restores the same
  set exactly.

## The 100% gate

A Long Road (gold) needs the 100% checklist, which appears after the story
under Progress > Stats > 100% Completion. The 11 trophies flagged
**100% Critical** in this guide feed it: story completion, 250 stunts,
100 WAiNK scans, 3 card sets, every meditation spot, all garages and
5 bank vaults. The checklist itself also wants all 8 vaults, all 39 gang
operations, every shooting-range gold, all drone races and Bret's
15 Target Decks, plus shares of the rest (300 stunts, 200 vehicle scans,
100 animal studies, 15 of 18 meditations, 70 of 80 challenges,
100 optional missions).

## Run

```sh
# Serve app/ on http://localhost:8080 and open it in desktop Chrome
node serve.ts
```

No build step, no network requests at runtime — every script, stylesheet,
font and the trophy data are files under `app/`. Fonts are open-licensed
Noto Sans, vendored as WOFF2 under `app/fonts/`.

## Files

- `app/index.html`, `app/app.js`, `app/style.css` — the app shell, views
  and Leonida travel-poster styling.
- `app/data/trophies.json` — the 55 official trophies plus a researched
  guide, steps, where/when, kind, stage, hidden / missable / 100%-critical
  flags and sources for each.
- `app/fonts/` — vendored OFL fonts (no network fonts).
- `main.ts` — preflight checks; copies `app/` and `screenshots/` to
  `/output` and writes `/output/dossier.json`.
- `serve.ts`, `shots.json` — local preview server and the screenshot list.
- `screenshots/` — four real renders of the app (trophy list, single-trophy
  guide, tracker, roadmap).

## Artwork

Original look only: no Rockstar Games logo, artwork, box art or game
screenshots. The palette is a Leonida travel poster — deep navy, sunset
coral, aqua, sea-glass green and warm cream — with CSS palm and wave
silhouettes.

## License

MIT — see `LICENSE`.

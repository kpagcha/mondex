# mondex

A competitive Pokémon dex in the spirit of the [Smogon dex](https://www.smogon.com/dex/) and the
[Showdown dex](https://dex.pokemonshowdown.com/): classic, pixel-style, clean and fast.

Currently implemented:

- **Type chart** (`/types`): the Gen 6+ 18×18 matchup chart.
- **Type calculator** (`/types/calc`): defensive matchups for 1–2 types, and offensive coverage for up to 4 attacking types.
- **Type quiz** (`/types/quiz`): a matchup quiz that schedules questions with SM-2 spaced repetition, so the matchups you miss come back more often.

Type icons are loaded from the Pokémon Showdown sprite CDN.

## Scripts

```sh
npm install
npm run dev      # dev server
npm run build    # type-check + production build
npm run preview  # serve the production build
```

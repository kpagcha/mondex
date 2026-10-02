# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

mondex is a competitive Pokémon dex (in the spirit of the Smogon and Showdown dexes): a Vue 3 + TypeScript + Vite SPA, deployed to GitHub Pages at `https://kpagcha.github.io/mondex/`. It currently has the type chart (`/types`), the type calculator (`/types/calc`), a spaced-repetition type quiz (`/types/quiz`) and a settings page (`/settings`: style, theme, language), in English and Spanish.

## Commands

```sh
npm run dev         # dev server (base path `/`)
npm run build       # vue-tsc type-check + production build, in parallel (base path `/mondex/`)
npm run lint        # ESLint (lint:fix to autofix)
npm run format      # Prettier (no semicolons, single quotes, 120 columns)
```

There is no test suite, and none should be added. Verify changes with `npm run build` plus checking the app in the browser. The pre-commit hook (simple-git-hooks + lint-staged) runs `eslint --max-warnings=0` and Prettier on staged files, so any lint warning blocks a commit. CI (`.github/workflows/deploy.yml`) runs lint + build on every push to `main` and deploys, copying `index.html` to `404.html` so deep links work.

## Architecture

- **`src/data/types.ts`**: the Gen 6+ type chart, stored as a sparse attacker→defender map (pairs left out are 1×), exposed through `chart(atk, def)`. Type icons are Showdown sprites loaded by URL. `TypeId` is the canonical type key everywhere.
- **`src/lib/`**: pure logic with no Vue components. `typecalc.ts` (effectiveness, defensive profiles, coverage, multiplier formatting/CSS classes), `quiz.ts` (builds the quiz cards: "pick the multiplier" and "tick all types that apply"), `srs.ts` (SM-2 scheduling with Anki-style learning steps counted in answers rather than time; the deck is saved to localStorage under `mondex.quiz.v1`), `motion.ts` (shared `SPRING`/`FADE`/`PRESS` animation settings).
- **`src/views/`**: one lazy-loaded view per route (`src/router.ts`). Route `meta.titleKey` sets the document title. View state that should be shareable is kept in the URL query (calculator picks, the selected chart cell) and updated with `router.replace`.
- **i18n (`src/i18n/`)**: a small hand-rolled module, not vue-i18n. `en.ts` is the source of truth for `MessageKey`. Other locales are typed as `Record<keyof typeof en.messages, string>`, so a missing key is a compile error. Each locale also exports the official in-game type names. Use `t(key, params)` for `{name}` placeholders, `tSplit` to render a component (e.g. a type badge) in the middle of a message, and `typeName(type)`. To add a language: create `src/i18n/<code>.ts` and register it in `LOCALES`/`BUNDLES` in `src/i18n/index.ts`.
- **Theming**: CSS custom properties in `src/styles/main.css`. Light is the default; dark comes from `prefers-color-scheme` unless overridden by `:root[data-theme]` (set by `useTheme`). On top of light/dark there are two styles, set as `:root[data-style]` by `useStyle` and picked only in the dev settings (production always uses `retro`): `retro` (the default; `src/styles/retro.css`, square ink-outlined surfaces, hard shadows, and `TypeIcon` renders flat badges with the glyphs in `src/assets/type-icons/`) and `pixel` (the plain `main.css` look with Showdown sprites). `index.html` applies the saved theme and style before first paint. Multiplier colors are the `--m*-bg/fg` tokens, applied through `multClass()`. Components use `<style scoped>` plus the global tokens and utility classes.
- **Animation**: motion-v (`motion.*`, `AnimatePresence`, `layout-id`). Reuse the settings from `src/lib/motion.ts` so all animations feel consistent. `App.vue` wraps everything in `MotionConfig reduced-motion="user"`.
- **Tooltips**: the global `v-tip` directive (`src/directives/tip.ts`, tippy.js) replaces native `title`. `v-tip:group="..."` makes elements share one singleton tooltip that glides between them (used for table cells).
- **Dev-only**: the settings page's dev section (`src/dev/DevSettings.vue`: the style picker and font lab) and `src/dev/fonts.ts` (a lab for trying fonts through `--font-display`/`--font-body`/`--font-num`) are loaded only when `import.meta.env.DEV` is true and are left out of production builds.

## Conventions

- Import from `src` using the `@/` alias.
- localStorage access is always wrapped in try/catch, with the app falling back gracefully; keys are prefixed `mondex.`.
- Don't create or trace UI icons; the user picks icons themselves.

// Where `gen-data.ts` finds each language's names, for every locale but English (Showdown's own names). Adding a
// locale to the app (`src/i18n/locales.ts`) without it here is a compile error.

import type { Locale } from '../src/i18n/locales.ts'

export interface Language {
  /** PokéAPI's identifier for it (`languages.csv`): `fr`, `de`, `it`, `ko`, `zh-hans`, `es-419` (Latin America)... */
  pokeapi: string
  /**
   * The fields of Bulbapedia's "In other languages" table that hold its names, in order of preference: `fr`, `de`,
   * `it`, `ko`, `zh_cmn`, `pt_br`, `es_la` (Latin America)... Pages give some languages one field when all their
   * regions share the name, and one per region otherwise (`es`, or `es_eu` and `es_la`).
   */
  bulbapedia: string[]
}

export const LANGUAGES: Record<Exclude<Locale, 'en'>, Language> = {
  // Spain's Spanish.
  es: { pokeapi: 'es', bulbapedia: ['es_eu', 'es'] },
}

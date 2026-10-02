// Hand-picked data for `gen-data.ts`, where its sources are wrong or have nothing to give.

import type { Locale } from '../src/i18n/locales.ts'

/** The categories `gen-data.ts` generates, as named in its output files. */
export type CategoryKey = 'abilities' | 'moves' | 'items'

/**
 * Names by locale and Showdown ID, overriding PokéAPI and Bulbapedia: corrections, and names for entries the games
 * don't name on their own. Names the sources merely lack come from Bulbapedia's pages automatically. The script says
 * when an override matches the sources again, and which names it needs when a locale has none for an entry.
 */
export const NAMES: { [L in Exclude<Locale, 'en'>]?: { [C in CategoryKey]?: Record<string, string> } } = {
  es: {
    abilities: {
      // Showdown splits Embody Aspect ("Evocarrecuerdos") into one ability per Ogerpon mask, labelled with the mask's
      // name minus "Mask"; the games show one name. Ours do the same with the masks' official Spanish names
      // (PokéAPI), minus "Máscara": Máscara Turquesa, Máscara Horno, Máscara Fuente, Máscara Cimiento.
      embodyaspectteal: 'Evocarrecuerdos (Turquesa)',
      embodyaspecthearthflame: 'Evocarrecuerdos (Horno)',
      embodyaspectwellspring: 'Evocarrecuerdos (Fuente)',
      embodyaspectcornerstone: 'Evocarrecuerdos (Cimiento)',
      // Renamed from Generation IX; PokéAPI still has "Lodo Líquido" (Generations III–VIII).
      // https://bulbapedia.bulbagarden.net/wiki/Liquid_Ooze_(Ability)
      liquidooze: 'Viscosecreción',
    },
    items: {
      // Renamed from Legends: Z-A; PokéAPI still has "Cinta Experto" (X and Y to Scarlet and Violet).
      // https://bulbapedia.bulbagarden.net/wiki/Expert_Belt
      expertbelt: 'Cinturón de Experto',
      // The games abbreviate it to fit ("Revest. Metálico", as PokéAPI has it); the dex has room for the full name,
      // as PokéAPI itself gives for others ("Electricidad Estática", "Absorbe Electricidad").
      // https://bulbapedia.bulbagarden.net/wiki/Metal_Coat
      metalcoat: 'Revestimiento Metálico',
    },
  },
}

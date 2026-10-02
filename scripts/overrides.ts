// Hand-picked data for `gen-data.ts`, where its sources are wrong.

/**
 * Official Spanish (Spain) names by Showdown ID, overriding PokéAPI and Bulbapedia. Only for corrections: names the
 * sources lack come from Bulbapedia's pages automatically. The script says when an override matches the sources again.
 */
export const ES_NAMES: Record<'abilities' | 'moves' | 'items', Record<string, string>> = {
  abilities: {
    // Renamed from Generation IX; PokéAPI still has "Lodo Líquido" (Generations III–VIII).
    // https://bulbapedia.bulbagarden.net/wiki/Liquid_Ooze_(Ability)
    liquidooze: 'Viscosecreción',
  },
  moves: {},
  items: {
    // Renamed from Legends: Z-A; PokéAPI still has "Cinta Experto" (X and Y to Scarlet and Violet).
    // https://bulbapedia.bulbagarden.net/wiki/Expert_Belt
    expertbelt: 'Cinturón de Experto',
    // The games abbreviate it to fit ("Revest. Metálico", as PokéAPI has it); the dex has room for the full name,
    // as PokéAPI itself gives for others ("Electricidad Estática", "Absorbe Electricidad").
    // https://bulbapedia.bulbagarden.net/wiki/Metal_Coat
    metalcoat: 'Revestimiento Metálico',
  },
}

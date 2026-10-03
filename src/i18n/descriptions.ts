// Our curated ability descriptions, one file per language (`src/i18n/<locale>/abilities.ts`), each a chunk of its own
// loaded on demand like the generated names: routes that show descriptions wait for them (`meta.descriptions` in the
// router), and `abilityDescription` loads them itself if a page shows one before that.

import { shallowReactive } from 'vue'
import { locale, type Locale } from '@/i18n'
import type { Description } from '@/i18n/en/abilities'

type Descriptions = Record<string, Pick<Description, 'short' | 'long'>>

const FILES = import.meta.glob<Descriptions>('./*/abilities.ts', { import: 'descriptions' })

const loaded = shallowReactive<Partial<Record<Locale, Descriptions>>>({})
const loading: Partial<Record<Locale, Promise<void>>> = {}

/** Loads the descriptions of `l` (the current locale by default), once. A locale with none yet gets none. */
export function loadDescriptions(l: Locale = locale.value): Promise<void> {
  return (loading[l] ??= (async () => {
    const load = FILES[`./${l}/abilities.ts`]
    loaded[l] = load ? await load() : {}
  })())
}

/**
 * An ability's description in the current locale, or in English while it has no translation (`npm run gen-data` lists
 * those). `undefined` for one with no description, and until the descriptions load.
 */
export function abilityDescription(id: string): Pick<Description, 'short' | 'long'> | undefined {
  const own = loaded[locale.value]
  if (!own) {
    void loadDescriptions()
    return undefined
  }
  if (own[id] || locale.value === 'en') return own[id]
  if (!loaded.en) void loadDescriptions('en')
  return loaded.en?.[id]
}

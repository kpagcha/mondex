// The official name of any dex entry, in the current locale. The generated names (hundreds of abilities, moves and
// items) load on demand, one locale at a time: routes that show dex entries wait for them (`meta.dexNames` in the
// router), and `refName` loads them itself if a page shows entries before that.

import { shallowReactive } from 'vue'
import type { Ref } from '@/data/dex'
import { locale, termName, typeName, type GeneratedKind, type Locale } from '@/i18n'

type Names = Record<GeneratedKind, Record<string, string>>

// Only for the entries the regulation has, the only ones shown (`gen-data` fails if one lacks a name). A locale
// missing here is a compile error.
const LOADERS: Record<Locale, () => Promise<Names>> = {
  en: async () => {
    const [ability, move, item] = await Promise.all([
      import('@/data/generated/abilities.names.en.json'),
      import('@/data/generated/moves.names.en.json'),
      import('@/data/generated/items.names.en.json'),
    ])
    return { ability: ability.default, move: move.default, item: item.default }
  },
  es: async () => {
    const [ability, move, item] = await Promise.all([
      import('@/data/generated/abilities.names.es.json'),
      import('@/data/generated/moves.names.es.json'),
      import('@/data/generated/items.names.es.json'),
    ])
    return { ability: ability.default, move: move.default, item: item.default }
  },
}

const loaded = shallowReactive<Partial<Record<Locale, Names>>>({})
const loading: Partial<Record<Locale, Promise<void>>> = {}

/** Loads the names of `l` (the current locale by default), once. */
export function loadDexNames(l: Locale = locale.value): Promise<void> {
  return (loading[l] ??= LOADERS[l]().then((names) => {
    loaded[l] = names
  }))
}

/** Official name of a type, condition, move, ability or item. Empty until its locale's names load. */
export function refName(ref: Ref): string {
  if (ref.kind === 'type') return typeName(ref.id)
  if (ref.kind === 'condition' || ref.kind === 'group') return termName(ref)
  const names = loaded[locale.value]
  if (!names) {
    void loadDexNames()
    return ''
  }
  // Entries the regulation doesn't have have no name, but are never shown either.
  return names[ref.kind][ref.id] ?? ref.id
}

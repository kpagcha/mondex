// The official name of any dex entry, in the current locale. A module of its own so the generated names (hundreds of
// abilities, moves and items per locale) load with the pages that show dex entries, not with every page.

import type { Ids, Ref } from '@/data/dex'
import ABILITY_NAMES_EN from '@/data/generated/abilities.names.en.json'
import ABILITY_NAMES_ES from '@/data/generated/abilities.names.es.json'
import ITEM_NAMES_EN from '@/data/generated/items.names.en.json'
import ITEM_NAMES_ES from '@/data/generated/items.names.es.json'
import MOVE_NAMES_EN from '@/data/generated/moves.names.en.json'
import MOVE_NAMES_ES from '@/data/generated/moves.names.es.json'
import { locale, termName, typeName, type GeneratedKind, type Locale } from '@/i18n'

// Only for the entries the regulation has, the only ones shown (`gen-data` fails if one lacks a name). Generating a
// new locale's names is part of adding it: one missing is a compile error.
const GENERATED: { [K in GeneratedKind]: Record<Locale, Partial<Record<Ids[K], string>>> } = {
  ability: { en: ABILITY_NAMES_EN, es: ABILITY_NAMES_ES },
  move: { en: MOVE_NAMES_EN, es: MOVE_NAMES_ES },
  item: { en: ITEM_NAMES_EN, es: ITEM_NAMES_ES },
}

/** Official name of a type, condition, move, ability or item. */
export function refName(ref: Ref): string {
  if (ref.kind === 'type') return typeName(ref.id)
  if (ref.kind === 'condition' || ref.kind === 'group') return termName(ref)
  // Entries the regulation doesn't have have no name, but are never shown either.
  return (GENERATED[ref.kind][locale.value] as Record<string, string>)[ref.id] ?? ref.id
}

// The official name of any dex entry, in the current locale. The generated names (hundreds of abilities, moves and
// items) load on demand, one locale at a time: routes that show dex entries wait for them (`meta.dexNames` in the
// router), and `refName` loads them itself if a page shows entries before that.

import { shallowReactive } from 'vue'
import type { Ref } from '@/data/dex'
import { locale, termName, typeName, type GeneratedKind, type Locale } from '@/i18n'

type Names = Record<GeneratedKind, Record<string, string>>

// Every `<category>.names.<locale>.json` gen-data writes, each a chunk of its own. Only for the entries the regulation
// has, the only ones shown (gen-data fails if one lacks a name).
const FILES = import.meta.glob<Record<string, string>>('../data/generated/*.names.*.json', { import: 'default' })
const KINDS: Record<string, GeneratedKind> = { abilities: 'ability', moves: 'move', items: 'item' }

const loaded = shallowReactive<Partial<Record<Locale, Names>>>({})
const loading: Partial<Record<Locale, Promise<void>>> = {}

/** Loads the names of `l` (the current locale by default), once. */
export function loadDexNames(l: Locale = locale.value): Promise<void> {
  return (loading[l] ??= (async () => {
    const names = { ability: {}, move: {}, item: {} } as Names
    const files = Object.entries(FILES).flatMap(([path, load]) => {
      const [, category, fileLocale] = path.match(/\/(\w+)\.names\.([\w-]+)\.json$/)!
      return fileLocale === l ? [{ kind: KINDS[category!]!, load }] : []
    })
    if (!files.length) throw new Error(`No generated names for locale "${l}": run \`npm run gen-data\``)
    await Promise.all(files.map(async ({ kind, load }) => (names[kind] = await load())))
    loaded[l] = names
  })())
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

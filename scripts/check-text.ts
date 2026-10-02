// Checks the markers in our curated text (`{type:flying}`, `{move:taunt}`...): each must name an entry the dex has,
// and one the regulation has, since entries it lacks are written as plain text. Runs as part of `npm run build` (so CI
// catches a typo, or an entry a new regulation dropped), or alone with `npm run check-text`.
//
// It loads the app's own `src/data/dex.ts` (through jiti, with the `@/` alias), so "exists" and "available" mean
// exactly what they mean in the app.

import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createJiti } from 'jiti'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const jiti = createJiti(import.meta.url, { alias: { '@': join(ROOT, 'src') } })

type Kind = 'type' | 'condition' | 'group' | 'move' | 'ability' | 'item'
interface Dex {
  CONDITIONS: readonly string[]
  GROUPS: readonly string[]
  available(ref: { kind: Kind; id: string }): boolean
}
const dex = (await jiti.import('@/data/dex.ts')) as Dex
const { TYPES } = (await jiti.import('@/data/types.ts')) as { TYPES: readonly string[] }

/** The entries each kind of marker can name, beyond what `available()` already checks. */
const KNOWN: Record<Kind, (id: string) => boolean> = {
  type: (id) => TYPES.includes(id),
  condition: (id) => dex.CONDITIONS.includes(id),
  group: (id) => dex.GROUPS.includes(id),
  // Generated categories: `available()` is false for IDs that don't exist too.
  move: () => true,
  ability: () => true,
  item: () => true,
}

/** The curated text, by file: each entry's strings. */
const TEXT: Record<string, () => Promise<Record<string, Record<string, unknown>>>> = {
  'src/i18n/en/abilities.ts': async () =>
    ((await jiti.import('@/i18n/en/abilities.ts')) as { descriptions: Record<string, Record<string, unknown>> })
      .descriptions,
}

const problems: string[] = []
let markers = 0
for (const [file, load] of Object.entries(TEXT)) {
  for (const [entry, fields] of Object.entries(await load())) {
    for (const [field, value] of Object.entries(fields)) {
      if (typeof value !== 'string') continue
      for (const [marker, kind, id] of value.matchAll(/\{(\w+):(\w+)\}/g)) {
        markers++
        const where = `${file} ${entry}.${field}: ${marker}`
        if (!(kind! in KNOWN)) problems.push(`${where}: no such kind of entry`)
        else if (!KNOWN[kind as Kind](id!)) problems.push(`${where}: the dex has no such ${kind}`)
        else if (!dex.available({ kind: kind as Kind, id: id! })) {
          problems.push(`${where}: not in the regulation (no such ${kind}, or one it lacks: write it as plain text)`)
        }
      }
      // A brace that isn't a well-formed marker is a typo: `{move:taunt` or `{Move:taunt}`.
      const stray = value.replace(/\{\w+:\w+\}/g, '').match(/[{}]/)
      if (stray) problems.push(`${file} ${entry}.${field}: a stray "${stray[0]}"`)
    }
  }
}

if (problems.length) {
  console.error(`${problems.length} bad marker(s):\n  ${problems.join('\n  ')}`)
  process.exit(1)
}
console.log(`check-text: ${markers} markers, all fine`)

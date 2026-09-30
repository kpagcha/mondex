import { TYPES, TYPE_NAMES, chart, type Multiplier, type TypeId } from '@/data/types'

export const MULTIPLIERS: Multiplier[] = [0, 0.25, 0.5, 1, 2, 4]

export function effectiveness(atk: TypeId, def: readonly TypeId[]): Multiplier {
  let m = 1
  for (const d of def) m *= chart(atk, d)
  return m as Multiplier
}

export function formatMult(m: number): string {
  if (m === 0.25) return '¼×'
  if (m === 0.5) return '½×'
  return `${m}×`
}

/** CSS class used to color a multiplier cell. */
export function multClass(m: number): string {
  return `m-${String(m).replace('.', '_')}`
}

export function typesLabel(types: readonly TypeId[]): string {
  return types.map((t) => TYPE_NAMES[t]).join('/')
}

export type Profile = Record<Multiplier, TypeId[]>

function emptyProfile(): Profile {
  return { 0: [], 0.25: [], 0.5: [], 1: [], 2: [], 4: [] }
}

/** Every attacking type grouped by its multiplier against `def`. */
export function defensiveProfile(def: readonly TypeId[]): Profile {
  const p = emptyProfile()
  for (const atk of TYPES) p[effectiveness(atk, def)].push(atk)
  return p
}

/** All 18 single types followed by all 153 dual-type combinations. */
export const ALL_DEFENDERS: readonly (readonly TypeId[])[] = (() => {
  const out: TypeId[][] = TYPES.map((t) => [t])
  for (let i = 0; i < TYPES.length; i++) {
    for (let j = i + 1; j < TYPES.length; j++) out.push([TYPES[i]!, TYPES[j]!])
  }
  return out
})()

export interface CoverageEntry {
  def: readonly TypeId[]
  best: Multiplier
}

/** Best multiplier any of `atks` reaches against every defending type combination. */
export function offensiveProfile(atks: readonly TypeId[]): CoverageEntry[] {
  return ALL_DEFENDERS.map((def) => {
    let best = 0
    for (const a of atks) best = Math.max(best, effectiveness(a, def))
    return { def, best: best as Multiplier }
  })
}

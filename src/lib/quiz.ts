import { TYPES, chart, type Multiplier, type TypeId } from '@/data/types'
import { t, tSplit, typeName, type MessageKey } from '@/i18n'
import { effectiveness, formatMult, typesLabel } from '@/lib/typecalc'

/** "Fire → Water/Ground": pick one multiplier. */
export interface MultCard {
  id: string
  kind: 'mult'
  atk: TypeId
  def: TypeId[]
  answer: Multiplier
}

export type MultiQuestion = 'weak' | 'resist' | 'immune' | 'se' | 'nve' | 'noeff'

/** "Which attacking types are super effective against Steel?": tick all that apply. */
export interface MultiCard {
  id: string
  kind: 'multi'
  q: MultiQuestion
  type: TypeId
  answer: TypeId[]
}

export type Card = MultCard | MultiCard

function multCard(atk: TypeId, def: TypeId[]): MultCard {
  return { id: `m:${atk}>${def.join('/')}`, kind: 'mult', atk, def, answer: effectiveness(atk, def) }
}

const MULTI_FILTERS: Record<MultiQuestion, (atk: TypeId, def: TypeId) => boolean> = {
  weak: (a, d) => chart(a, d) > 1,
  resist: (a, d) => chart(a, d) > 0 && chart(a, d) < 1,
  immune: (a, d) => chart(a, d) === 0,
  se: (a, d) => chart(a, d) > 1,
  nve: (a, d) => chart(a, d) > 0 && chart(a, d) < 1,
  noeff: (a, d) => chart(a, d) === 0,
}

/** Defensive questions ask about attackers; offensive ones about defenders. */
const DEFENSIVE: Record<MultiQuestion, boolean> = {
  weak: true,
  resist: true,
  immune: true,
  se: false,
  nve: false,
  noeff: false,
}

function multiCard(q: MultiQuestion, type: TypeId): MultiCard | null {
  const f = MULTI_FILTERS[q]
  const answer = TYPES.filter((o) => (DEFENSIVE[q] ? f(o, type) : f(type, o)))
  if (!answer.length) return null
  return { id: `ms:${q}:${type}`, kind: 'multi', q, type, answer }
}

const PROMPT_KEYS = {
  weak: 'quiz.q.weak',
  resist: 'quiz.q.resist',
  immune: 'quiz.q.immune',
  se: 'quiz.q.se',
  nve: 'quiz.q.nve',
  noeff: 'quiz.q.noeff',
} as const satisfies Record<MultiQuestion, MessageKey>

/** The question text split around the type, so a type badge can go in between. */
export function multiPrompt(c: MultiCard): [before: string, after: string] {
  return tSplit(PROMPT_KEYS[c.q], 'type')
}

/** One-line breakdown of a multiplier card, e.g. "Fire→Water ½× · Fire→Ground 2× = 1×". */
export function explain(c: MultCard): string {
  const parts = c.def.map((d) => `${typeName(c.atk)}→${typeName(d)} ${formatMult(chart(c.atk, d))}`)
  if (c.def.length === 1) return parts[0]!
  return `${parts.join(' · ')} = ${formatMult(c.answer)}`
}

export function cardLabel(c: Card): string {
  if (c.kind === 'mult') return `${typeName(c.atk)} → ${typesLabel(c.def)}`
  return t(PROMPT_KEYS[c.q], { type: typeName(c.type) })
}

// Seeded shuffle: a deck's order is stable across reloads but differs between decks.
function shuffle<T>(arr: T[], seed: number): T[] {
  let s = seed >>> 0
  const rand = () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr
}

function buildCurriculum() {
  const singles: MultCard[] = []
  for (const a of TYPES) for (const d of TYPES) singles.push(multCard(a, [d]))

  const multis: MultiCard[] = []
  for (const q of Object.keys(MULTI_FILTERS) as MultiQuestion[]) {
    for (const t of TYPES) {
      const c = multiCard(q, t)
      if (c) multis.push(c)
    }
  }

  const duals: MultCard[] = []
  for (const a of TYPES) {
    for (let i = 0; i < TYPES.length; i++) {
      for (let j = i + 1; j < TYPES.length; j++) duals.push(multCard(a, [TYPES[i]!, TYPES[j]!]))
    }
  }

  // Tiers: the matchups that matter most come first, neutral ones last.
  const notable = singles.filter((c) => c.answer !== 1)
  const neutral = singles.filter((c) => c.answer === 1)
  const extreme = (c: MultCard) => c.answer === 0 || c.answer === 4 || c.answer === 0.25
  const dualExtreme = duals.filter(extreme)
  const dualOther = duals.filter((c) => !extreme(c))

  const tiers = {
    basic: [[...notable, ...multis], neutral] as Card[][],
    dual: [dualExtreme, dualOther] as Card[][],
  }
  return { tiers, basic: tiers.basic.flat(), dual: tiers.dual.flat() }
}

let curriculum: ReturnType<typeof buildCurriculum> | null = null
let byId: Map<string, Card> | null = null
let order: { seed: number; basic: string[]; dual: string[] } | null = null

/** All quiz cards, grouped into basic and dual. Order here is not the study order. */
export function getCurriculum() {
  curriculum ??= buildCurriculum()
  return curriculum
}

/** Study order for new cards: tiers in fixed order, each shuffled by the deck's seed. */
export function newCardOrder(seed: number) {
  if (order?.seed !== seed) {
    const { tiers } = getCurriculum()
    const ids = (group: Card[][], k: number) =>
      group.flatMap((tier, i) => shuffle([...tier], seed + k + i).map((c) => c.id))
    order = { seed, basic: ids(tiers.basic, 0), dual: ids(tiers.dual, 2) }
  }
  return order
}

export function getCard(id: string): Card | undefined {
  if (!byId) {
    const { basic, dual } = getCurriculum()
    byId = new Map([...basic, ...dual].map((c) => [c.id, c]))
  }
  return byId.get(id)
}

export function checkMulti(c: MultiCard, picked: readonly TypeId[]) {
  const want = new Set(c.answer)
  const got = new Set(picked)
  const missed = c.answer.filter((t) => !got.has(t))
  const wrong = picked.filter((t) => !want.has(t))
  return { correct: !missed.length && !wrong.length, missed, wrong }
}

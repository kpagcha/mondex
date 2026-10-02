// The dex's categories, and references to their entries. Every mention of a status, move, ability or item is a `Ref`,
// so it renders through `DexRef` and becomes a link once its category has a page (see `PAGES`). Names come from the
// locale `names` tables.

import type { TypeId } from '@/data/types'

// Each category lists the entries referenced so far. An ID is only unique within its category: Electric Terrain is
// both a move and the terrain it sets, and Psychic both a type and a move.

/** Statuses, weather, terrains, and field and side effects. */
export const CONDITIONS = [
  // Statuses
  'brn',
  'par',
  'psn',
  'frz',
  // Weather
  'sun',
  'rain',
  'sandstorm',
  'snow',
  // Terrains
  'electricterrain',
  'grassyterrain',
  'psychicterrain',
  'mistyterrain',
  // Field
  'gravity',
  // Side: hazards
  'spikes',
  'toxicspikes',
  'stickyweb',
  'stealthrock',
] as const

/** Groups of moves, abilities or effects, with no entry of their own. */
export const GROUPS = ['powder', 'trapping', 'terrains'] as const

export const MOVES = [
  'leechseed',
  'sheercold',
  'thunderwave',
  'thousandarrows',
  'smackdown',
  'ingrain',
  'roost',
  'foresight',
  'odorsleuth',
  'miracleeye',
  'freezedry',
  'saltcure',
  'magnetrise',
  'charge',
  'dragoncheer',
  'weatherball',
  'terrainpulse',
  'risingvoltage',
  'expandingforce',
  'soak',
  'magicpowder',
  'forestscurse',
  'trickortreat',
  'reflecttype',
  'burnup',
  'doubleshock',
] as const

export const ABILITIES = [
  'effectspore',
  'corrosion',
  'arenatrap',
  'scrappy',
  'mindseye',
  'prankster',
  'primordialsea',
  'desolateland',
  'deltastream',
  'flashfire',
  'wellbakedbody',
  'waterabsorb',
  'stormdrain',
  'dryskin',
  'voltabsorb',
  'lightningrod',
  'motordrive',
  'sapsipper',
  'levitate',
  'eartheater',
  'thickfat',
  'heatproof',
  'waterbubble',
  'purifyingsalt',
  'fluffy',
  'justified',
  'rattled',
  'steamengine',
  'watercompaction',
  'thermalexchange',
  'blaze',
  'torrent',
  'overgrow',
  'swarm',
  'transistor',
  'dragonsmaw',
  'rockypayload',
  'steelworker',
  'steelyspirit',
  'sandforce',
  'darkaura',
  'fairyaura',
  'aerilate',
  'pixilate',
  'refrigerate',
  'galvanize',
  'galewings',
  'normalize',
  'firemane',
  'megasol',
  'dragonize',
  'eelevate',
  'liquidvoice',
  'flowerveil',
  'mimicry',
  'forecast',
  'magnetpull',
] as const

export const ITEMS = [
  'ironball',
  'silkscarf',
  'charcoal',
  'mysticwater',
  'magnet',
  'miracleseed',
  'nevermeltice',
  'blackbelt',
  'poisonbarb',
  'softsand',
  'sharpbeak',
  'twistedspoon',
  'silverpowder',
  'hardstone',
  'spelltag',
  'dragonfang',
  'blackglasses',
  'metalcoat',
  'fairyfeather',
  'chilanberry',
  'occaberry',
  'passhoberry',
  'wacanberry',
  'rindoberry',
  'yacheberry',
  'chopleberry',
  'kebiaberry',
  'shucaberry',
  'cobaberry',
  'payapaberry',
  'tangaberry',
  'chartiberry',
  'kasibberry',
  'habanberry',
  'colburberry',
  'babiriberry',
  'roseliberry',
  'cellbattery',
  'snowball',
  'absorbbulb',
  'luminousmoss',
  'airballoon',
  'normalgem',
  'blacksludge',
] as const

export type ConditionId = (typeof CONDITIONS)[number]
export type GroupId = (typeof GROUPS)[number]
export type MoveId = (typeof MOVES)[number]
export type AbilityId = (typeof ABILITIES)[number]
export type ItemId = (typeof ITEMS)[number]

/** Each category's IDs. */
export interface Ids {
  type: TypeId
  condition: ConditionId
  group: GroupId
  move: MoveId
  ability: AbilityId
  item: ItemId
}
export type Kind = keyof Ids
/** The categories named in the locale `names` tables (types have their own). */
export type NamedKind = Exclude<Kind, 'type'>

/** An entry of the dex: `Ref<'item'>` for an item, `Ref` for any. */
export type Ref<K extends Kind = Kind> = { [k in K]: { kind: k; id: Ids[k] } }[K]

export const condition = (id: ConditionId): Ref<'condition'> => ({ kind: 'condition', id })
export const group = (id: GroupId): Ref<'group'> => ({ kind: 'group', id })
export const move = (id: MoveId): Ref<'move'> => ({ kind: 'move', id })
export const ability = (id: AbilityId): Ref<'ability'> => ({ kind: 'ability', id })
export const item = (id: ItemId): Ref<'item'> => ({ kind: 'item', id })

/** A string unique to `ref` across categories, for keys and sets. */
export const refKey = (ref: Ref): string => `${ref.kind}:${ref.id}`
export const sameRef = (a: Ref, b: Ref): boolean => a.kind === b.kind && a.id === b.id

/**
 * The route name of each category's entry page, which takes the entry's ID as `:id`. Mentions of a category without
 * one are plain text; registering its page turns them all into links.
 */
export const PAGES: Partial<Record<Kind, string>> = {}

export const GAMES = ['champions'] as const
export type Game = (typeof GAMES)[number]

/** The game whose content the dex shows. */
export const GAME: Game = 'champions'

/** Entries a game doesn't have, so their interactions are hidden there. Delete one when a patch adds it. */
const MISSING: Record<Game, Ref[]> = {
  // Checked against Smogon's Champions dex on 2026-10-01.
  champions: [
    ability('normalize'),
    ability('mindseye'),
    move('foresight'),
    move('odorsleuth'),
    move('miracleeye'),
    move('thousandarrows'),
    ability('arenatrap'),
    ability('magnetpull'),
    ability('primordialsea'),
    ability('desolateland'),
    ability('deltastream'),
    ability('wellbakedbody'),
    ability('stormdrain'),
    ability('steamengine'),
    ability('watercompaction'),
    ability('transistor'),
    ability('galvanize'),
    ability('rockypayload'),
    ability('dragonsmaw'),
    ability('darkaura'),
    ability('steelworker'),
    item('cellbattery'),
    item('snowball'),
    item('absorbbulb'),
    item('luminousmoss'),
    item('blacksludge'),
  ],
}

const missing = Object.fromEntries(GAMES.map((g) => [g, new Set(MISSING[g].map(refKey))])) as Record<Game, Set<string>>

/** Whether `game` has `ref` (or there's no ref to check). */
export function available(ref: Ref | undefined, game: Game = GAME): boolean {
  return !ref || !missing[game].has(refKey(ref))
}

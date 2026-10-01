// Gen 9 interactions beyond the type chart, per type. Names come from the locale `terms` tables.

import { chart, type TypeId } from '@/data/types'
import type { MessageKey } from '@/i18n'

/** Statuses, weather, groups of effects, and the moves, abilities and items referenced below. */
export const TERMS = [
  // Statuses, weather, groups
  'brn',
  'par',
  'psn',
  'frz',
  'powder',
  'trapping',
  'terrains',
  'sun',
  'rain',
  'sandstorm',
  'snow',
  // Moves
  'leechseed',
  'sheercold',
  'thunderwave',
  'spikes',
  'toxicspikes',
  'stickyweb',
  'thousandarrows',
  'gravity',
  'smackdown',
  'ingrain',
  'roost',
  'foresight',
  'odorsleuth',
  'miracleeye',
  'freezedry',
  'saltcure',
  'electricterrain',
  'grassyterrain',
  'psychicterrain',
  'mistyterrain',
  'stealthrock',
  'magnetrise',
  'charge',
  'dragoncheer',
  // Abilities
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
  // Items
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
  // Only referenced by notes
  'magnetpull',
] as const

export type TermId = (typeof TERMS)[number]

export const GAMES = ['champions'] as const
export type Game = (typeof GAMES)[number]

/** The game whose content the dex shows. */
export const GAME: Game = 'champions'

/**
 * Terms a game doesn't have, so their interactions are hidden there. Delete one when a patch adds it.
 * Champions: checked against Smogon's Champions dex on 2026-10-01.
 */
const MISSING: Partial<Record<TermId, Game[]>> = {
  normalize: ['champions'],
  mindseye: ['champions'],
  foresight: ['champions'],
  odorsleuth: ['champions'],
  miracleeye: ['champions'],
  thousandarrows: ['champions'],
  arenatrap: ['champions'],
  magnetpull: ['champions'],
  primordialsea: ['champions'],
  desolateland: ['champions'],
  deltastream: ['champions'],
  wellbakedbody: ['champions'],
  stormdrain: ['champions'],
  steamengine: ['champions'],
  watercompaction: ['champions'],
  transistor: ['champions'],
  galvanize: ['champions'],
  rockypayload: ['champions'],
  dragonsmaw: ['champions'],
  darkaura: ['champions'],
  steelworker: ['champions'],
  cellbattery: ['champions'],
  snowball: ['champions'],
  absorbbulb: ['champions'],
  luminousmoss: ['champions'],
  blacksludge: ['champions'],
}

export function available(term: TermId | undefined, game: Game = GAME): boolean {
  return !term || !MISSING[term]?.includes(game)
}

export const STATS = ['atk', 'def', 'spa', 'spd', 'spe'] as const
export type Stat = (typeof STATS)[number]

export interface Entry {
  term: TermId
  /** Damage or power multiplier; with `vs`, only against that type. */
  mult?: number
  vs?: TypeId
  /** Stat change: `stages` (+1 SpA) or `statMult` (Def 1.5×). */
  stat?: Stat
  stages?: number
  statMult?: number
  priority?: number
  /** A short effect with no number, e.g. "no stat drops or status". */
  fx?: MessageKey
}

export interface Note {
  key: MessageKey
  /** The move, ability or item the note is about, when its availability matters. */
  term?: TermId
}

export interface TypeInfo {
  // Pokémon of the type.
  immune?: Entry[]
  /** What gets past the type's immunities. */
  bypass?: Entry[]
  /** Damage the chart doesn't cover (Stealth Rock is added from the chart). */
  hurt?: Entry[]
  /** Stat boosts in weather. */
  stats?: Entry[]
  /** What allies' moves and abilities do for it (doubles). */
  ally?: Entry[]
  notes?: Note[]
  // Moves of the type: the user's and the target's moves, abilities and conditions, and items.
  field?: Entry[]
  user?: Entry[]
  target?: Entry[]
  items?: Entry[]
}

export const DEF_ROWS = ['immune', 'bypass', 'hurt', 'stats', 'ally'] as const
export const ATK_ROWS = ['field', 'user', 'target', 'items'] as const

export type EntryKey = (typeof DEF_ROWS)[number] | (typeof ATK_ROWS)[number]

/** `type`'s interactions, without the ones whose term `game` doesn't have. */
export function typeInfo(type: TypeId, game: Game = GAME): TypeInfo {
  const info = TYPE_INFO[type]
  const out: TypeInfo = { notes: info.notes?.filter((n) => available(n.term, game)) }
  // Stealth Rock damage follows the type's Rock matchup.
  const rock = chart('rock', type)
  const hurt = rock === 1 ? info.hurt : [...(info.hurt ?? []), x('stealthrock', rock)]
  for (const k of [...DEF_ROWS, ...ATK_ROWS] as EntryKey[]) {
    out[k] = (k === 'hurt' ? hurt : info[k])?.filter((e) => available(e.term, game))
  }
  return out
}

const is = (...terms: TermId[]): Entry[] => terms.map((term) => ({ term }))
const x = (term: TermId, mult: number, vs?: TypeId): Entry => ({ term, mult, vs })
const up = (term: TermId, stat: Stat, stages: number, mult?: number): Entry => ({ term, stat, stages, mult })
/** Every type has a 1.2× boosting item and a berry that halves a super effective hit (any hit, for Normal). */
const items = (boost: TermId, berry: TermId, ...more: Entry[]) => [x(boost, 1.2), x(berry, 0.5), ...more]

const TYPE_INFO: Record<TypeId, TypeInfo> = {
  normal: {
    user: [x('normalize', 1.2), x('scrappy', 1, 'ghost'), x('mindseye', 1, 'ghost')],
    items: items('silkscarf', 'chilanberry', x('normalgem', 1.3)),
  },
  fire: {
    immune: is('brn'),
    field: [x('sun', 1.5), x('rain', 0.5), x('primordialsea', 0)],
    user: [x('blaze', 1.5), x('firemane', 1.5), x('megasol', 1.5)],
    target: [
      x('flashfire', 0),
      up('wellbakedbody', 'def', 2, 0),
      x('thickfat', 0.5),
      x('heatproof', 0.5),
      x('waterbubble', 0.5),
      x('dryskin', 1.25),
      x('fluffy', 2),
      up('thermalexchange', 'atk', 1),
      up('steamengine', 'spe', 6),
    ],
    items: items('charcoal', 'occaberry'),
  },
  water: {
    hurt: [x('freezedry', 2), x('saltcure', 2)],
    field: [x('rain', 1.5), x('sun', 0.5), x('desolateland', 0)],
    user: [
      x('torrent', 1.5),
      x('waterbubble', 2),
      x('megasol', 0.5),
      { term: 'liquidvoice', fx: 'info.fx.liquidVoice' },
    ],
    target: [
      x('waterabsorb', 0),
      x('dryskin', 0),
      up('stormdrain', 'spa', 1, 0),
      up('watercompaction', 'def', 2),
      up('steamengine', 'spe', 6),
    ],
    items: items('mysticwater', 'passhoberry', up('absorbbulb', 'spa', 1), up('luminousmoss', 'spd', 1)),
  },
  electric: {
    immune: is('par'),
    field: [x('electricterrain', 1.3), x('deltastream', 1, 'flying')],
    user: [up('charge', 'spd', 1, 2), x('transistor', 1.3), x('galvanize', 1.2)],
    target: [x('voltabsorb', 0), up('lightningrod', 'spa', 1, 0), up('motordrive', 'spe', 1, 0)],
    items: items('magnet', 'wacanberry', up('cellbattery', 'atk', 1)),
  },
  grass: {
    immune: is('powder', 'leechseed', 'effectspore'),
    ally: [{ term: 'flowerveil', fx: 'info.fx.flowerVeil' }],
    field: [x('grassyterrain', 1.3)],
    user: [x('overgrow', 1.5)],
    target: [up('sapsipper', 'atk', 1, 0)],
    items: items('miracleseed', 'rindoberry'),
  },
  ice: {
    immune: is('frz', 'sheercold'),
    stats: [{ term: 'snow', stat: 'def', statMult: 1.5 }],
    field: [x('deltastream', 1, 'flying')],
    user: [x('refrigerate', 1.2)],
    target: [x('thickfat', 0.5)],
    items: items('nevermeltice', 'yacheberry', up('snowball', 'atk', 1)),
  },
  fighting: {
    user: [x('scrappy', 1, 'ghost'), x('mindseye', 1, 'ghost')],
    items: items('blackbelt', 'chopleberry'),
  },
  poison: {
    immune: is('psn'),
    bypass: is('corrosion'),
    notes: [
      { key: 'info.note.toxic' },
      { key: 'info.note.toxicSpikes' },
      { key: 'info.note.blackSludge', term: 'blacksludge' },
    ],
    items: items('poisonbarb', 'kebiaberry'),
  },
  ground: {
    immune: is('sandstorm', 'thunderwave'),
    user: [x('sandforce', 1.3)],
    target: [x('levitate', 0), x('eartheater', 0), x('eelevate', 0), x('magnetrise', 0)],
    items: items('softsand', 'shucaberry', x('airballoon', 0)),
  },
  flying: {
    immune: is('spikes', 'toxicspikes', 'stickyweb', 'terrains', 'arenatrap'),
    bypass: is('gravity', 'ingrain', 'roost', 'smackdown', 'thousandarrows', 'ironball'),
    user: [x('aerilate', 1.2), { term: 'galewings', priority: 1 }],
    items: items('sharpbeak', 'cobaberry'),
  },
  psychic: {
    field: [x('psychicterrain', 1.3)],
    items: items('twistedspoon', 'payapaberry'),
  },
  bug: {
    user: [x('swarm', 1.5)],
    target: [up('rattled', 'spe', 1)],
    items: items('silverpowder', 'tangaberry'),
  },
  rock: {
    immune: is('sandstorm'),
    stats: [{ term: 'sandstorm', stat: 'spd', statMult: 1.5 }],
    field: [x('deltastream', 1, 'flying')],
    user: [x('rockypayload', 1.5), x('sandforce', 1.3)],
    items: items('hardstone', 'chartiberry'),
  },
  ghost: {
    immune: is('trapping'),
    bypass: is('scrappy', 'mindseye', 'foresight', 'odorsleuth'),
    notes: [{ key: 'info.note.curse' }],
    target: [x('purifyingsalt', 0.5), up('rattled', 'spe', 1)],
    items: items('spelltag', 'kasibberry'),
  },
  dragon: {
    ally: [{ term: 'dragoncheer', fx: 'info.fx.dragonCheer' }],
    field: [x('mistyterrain', 0.5)],
    user: [x('dragonsmaw', 1.5), x('dragonize', 1.2)],
    items: items('dragonfang', 'habanberry'),
  },
  dark: {
    immune: is('prankster'),
    bypass: is('miracleeye'),
    user: [x('darkaura', 1.33)],
    target: [up('justified', 'atk', 1), up('rattled', 'spe', 1)],
    items: items('blackglasses', 'colburberry'),
  },
  steel: {
    immune: is('psn', 'sandstorm'),
    bypass: is('corrosion'),
    hurt: [x('saltcure', 2)],
    notes: [{ key: 'info.note.magnetPull', term: 'magnetpull' }],
    user: [x('steelworker', 1.5), x('steelyspirit', 1.5), x('sandforce', 1.3)],
    items: items('metalcoat', 'babiriberry'),
  },
  fairy: {
    user: [x('fairyaura', 1.33), x('pixilate', 1.2)],
    items: items('fairyfeather', 'roseliberry'),
  },
}

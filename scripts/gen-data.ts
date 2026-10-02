// Generates `src/data/generated/` from Pokémon Showdown's Champions mod, at the commit pinned in `sources.json`, and
// Spanish names from PokéAPI's data, falling back to Bulbapedia for what PokéAPI doesn't have yet. The regulation is
// `VITE_REGULATION` in `.env`. Run with `npm run gen-data`; `npm run gen-data -- --update` first moves every pin to
// the latest version.
//
// Showdown's own code loads the data (through jiti, which runs its TypeScript), so the Champions mod is merged over
// Gen 9 and the format's rules apply exactly as on Showdown. Availability comes from the regulation's legal Pokémon:
// an ability is available when one of them can have it, a move when one of them learns it.

import { execFileSync } from 'node:child_process'
import https from 'node:https'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createJiti } from 'jiti'
import * as prettier from 'prettier'
import { ES_NAMES } from './overrides.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CACHE = join(ROOT, 'node_modules/.cache')
const SOURCES_FILE = join(ROOT, 'scripts/sources.json')
const OUT = join(ROOT, 'src/data/generated')

const SHOWDOWN_REPO = 'https://github.com/smogon/pokemon-showdown.git'
const POKEAPI_RAW = 'https://raw.githubusercontent.com/PokeAPI/pokeapi'
const BULBAPEDIA_API = 'https://bulbapedia.bulbagarden.net/w/api.php'
const USER_AGENT = 'mondex gen-data (https://github.com/kpagcha/mondex)'
/** The parts of Showdown's repo its `Dex` needs. */
const SHOWDOWN_PATHS = ['/data/', '/sim/', '/lib/', '/config/', '/package.json']

interface Sources {
  showdown: string
  pokeapi: string
  /** The Bulbapedia pages used, by title, each pinned to a revision. */
  bulbapedia: Record<string, number>
}

// The little of Showdown's API used here.
interface Species {
  id: string
  name: string
  exists: boolean
  abilities: Record<string, string>
}
/** An ability, move or item. */
interface Entry {
  id: string
  name: string
  num: number
  isNonstandard: string | null
}
interface RuleTable {
  isBannedSpecies(species: Species): boolean
  isBanned(thing: string): boolean
}
interface Format {
  name: string
  mod: string
}
interface ModdedDex {
  /** `getMovePool`: every move a species can learn, its pre-evolutions' and base forme's included. */
  species: { all(): readonly Species[]; getMovePool(id: string): Set<string> }
  abilities: { all(): readonly Entry[] }
  moves: { all(): readonly Entry[] }
  items: { all(): readonly Entry[] }
  formats: { all(): readonly Format[]; getRuleTable(format: Format): RuleTable }
  forFormat(format: Format): ModdedDex
}

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
}

function latestCommit(repo: string): string {
  return git(ROOT, 'ls-remote', repo, 'refs/heads/master').split('\t')[0]!
}

/** Showdown's repo at `commit`, sparse-checked out into the cache on first use. */
function showdownCheckout(commit: string): string {
  const dir = join(CACHE, 'showdown', commit)
  if (existsSync(join(dir, 'sim/dex.ts'))) return dir
  console.log(`Fetching Pokémon Showdown ${commit.slice(0, 7)}…`)
  mkdirSync(dir, { recursive: true })
  git(dir, 'init', '-q')
  git(dir, 'remote', 'add', 'origin', SHOWDOWN_REPO)
  git(dir, 'sparse-checkout', 'set', '--no-cone', ...SHOWDOWN_PATHS)
  git(dir, 'fetch', '-q', '--depth', '1', '--filter=blob:none', 'origin', commit)
  git(dir, 'checkout', '-q', 'FETCH_HEAD')
  return dir
}

/**
 * The body of a GET request. Uses `node:https` rather than `fetch`: Bulbapedia's Cloudflare answers most of `fetch`'s
 * requests with a bot challenge (HTTP 403), but lets `https` (and curl) through.
 */
function get(url: string): Promise<string> {
  return new Promise((ok, fail) => {
    https
      .get(url, { headers: { 'User-Agent': USER_AGENT, Accept: '*/*' } }, (res) => {
        const chunks: Buffer[] = []
        res.on('data', (c: Buffer) => chunks.push(c))
        res.on('end', () => {
          if (res.statusCode === 200) ok(Buffer.concat(chunks).toString('utf8'))
          else fail(new Error(`${url}: HTTP ${res.statusCode}`))
        })
      })
      .on('error', fail)
  })
}

/** A PokéAPI CSV at `commit`, cached, as rows of named columns. */
async function pokeapiCsv(commit: string, file: string): Promise<Record<string, string>[]> {
  const path = join(CACHE, 'pokeapi', commit, file)
  if (!existsSync(path)) {
    const csv = await get(`${POKEAPI_RAW}/${commit}/data/v2/csv/${file}`)
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, csv)
  }
  const [head, ...rows] = parseCsv(readFileSync(path, 'utf8'))
  return rows.map((row) => Object.fromEntries(head!.map((col, i) => [col, row[i] ?? ''])))
}

/** Minimal RFC 4180 parsing: quoted fields may hold commas, newlines and doubled quotes. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') field += text[i++]
      else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      if (row.some((f) => f)) rows.push(row)
      row = []
      field = ''
    } else field += c
  }
  if (field || row.length) rows.push([...row, field])
  return rows
}

/** Showdown's IDs are names lowercased with everything but letters and digits removed. */
const toId = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

function regulation(): string {
  const m = readFileSync(join(ROOT, '.env'), 'utf8').match(/^VITE_REGULATION=(.+)$/m)
  if (!m) throw new Error('VITE_REGULATION is missing from .env')
  return m[1]!.trim()
}

/** Spanish names by Showdown ID, from a PokéAPI table (`abilities`) and its names table (`ability_names`, keyed by
 * `ability_id`). */
async function spanishNames(
  commit: string,
  table: string,
  namesTable: string,
  key: string,
): Promise<Map<string, string>> {
  const languages = await pokeapiCsv(commit, 'languages.csv')
  const es = languages.find((l) => l.identifier === 'es')!.id
  const ids = new Map((await pokeapiCsv(commit, `${table}.csv`)).map((r) => [r.id, toId(r.identifier!)]))
  const names = new Map<string, string>()
  for (const r of await pokeapiCsv(commit, `${namesTable}.csv`)) {
    if (r.local_language_id === es) names.set(ids.get(r[key]!)!, r.name!)
  }
  return names
}

interface WikiPage {
  title: string
  missing?: boolean
  revisions?: { revid: number; slots: { main: { content: string } } }[]
}

/** Bulbapedia pages (with their latest revision, or the given `revids`), up to 50 per request. Titles are matched
 * through Bulbapedia's normalizations and redirects, so the result is keyed by the title asked for. */
async function wikiQuery(by: 'titles' | 'revids', keys: string[]): Promise<Map<string, WikiPage>> {
  const out = new Map<string, WikiPage>()
  for (let i = 0; i < keys.length; i += 50) {
    const batch = keys.slice(i, i + 50)
    const params = new URLSearchParams({
      action: 'query',
      prop: 'revisions',
      rvprop: 'ids|content',
      rvslots: 'main',
      redirects: '1',
      format: 'json',
      formatversion: '2',
      [by]: batch.join('|'),
    })
    const { query } = JSON.parse(await get(`${BULBAPEDIA_API}?${params}`)) as {
      query: {
        pages: WikiPage[]
        normalized?: { from: string; to: string }[]
        redirects?: { from: string; to: string }[]
      }
    }
    const final = (title: string) => {
      for (const list of [query.normalized, query.redirects]) title = list?.find((r) => r.from === title)?.to ?? title
      return title
    }
    for (const key of batch) {
      const page =
        by === 'titles'
          ? query.pages.find((p) => p.title === final(key))
          : query.pages.find((p) => p.revisions?.some((r) => String(r.revid) === key))
      if (page) out.set(key, page)
    }
  }
  return out
}

/**
 * The wikitext of Bulbapedia pages by title: at the pinned revision (from the cache when possible), or else the
 * latest, which gets pinned. Pages that don't exist are left out. Also returns the pins of the pages found.
 */
async function bulbapedia(titles: string[], pins: Record<string, number>) {
  const text = new Map<string, string>()
  const found: Record<string, number> = {}
  const cached = (revid: number) => join(CACHE, 'bulbapedia', `${revid}.wikitext`)
  const keep = (title: string, revid: number, content: string) => {
    mkdirSync(dirname(cached(revid)), { recursive: true })
    writeFileSync(cached(revid), content)
    text.set(title, content)
    found[title] = revid
  }
  const pinned = titles.filter((t) => pins[t])
  for (const t of pinned.filter((t) => existsSync(cached(pins[t]!)))) {
    text.set(t, readFileSync(cached(pins[t]!), 'utf8'))
    found[t] = pins[t]!
  }
  const toFetch = pinned.filter((t) => !text.has(t))
  const byRevid = await wikiQuery(
    'revids',
    toFetch.map((t) => String(pins[t])),
  )
  for (const t of toFetch) {
    const rev = byRevid.get(String(pins[t]))?.revisions?.[0]
    if (!rev) throw new Error(`Bulbapedia has no revision ${pins[t]} of "${t}"`)
    keep(t, rev.revid, rev.slots.main.content)
  }
  const latest = await wikiQuery(
    'titles',
    titles.filter((t) => !pins[t]),
  )
  for (const [t, page] of latest) {
    const rev = page.revisions?.[0]
    if (!page.missing && rev) keep(t, rev.revid, rev.slots.main.content)
  }
  return { text, found }
}

/**
 * The official Spanish (Spain) name in a Bulbapedia page's "In other languages" table: its `es_eu` field, or `es` on
 * pages where Spain and Latin America share it. When the name changed, the current one comes first, before a `<br>`,
 * and notes like `<sup>{{gen|VI}}+</sup>` or "(games)" follow it. `{{tt|Elec.|Electricidad}}` is a word the games
 * abbreviate to fit, with its full form as a tooltip: we use the full form ("Absorbe Electricidad", as PokéAPI has
 * it). `{{tt|*|...}}` is a footnote marker, not part of the name.
 */
function bulbapediaSpanish(wikitext: string): string | undefined {
  const start = wikitext.search(/\{\{langtable/i)
  if (start < 0) return undefined
  const table = wikitext.slice(start)
  const field = table.match(/^\s*\|\s*es_eu\s*=(.*)$/m) ?? table.match(/^\s*\|\s*es\s*=(.*)$/m)
  if (!field) return undefined
  const name = field[1]!
    .replace(/<!--.*?-->/g, '')
    .split(/<br\s*\/?>/i)[0]!
    .replace(/<sup>.*?<\/sup>/gi, '')
    .replace(/\{\{tt\|([^|}]*)\|([^}]*)\}\}/gi, (_, short: string, full: string) => (short === '*' ? '' : full))
    .replace(/\{\{[^{}]*\}\}/g, '') // Other templates: `{{sup/9|ZA}}` (since Legends: Z-A)...
    .replace(/\}\}\s*$/, '') // ...and the table's own end, when the field is its last line
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/''+/g, '')
    .replace(/\s*\(.*\)\s*$/, '')
    .trim()
  return name || undefined
}

/** A JSON object with one entry per line (so diffs are one line per change), formatted with the project's Prettier
 * settings. */
async function writeJson(file: string, data: Record<string, unknown>) {
  const path = join(OUT, file)
  const lines = Object.entries(data).map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`)
  const options = await prettier.resolveConfig(path)
  mkdirSync(OUT, { recursive: true })
  writeFileSync(path, await prettier.format(`{\n${lines.join(',\n')}\n}`, { ...options, filepath: path }))
  console.log(`Wrote ${file}`)
}

/** A dex category the script generates. */
interface Category {
  /** Output files (`<key>.json`, `<key>.names.<locale>.json`) and the `overrides.ts` key. */
  key: keyof typeof ES_NAMES
  /** Every entry, with whether the regulation has it. Spanish names (PokéAPI's) can decide how entries merge. */
  entries: (es: Map<string, string>) => (Entry & { available: boolean })[]
  /** PokéAPI's table, its names table and the names table's key column. */
  pokeapi: [table: string, names: string, key: string]
  /** Bulbapedia page titles that may be an entry's, in order of preference. */
  pages: (name: string) => string[]
}

async function main() {
  const saved = readFileSync(SOURCES_FILE, 'utf8')
  const parsed = JSON.parse(saved) as Partial<Sources>
  const sources: Sources = { showdown: parsed.showdown!, pokeapi: parsed.pokeapi!, bulbapedia: parsed.bulbapedia ?? {} }
  if (process.argv.includes('--update')) {
    sources.showdown = latestCommit(SHOWDOWN_REPO)
    sources.pokeapi = latestCommit('https://github.com/PokeAPI/pokeapi.git')
    sources.bulbapedia = {} // Every page gets pinned to its latest revision again
    console.log(`Pinned Showdown ${sources.showdown.slice(0, 7)}, PokéAPI ${sources.pokeapi.slice(0, 7)}`)
  }

  const reg = regulation()
  const dir = showdownCheckout(sources.showdown)
  const jiti = createJiti(import.meta.url, { moduleCache: true })
  const { Dex } = (await jiti.import(join(dir, 'sim/dex.ts'))) as { Dex: ModdedDex }

  // The regulation's VGC format, e.g. "[Gen 9 Champions] VGC 2026 Reg M-C". Its mod is the data that regulation
  // uses: `champions` for the current one, a frozen snapshot like `championsregmb` for past ones.
  const pattern = new RegExp(`^\\[Gen 9 Champions\\] VGC \\d+ Reg ${reg.replace(/[^\w]/g, '\\$&')}$`)
  const format = Dex.formats.all().find((f) => pattern.test(f.name))
  if (!format) throw new Error(`Showdown ${sources.showdown.slice(0, 7)} has no VGC format for Regulation ${reg}`)
  const dex = Dex.forFormat(format)
  const rules = dex.formats.getRuleTable(format)
  console.log(`${format.name} (mod: ${format.mod})`)

  // The regulation's legal Pokémon, Mega Evolutions included.
  const roster = dex.species.all().filter((s) => s.exists && !rules.isBannedSpecies(s))
  console.log(`${roster.length} legal Pokémon`)
  const abilitiesHeld = new Set(roster.flatMap((s) => Object.values(s.abilities).map(toId)))
  const movesLearned = new Set(roster.flatMap((s) => [...dex.species.getMovePool(s.id)]))

  // `num <= 0` leaves out Showdown's placeholders ("No Ability") and its fan-made CAP entries (negative numbers).
  const categories: Category[] = [
    {
      // Available when a legal Pokémon can have it.
      key: 'abilities',
      entries: (es) => {
        const byId = new Map<string, Entry & { available: boolean }>()
        for (const a of dex.abilities.all()) {
          if (a.num <= 0) continue
          const available = abilitiesHeld.has(a.id) && !a.isNonstandard && !rules.isBanned(`ability:${a.id}`)
          // Showdown splits some abilities into variants the games don't, like "Embody Aspect (Teal)", one per
          // Ogerpon mask. When the games (PokéAPI) only know the base ability, the variants merge into it.
          const base = a.name.match(/^(.+) \(.+\)$/)?.[1]
          const merged = base && !es.has(a.id) && !ES_NAMES.abilities[a.id] && es.has(toId(base))
          const entry = merged ? { ...a, id: toId(base), name: base } : a
          byId.set(entry.id, { ...entry, available: available || !!byId.get(entry.id)?.available })
        }
        return [...byId.values()]
      },
      pokeapi: ['abilities', 'ability_names', 'ability_id'],
      pages: (name) => [`${name} (Ability)`],
    },
    {
      // Available when a legal Pokémon learns it, and the game has it: the Champions mod drops some moves Pokémon
      // still learn in Scarlet and Violet (Tackle, Swift).
      key: 'moves',
      entries: () =>
        dex.moves
          .all()
          .filter((m) => m.num > 0)
          .map((m) => ({
            ...m,
            available: movesLearned.has(m.id) && !m.isNonstandard && !rules.isBanned(`move:${m.id}`),
          })),
      pokeapi: ['moves', 'move_names', 'move_id'],
      pages: (name) => [`${name} (move)`],
    },
    {
      // Available when the game has it.
      key: 'items',
      entries: () =>
        dex.items
          .all()
          .filter((i) => i.num > 0)
          .map((i) => ({ ...i, available: !i.isNonstandard && !rules.isBanned(`item:${i.id}`) })),
      pokeapi: ['items', 'item_names', 'item_id'],
      // "Metronome (item)" when the name is ambiguous, else just the name ("Leek").
      pages: (name) => [`${name} (item)`, name],
    },
  ]

  const pins: Record<string, number> = {}
  for (const c of categories) {
    const es = await spanishNames(sources.pokeapi, ...c.pokeapi)
    const entries = c.entries(es).sort((a, b) => a.id.localeCompare(b.id))
    const available = entries.filter((e) => e.available)
    const overrides: Record<string, string> = ES_NAMES[c.key]

    // Spanish names PokéAPI doesn't have yet (for entries the regulation has) come from Bulbapedia.
    const lacking = available.filter((e) => !overrides[e.id] && !es.has(e.id))
    const wiki = await bulbapedia(
      lacking.flatMap((e) => c.pages(e.name)),
      sources.bulbapedia,
    )
    for (const e of lacking) {
      const page = c.pages(e.name).find((t) => wiki.text.has(t))
      const name = page && bulbapediaSpanish(wiki.text.get(page)!)
      if (!name) {
        throw new Error(`No Spanish name for ${e.name}: add it to ES_NAMES.${c.key} in scripts/overrides.ts`)
      }
      es.set(e.id, name)
      pins[page] = wiki.found[page]!
      console.log(`Bulbapedia: ${e.name} is "${name}" (${page}, revision ${pins[page]})`)
    }
    const redundant = Object.keys(overrides).filter((id) => overrides[id] === es.get(id))
    if (redundant.length) console.warn(`The sources now agree with the ${c.key} overrides for ${redundant.join(', ')}`)

    // Every entry by Showdown ID, and whether the regulation has it. Names only for those it has, the only ones
    // the app shows.
    await writeJson(`${c.key}.json`, Object.fromEntries(entries.map((e) => [e.id, { available: e.available }])))
    await writeJson(`${c.key}.names.en.json`, Object.fromEntries(available.map((e) => [e.id, e.name])))
    await writeJson(
      `${c.key}.names.es.json`,
      Object.fromEntries(available.map((e) => [e.id, overrides[e.id] ?? es.get(e.id)!])),
    )
    console.log(`${available.length} of ${entries.length} ${c.key} available`)
  }
  sources.bulbapedia = Object.fromEntries(Object.entries(pins).sort(([a], [b]) => a.localeCompare(b)))

  // Where all of the above came from.
  await writeJson('source.json', {
    note: "Generated by `npm run gen-data` (scripts/gen-data.ts): don't edit anything in this folder by hand.",
    regulation: reg,
    format: format.name,
    showdown: sources.showdown,
    pokeapi: sources.pokeapi,
    bulbapedia: sources.bulbapedia,
  })
  const pinned = JSON.stringify(sources, null, 2) + '\n'
  if (pinned !== saved) {
    writeFileSync(SOURCES_FILE, pinned)
    console.log('Updated scripts/sources.json')
  }
}

await main()

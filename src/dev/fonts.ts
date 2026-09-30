// Dev-only font lab: try candidate fonts across the whole app.
// Fonts load from Google Fonts on demand; picks are saved in localStorage and
// applied through the --font-display / --font-body / --font-num CSS variables.
import { reactive, watch } from 'vue'

export interface FontOption {
  id: string
  label: string
  /** Google Fonts css2 `family=` value; omitted for the built-in default. */
  google?: string
  stack: string
  note: string
}

const PIXEL_FALLBACK = 'Verdana, sans-serif'

export const DISPLAY_FONTS: FontOption[] = [
  { id: 'default', label: 'Default (Verdana)', stack: '', note: 'Current look.' },
  {
    id: 'pixelify',
    label: 'Pixelify Sans',
    google: 'Pixelify+Sans:wght@400;700',
    stack: `'Pixelify Sans', ${PIXEL_FALLBACK}`,
    note: 'Soft modern pixel; vector, scales to any size.',
  },
  {
    id: 'silkscreen',
    label: 'Silkscreen',
    google: 'Silkscreen:wght@400;700',
    stack: `'Silkscreen', ${PIXEL_FALLBACK}`,
    note: 'Tiny UI pixel font; crisp at multiples of 8px.',
  },
  {
    id: 'pressstart',
    label: 'Press Start 2P',
    google: 'Press+Start+2P',
    stack: `'Press Start 2P', ${PIXEL_FALLBACK}`,
    note: 'Bold 8-bit arcade; wide and loud.',
  },
  {
    id: 'vt323',
    label: 'VT323',
    google: 'VT323',
    stack: `'VT323', ${PIXEL_FALLBACK}`,
    note: 'Terminal / CRT; runs small, try a bigger scale.',
  },
  {
    id: 'dotgothic',
    label: 'DotGothic16',
    google: 'DotGothic16',
    stack: `'DotGothic16', ${PIXEL_FALLBACK}`,
    note: 'Dot-matrix, Game Boy text box.',
  },
]

export const BODY_FONTS: FontOption[] = [
  { id: 'default', label: 'Default (Verdana)', stack: '', note: 'Current look.' },
  {
    id: 'atkinson',
    label: 'Atkinson Hyperlegible Next',
    google: 'Atkinson+Hyperlegible+Next:wght@400;700',
    stack: `'Atkinson Hyperlegible Next', Verdana, sans-serif`,
    note: 'Built for legibility, distinctive letterforms.',
  },
  {
    id: 'plexsans',
    label: 'IBM Plex Sans',
    google: 'IBM+Plex+Sans:wght@400;700',
    stack: `'IBM Plex Sans', Verdana, sans-serif`,
    note: 'Technical, dense, good for tables.',
  },
  {
    id: 'nunito',
    label: 'Nunito',
    google: 'Nunito:wght@400;700',
    stack: `'Nunito', Verdana, sans-serif`,
    note: 'Rounded and friendly.',
  },
  {
    id: 'pixelify',
    label: 'Pixelify Sans',
    google: 'Pixelify+Sans:wght@400;700',
    stack: `'Pixelify Sans', ${PIXEL_FALLBACK}`,
    note: 'Pixel everywhere, to see how far it goes.',
  },
]

export const NUM_FONTS: FontOption[] = [
  { id: 'default', label: 'Same as body', stack: '', note: 'Numbers use the body font.' },
  {
    id: 'plexmono',
    label: 'IBM Plex Mono',
    google: 'IBM+Plex+Mono:wght@400;700',
    stack: `'IBM Plex Mono', monospace`,
    note: 'Stat-readout feel.',
  },
  {
    id: 'jetbrains',
    label: 'JetBrains Mono',
    google: 'JetBrains+Mono:wght@400;700',
    stack: `'JetBrains Mono', monospace`,
    note: 'Taller mono, very clear digits.',
  },
  {
    id: 'pixelify',
    label: 'Pixelify Sans',
    google: 'Pixelify+Sans:wght@400;700',
    stack: `'Pixelify Sans', ${PIXEL_FALLBACK}`,
    note: 'Pixel digits; check ½ and ¼.',
  },
  {
    id: 'vt323',
    label: 'VT323',
    google: 'VT323',
    stack: `'VT323', ${PIXEL_FALLBACK}`,
    note: 'Terminal digits; check ½ and ¼.',
  },
]

export const DISPLAY_SCALES = [1, 1.25, 1.5, 2] as const

export interface FontPicks {
  display: string
  body: string
  num: string
  displayScale: number
}

const KEY = 'mondex.dev.fonts'
const DEFAULTS: FontPicks = { display: 'default', body: 'default', num: 'default', displayScale: 1 }

function read(): FontPicks {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<FontPicks>) }
  } catch {
    // Storage unavailable or corrupt.
  }
  return { ...DEFAULTS }
}

export const picks = reactive<FontPicks>(read())

const loaded = new Set<string>()
function load(font: FontOption) {
  if (!font.google || loaded.has(font.google)) return
  loaded.add(font.google)
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${font.google}&display=swap`
  document.head.appendChild(link)
}

/** Load every candidate so the lab page can preview them side by side. */
export function loadAll() {
  for (const f of [...DISPLAY_FONTS, ...BODY_FONTS, ...NUM_FONTS]) load(f)
}

function setVar(name: string, options: FontOption[], id: string) {
  const font = options.find((f) => f.id === id) ?? options[0]!
  load(font)
  const root = document.documentElement.style
  if (font.stack) root.setProperty(name, font.stack)
  else root.removeProperty(name)
}

function apply() {
  setVar('--font-display', DISPLAY_FONTS, picks.display)
  setVar('--font-body', BODY_FONTS, picks.body)
  setVar('--font-num', NUM_FONTS, picks.num)
  document.documentElement.style.setProperty('--display-scale', String(picks.displayScale))
}

export function resetPicks() {
  Object.assign(picks, DEFAULTS)
}

watch(
  picks,
  () => {
    apply()
    try {
      localStorage.setItem(KEY, JSON.stringify(picks))
    } catch {
      // Storage unavailable: picks last for this page load.
    }
  },
  { immediate: true },
)

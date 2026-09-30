import { ref, watch } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'system'

const KEY = 'mondex.theme'

function read(): ThemeMode {
  try {
    const t = localStorage.getItem(KEY)
    if (t === 'light' || t === 'dark') return t
  } catch {
    // Storage unavailable.
  }
  return 'system'
}

const mode = ref<ThemeMode>(read())

watch(mode, (m) => {
  const root = document.documentElement
  if (m === 'system') delete root.dataset.theme
  else root.dataset.theme = m
  try {
    if (m === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, m)
  } catch {
    // Storage unavailable: the choice lasts for this page load.
  }
})

const ORDER: ThemeMode[] = ['light', 'dark', 'system']

export function useTheme() {
  const cycle = () => {
    mode.value = ORDER[(ORDER.indexOf(mode.value) + 1) % ORDER.length]!
  }
  return { mode, cycle }
}

import { computed, ref } from 'vue'

export type Theme = 'light' | 'dark'

const KEY = 'mondex.theme'

function readChoice(): Theme | null {
  try {
    const t = localStorage.getItem(KEY)
    if (t === 'light' || t === 'dark') return t
  } catch {
    // Storage unavailable.
  }
  return null
}

// Until the user picks a theme, follow the OS preference (live).
const choice = ref<Theme | null>(readChoice())
const media = window.matchMedia('(prefers-color-scheme: dark)')
const systemDark = ref(media.matches)
media.addEventListener('change', (e) => (systemDark.value = e.matches))

const theme = computed<Theme>(() => choice.value ?? (systemDark.value ? 'dark' : 'light'))

export function useTheme() {
  const toggle = () => {
    const next: Theme = theme.value === 'dark' ? 'light' : 'dark'
    choice.value = next
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // Storage unavailable: the choice lasts for this page load.
    }
  }
  return { theme, toggle }
}

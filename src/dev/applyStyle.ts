// Dev-only: applies the style lab pick (see `styles.ts`) to <html> and saves it.
import { watch } from 'vue'
import { STYLE_KEY, style } from './styles'
import './brutal.css'

watch(
  style,
  (id) => {
    const root = document.documentElement
    if (id === 'default') delete root.dataset.style
    else root.dataset.style = id
    try {
      localStorage.setItem(STYLE_KEY, id)
    } catch {
      // Storage unavailable: the pick lasts for this page load.
    }
  },
  { immediate: true },
)

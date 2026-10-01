import { ref } from 'vue'
import { crossFade } from '@/composables/useTheme'

/**
 * The app's visual style, independent of light/dark. `retro` (the default) has square corners, ink outlines, hard
 * shadows and flat type badges (`src/styles/retro.css`); `pixel` is the softer original look with Showdown's type
 * sprites. Applied as `data-style` on <html>, which index.html also sets before first paint.
 */
export type Style = 'retro' | 'pixel'

export const STYLES: readonly Style[] = ['retro', 'pixel']

const KEY = 'mondex.style'

function read(): Style {
  try {
    if (localStorage.getItem(KEY) === 'pixel') return 'pixel'
  } catch {
    // Storage unavailable.
  }
  return 'retro'
}

const style = ref<Style>(read())
document.documentElement.dataset.style = style.value

export function useStyle() {
  const setStyle = (next: Style) => {
    crossFade(() => {
      style.value = next
      document.documentElement.dataset.style = next
    })
    try {
      if (next === 'pixel') localStorage.setItem(KEY, next)
      else localStorage.removeItem(KEY)
    } catch {
      // Storage unavailable: the choice lasts for this page load.
    }
  }
  return { style, setStyle }
}

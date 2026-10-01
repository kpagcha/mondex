// Dev-only style lab: try alternative visual styles across the whole app.
// The pick is saved in localStorage and applied as `data-style` on <html> by `applyStyle.ts`; each style's CSS keys
// off that attribute and works on top of both light and dark themes. This module has no side effects, so components
// can read `style` behind an `import.meta.env.DEV` check and it drops out of production builds.
import { ref } from 'vue'

export interface StyleOption {
  id: string
  label: string
  note: string
}

export const STYLES: StyleOption[] = [
  { id: 'default', label: 'Default', note: 'Current look.' },
  {
    id: 'brutal',
    label: 'Retro brutalist',
    note: 'Square corners, ink borders, hard offset shadows, buttons that press in, flat type badges.',
  },
]

export const STYLE_KEY = 'mondex.dev.style'

function read(): string {
  try {
    const id = localStorage.getItem(STYLE_KEY)
    if (id && STYLES.some((s) => s.id === id)) return id
  } catch {
    // Storage unavailable.
  }
  return 'default'
}

// Annotated pure so production builds, where nothing reads it, drop it.
export const style = /* @__PURE__ */ ref(/* @__PURE__ */ read())

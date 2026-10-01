// Dev-only: type glyphs for the brutalist style's badges, keyed by type. White-on-transparent 64×64 PNGs from the
// Bulbagarden Archives (`<Type>_icon.png`, as used on Bulbapedia's Type page), bundled because the archive blocks
// cross-site image requests. The badges use them as CSS masks so each glyph takes the badge's text color.
import type { TypeId } from '@/data/types'

function load(): Record<TypeId, string> {
  const files = import.meta.glob<string>('./type-icons/*.png', { eager: true, import: 'default' })
  return Object.fromEntries(
    Object.entries(files).map(([path, url]) => [path.slice('./type-icons/'.length, -'.png'.length), url]),
  ) as Record<TypeId, string>
}

// Annotated pure so production builds, where nothing reads it, drop the glyphs.
export const TYPE_GLYPHS = /* @__PURE__ */ load()

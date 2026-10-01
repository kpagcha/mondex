import { animate } from 'motion-v'
import { SCROLL } from '@/lib/motion'

/** Space kept between the revealed content and the screen's edge. */
const MARGIN = 12

let running: { stop(): void } | null = null

function stop() {
  running?.stop()
  running = null
}

/**
 * Smoothly scrolls the page by the least amount that brings `from`'s top through `to`'s bottom into view. When
 * that's taller than the screen, the top wins. Does nothing if it's already in view; the user scrolling or touching
 * the screen takes over.
 */
export function reveal(from: Element | null | undefined, to: Element | null | undefined = from) {
  if (!from || !to) return
  const top = from.getBoundingClientRect().top
  const bottom = to.getBoundingClientRect().bottom
  const vh = window.innerHeight
  let delta = 0
  if (top < MARGIN) delta = top - MARGIN
  else if (bottom > vh - MARGIN) delta = Math.min(bottom - vh + MARGIN, top - MARGIN)
  const start = window.scrollY
  const max = document.documentElement.scrollHeight - vh
  const target = Math.max(0, Math.min(max, start + delta))
  if (Math.abs(target - start) < 1) return

  stop()
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo(0, target)
    return
  }
  running = animate(start, target, { ...SCROLL, onUpdate: (y) => window.scrollTo(0, y) })
  const opts = { passive: true, once: true }
  window.addEventListener('wheel', stop, opts)
  window.addEventListener('touchstart', stop, opts)
}

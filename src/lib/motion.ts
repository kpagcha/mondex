import type { Transition } from 'motion-v'

// Shared timings so every animation in the app feels like one system.

/** Things that move or swap places: snappy, no visible bounce. */
export const SPRING: Transition = { type: 'spring', stiffness: 520, damping: 40 }

/** Things that appear or disappear. */
export const FADE: Transition = { duration: 0.16, ease: 'easeOut' }

/** Page changes: a quick slide that settles gently, with no bounce. */
export const PAGE: Transition = { duration: 0.32, ease: [0.32, 0.72, 0, 1] }

/** Press feedback for tappable items. */
export const PRESS = { scale: 0.95 }

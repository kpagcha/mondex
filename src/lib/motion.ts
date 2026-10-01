import type { Transition } from 'motion-v'

// Shared timings so every animation in the app feels like one system.

/** Things that move or swap places: snappy, no visible bounce. */
export const SPRING: Transition = { type: 'spring', stiffness: 520, damping: 40 }

/** Things that appear or disappear. */
export const FADE: Transition = { duration: 0.16, ease: 'easeOut' }

/** Press feedback for tappable items. */
export const PRESS = { scale: 0.95 }

// Dev-only helpers to fast-forward the quiz. Imported only by QuizDevTools, which is loaded only in dev.

import { grade, rollDay, type Deck } from '@/lib/srs'

const DAY = 86_400_000

/**
 * Answer `n` cards the way the quiz would pick them, each correct with probability `rate`.
 * The daily new-card counter is left as it was, so a real session can still introduce new cards.
 */
export function simulateAnswers(deck: Deck, n: number, rate: number, pick: (avoid?: string) => string | null) {
  const newToday = deck.newToday
  let last: string | undefined
  for (let i = 0; i < n; i++) {
    const id = pick(last)
    if (!id) break
    grade(deck, id, Math.random() < rate ? 4 : 1)
    last = id
  }
  deck.newToday = newToday
}

/** Answer the first `n` unseen cards of `ids` correctly, which graduates them. */
export function graduate(deck: Deck, ids: Iterable<string>, n: number) {
  const newToday = deck.newToday
  for (const id of ids) {
    if (n <= 0) break
    if (deck.cards[id]) continue
    grade(deck, id, 4)
    n--
  }
  deck.newToday = newToday
}

/** Move a day forward: every due date comes a day sooner, and today's new-card allowance resets. */
export function skipDay(deck: Deck) {
  for (const c of Object.values(deck.cards)) if (c.step < 0) c.due -= DAY
  deck.day = ''
  rollDay(deck)
}

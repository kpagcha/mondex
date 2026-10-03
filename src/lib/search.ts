// Matching names against a search query, shared by the search boxes.

/** Folds a name for matching, ignoring case and accents: "levitacion" finds "Levitación". */
export const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

/** A character that continues a word: an apostrophe too, so "King's" is one word. */
const IN_WORD = /[\p{L}\p{N}'’]/u

/** The first place `q` occurs in `folded` at the start of a word (anything else separates words), or -1. */
function wordMatch(folded: string, q: string): number {
  for (let at = folded.indexOf(q); at >= 0; at = folded.indexOf(q, at + 1)) {
    if (at === 0 || !IN_WORD.test(folded[at - 1]!)) return at
  }
  return -1
}

/**
 * `name` split around the first match of the folded query `q` at the start of a word ("ab" finds "Volt Absorb", "now"
 * doesn't find "Abomasnow"): [before, match, after], or null. The match is found in the folded name, then mapped back
 * character by character, so it's highlighted in the name as written.
 */
export function split(name: string, q: string): [string, string, string] | null {
  const chars = [...name]
  let folded = ''
  const starts: number[] = [] // Where each character of the name starts in `folded`
  for (const c of chars) {
    starts.push(folded.length)
    folded += fold(c)
  }
  const at = wordMatch(folded, q)
  if (at < 0) return null
  let from = 0
  while (from + 1 < starts.length && starts[from + 1]! <= at) from++
  const to = starts.findIndex((i) => i >= at + q.length)
  const end = to < 0 ? chars.length : to
  return [chars.slice(0, from).join(''), chars.slice(from, end).join(''), chars.slice(end).join('')]
}

import { chart, type TypeId } from '@/data/types'
import { t, type MessageKey } from '@/i18n'

/** The memory hook for a matchup ("Water puts out fire."), or null for neutral ones, which have none. */
export function hintFor(atk: TypeId, def: TypeId): string | null {
  return chart(atk, def) === 1 ? null : t(`hint.${atk}.${def}` as MessageKey)
}

<script setup lang="ts">
import type { Entry } from '@/data/typeinfo'
import { t, termName } from '@/i18n'
import type { InfoRow } from '@/lib/interactions'
import { formatMult, multClass } from '@/lib/typecalc'
import TypeIcon from '@/components/TypeIcon.vue'

defineProps<{ rows: InfoRow[] }>()

/** In rows mixing several move types, each run of one type's entries starts with its badge. */
const startsRun = (list: { of?: unknown }[], i: number) => !!list[i]!.of && list[i]!.of !== list[i - 1]?.of

/** What an entry does besides its multiplier: "+1 SpA", "Def 1.5×", "+1 priority", "sound moves", or several of
 * them ("redirects, +1 SpA"). */
function effectText(e: Entry): string {
  const parts: string[] = []
  if (e.fx) parts.push(t(e.fx))
  if (e.priority) parts.push(t('info.priority', { n: e.priority }))
  if (e.stat) {
    const stat = t(`stat.${e.stat}`)
    parts.push(e.stages ? `+${e.stages} ${stat}` : `${stat} ${formatMult(e.statMult ?? 1)}`)
  }
  return parts.join(', ')
}
</script>

<template>
  <dl class="info">
    <template v-for="row in rows" :key="row.label">
      <dt class="muted">{{ row.label }}</dt>
      <dd>
        <template v-for="(e, i) in row.entries" :key="`${e.of ?? ''}/${e.term}/${e.cond ?? ''}`">
          <TypeIcon v-if="startsRun(row.entries!, i)" :type="e.of!" class="of" />
          <span class="term">
            {{ termName(e.term) }}
            <span v-if="e.cond" class="effect">({{ termName(e.cond) }})</span>
            <span v-if="e.mult !== undefined" class="mult-tag" :class="multClass(e.mult)">
              {{ formatMult(e.mult) }}
            </span>
            <TypeIcon v-if="e.vs" :type="e.vs" />
            <span v-if="effectText(e)" class="effect num">{{ effectText(e) }}</span>
          </span>
        </template>
        <template v-for="(n, i) in row.notes" :key="`${n.of ?? ''}/${n.text}`">
          <TypeIcon v-if="startsRun(row.notes!, i)" :type="n.of!" class="of" />
          <span class="term">{{ n.text }}</span>
        </template>
      </dd>
    </template>
  </dl>
</template>

<style scoped>
.info {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 6px 10px;
  align-items: baseline;
  margin: 0;
}
.info dd {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 0;
}
.term {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 5px;
  background: var(--panel-alt);
  border: 1px solid var(--border);
  border-radius: 3px;
}
.term .mult-tag {
  min-width: 0;
  padding: 0 0.3em;
}
.effect {
  color: var(--muted);
}
/* A move type's badge leads its entries, a little apart from the previous type's. */
.of:not(:first-child) {
  margin-left: 6px;
}
.of {
  align-self: center;
}
</style>

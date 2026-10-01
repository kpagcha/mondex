<script setup lang="ts">
import type { Entry } from '@/data/typeinfo'
import { t, termName } from '@/i18n'
import { formatMult, multClass } from '@/lib/typecalc'
import TypeIcon from '@/components/TypeIcon.vue'

export interface InfoRow {
  label: string
  /** Named entries, or plain notes. */
  entries?: Entry[]
  notes?: string[]
}

defineProps<{ rows: InfoRow[] }>()

/** What an entry does besides its multiplier: "+1 SpA", "Def 1.5×", "+1 priority", "sound moves". */
function effectText(e: Entry): string {
  if (e.fx) return t(e.fx)
  if (e.priority) return t('info.priority', { n: e.priority })
  if (!e.stat) return ''
  const stat = t(`stat.${e.stat}`)
  return e.stages ? `+${e.stages} ${stat}` : `${stat} ${formatMult(e.statMult ?? 1)}`
}
</script>

<template>
  <dl class="info">
    <template v-for="row in rows" :key="row.label">
      <dt class="muted">{{ row.label }}</dt>
      <dd>
        <span v-for="e in row.entries" :key="e.term + (e.cond ?? '')" class="term">
          {{ termName(e.term) }}
          <span v-if="e.cond" class="effect">({{ termName(e.cond) }})</span>
          <span v-if="e.mult !== undefined" class="mult-tag" :class="multClass(e.mult)">
            {{ formatMult(e.mult) }}
          </span>
          <TypeIcon v-if="e.vs" :type="e.vs" />
          <span v-if="effectText(e)" class="effect num">{{ effectText(e) }}</span>
        </span>
        <span v-for="n in row.notes" :key="n" class="term">{{ n }}</span>
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
</style>

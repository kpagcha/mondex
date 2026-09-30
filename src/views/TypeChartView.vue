<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { TYPES, chart, isType } from '@/data/types'
import { t, typeName } from '@/i18n'
import { multClass } from '@/lib/typecalc'
import TypeIcon from '@/components/TypeIcon.vue'

const rows = TYPES.map((atk) =>
  TYPES.map((def) => {
    const m = chart(atk, def)
    return { m, cls: multClass(m), text: m === 1 ? '' : m === 0.5 ? '½' : String(m) }
  }),
)

// Selected cell lives in the URL (?atk=fire&def=water) so it can be shared.
const route = useRoute()
const router = useRouter()
const sel = computed(() => {
  const { atk, def } = route.query
  if (typeof atk !== 'string' || typeof def !== 'string' || !isType(atk) || !isType(def)) return null
  return { r: TYPES.indexOf(atk), c: TYPES.indexOf(def) }
})

// Hover wins while the pointer is over a cell; otherwise the selection shows.
const hover = ref<{ r: number; c: number } | null>(null)
const hr = computed(() => hover.value?.r ?? sel.value?.r ?? -1)
const hc = computed(() => hover.value?.c ?? sel.value?.c ?? -1)

function cellAt(e: Event) {
  const td = (e.target as HTMLElement).closest<HTMLElement>('[data-r]')
  return td ? { r: Number(td.dataset.r), c: Number(td.dataset.c) } : null
}
function onOver(e: MouseEvent) {
  hover.value = cellAt(e)
}
function onLeave() {
  hover.value = null
}
function onClick(e: MouseEvent) {
  const cell = cellAt(e)
  if (!cell) return
  const same = sel.value?.r === cell.r && sel.value?.c === cell.c
  router.replace({ query: same ? {} : { atk: TYPES[cell.r], def: TYPES[cell.c] } })
}

// On a shared link, bring the selected cell into view (the chart scrolls on phones).
const table = useTemplateRef<HTMLTableElement>('table')
onMounted(async () => {
  if (!sel.value) return
  await nextTick()
  table.value
    ?.querySelector(`[data-r="${sel.value.r}"][data-c="${sel.value.c}"]`)
    ?.scrollIntoView({ block: 'nearest', inline: 'center' })
})
</script>

<template>
  <div class="panel">
    <h1>{{ t('title.chart') }}</h1>
    <p class="muted">{{ t('chart.intro') }}</p>
    <div class="legend">
      <span class="legend-item"><span class="mult-tag m-2">2×</span> {{ t('legend.se') }}</span>
      <span class="legend-item"><span class="mult-tag m-0_5">½×</span> {{ t('legend.nve') }}</span>
      <span class="legend-item"><span class="mult-tag m-0">0×</span> {{ t('legend.none') }}</span>
    </div>
  </div>

  <div class="panel scroller">
    <table ref="table" class="chart" @mouseover="onOver" @mouseleave="onLeave" @click="onClick">
      <thead>
        <tr>
          <th class="corner">
            <span>{{ t('chart.atk') }} ↓</span><span>{{ t('chart.def') }} →</span>
          </th>
          <th v-for="(def, j) in TYPES" :key="def" :class="{ hl: hc === j }">
            <RouterLink :to="{ path: '/types/calc', query: { def } }">
              <TypeIcon :type="def" />
            </RouterLink>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(atk, i) in TYPES" :key="atk" :class="{ hl: hr === i }">
          <th class="rowh">
            <RouterLink :to="{ path: '/types/calc', query: { mode: 'atk', atk } }">
              <TypeIcon :type="atk" />
            </RouterLink>
          </th>
          <td
            class="num"
            v-for="(cell, j) in rows[i]"
            :key="j"
            :data-r="i"
            :data-c="j"
            :class="[cell.cls, { hc: hc === j, cur: hr === i && hc === j, selected: sel?.r === i && sel?.c === j }]"
            v-tip:chart="`${typeName(atk)} → ${typeName(TYPES[j]!)}: ${cell.m}×`"
          >
            {{ cell.text }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
}
/* A multiplier and its label never split across lines. */
.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.scroller {
  overflow-x: auto;
  --pad: 8px;
  padding: var(--pad);
}

.chart {
  border-collapse: collapse;
  margin: 0 auto;
  font-weight: bold;
}

.chart th,
.chart td {
  border: 1px solid var(--border);
  padding: 0;
  text-align: center;
}

.chart thead th {
  padding: 4px 2px;
  background: var(--panel-alt);
}

.chart td {
  width: 36px;
  min-width: 36px;
  height: 24px;
  cursor: pointer;
}

.rowh {
  position: sticky;
  left: calc(-1 * var(--pad));
  z-index: 1;
  padding: 2px 4px;
  background: var(--panel-alt);
}

.corner {
  position: sticky;
  left: calc(-1 * var(--pad));
  z-index: 2;
  font-size: 9px;
  font-weight: normal;
  color: var(--muted);
  line-height: 1.2;
}
.corner span {
  display: block;
  white-space: nowrap;
}

.chart th a {
  display: inline-block;
  line-height: 0;
}

.chart thead th.hl,
.chart tr.hl .rowh {
  background: var(--hover);
}
.chart tr.hl td,
.chart td.hc {
  box-shadow: inset 0 0 0 999px rgb(127 160 220 / 0.08);
}
.chart td.cur {
  outline: 1px solid var(--accent);
  outline-offset: -1px;
}
.chart td.selected {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}
</style>

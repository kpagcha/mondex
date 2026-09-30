<script setup lang="ts">
import { ref } from 'vue'
import { TYPES, TYPE_NAMES, chart } from '@/data/types'
import { multClass } from '@/lib/typecalc'
import TypeIcon from '@/components/TypeIcon.vue'

const rows = TYPES.map((atk) =>
  TYPES.map((def) => {
    const m = chart(atk, def)
    return { m, cls: multClass(m), text: m === 1 ? '' : m === 0.5 ? '½' : String(m) }
  }),
)

const hr = ref(-1)
const hc = ref(-1)

function onOver(e: MouseEvent) {
  const td = (e.target as HTMLElement).closest<HTMLElement>('[data-r]')
  hr.value = td ? Number(td.dataset.r) : -1
  hc.value = td ? Number(td.dataset.c) : -1
}
function onLeave() {
  hr.value = -1
  hc.value = -1
}
</script>

<template>
  <div class="panel">
    <h1>Type chart</h1>
    <p class="muted">
      Rows are the attacking move's type, columns the defending Pokémon's type. Click a type to
      open it in the calculator.
    </p>
    <div class="legend">
      <span class="mult-tag m-2">2×</span> super effective
      <span class="mult-tag m-0_5">½×</span> not very effective
      <span class="mult-tag m-0">0×</span> no effect
    </div>
  </div>

  <div class="panel scroller">
    <table class="chart" @mouseover="onOver" @mouseleave="onLeave">
      <thead>
        <tr>
          <th class="corner"><span>Atk ↓</span><span>Def →</span></th>
          <th v-for="(def, j) in TYPES" :key="def" :class="{ hl: hc === j }">
            <RouterLink :to="{ path: '/types/calc', query: { def } }" :title="`${TYPE_NAMES[def]} (defending)`">
              <TypeIcon :type="def" />
            </RouterLink>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(atk, i) in TYPES" :key="atk" :class="{ hl: hr === i }">
          <th class="rowh">
            <RouterLink
              :to="{ path: '/types/calc', query: { mode: 'atk', atk } }"
              :title="`${TYPE_NAMES[atk]} (attacking)`"
            >
              <TypeIcon :type="atk" />
            </RouterLink>
          </th>
          <td
            v-for="(cell, j) in rows[i]"
            :key="j"
            :data-r="i"
            :data-c="j"
            :class="[cell.cls, { hc: hc === j, cur: hr === i && hc === j }]"
            :title="`${TYPE_NAMES[atk]} → ${TYPE_NAMES[TYPES[j]!]}: ${cell.m}×`"
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
  align-items: center;
  gap: 6px 8px;
}
.legend .mult-tag {
  margin-left: 8px;
}
.legend .mult-tag:first-child {
  margin-left: 0;
}

.scroller {
  overflow-x: auto;
  padding: 8px;
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
  cursor: default;
}

.rowh {
  position: sticky;
  left: 0;
  z-index: 1;
  padding: 2px 4px;
  background: var(--panel-alt);
}

.corner {
  position: sticky;
  left: 0;
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
  background: var(--sel);
}
.chart tr.hl td,
.chart td.hc {
  box-shadow: inset 0 0 0 999px rgb(127 160 220 / 0.18);
}
.chart td.cur {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}
</style>

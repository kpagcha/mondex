<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isType, type Multiplier, type TypeId } from '@/data/types'
import { t, type MessageKey } from '@/i18n'
import { defensiveProfile, formatMult, groupByRoot, multClass, offensiveProfile, typesLabel } from '@/lib/typecalc'
import TypeIcon from '@/components/TypeIcon.vue'
import TypePicker from '@/components/TypePicker.vue'

const route = useRoute()
const router = useRouter()

function parseTypes(v: unknown, max: number): TypeId[] {
  const s = typeof v === 'string' ? v : ''
  return [...new Set(s.split(',').filter(isType))].slice(0, max)
}

const mode = computed(() => (route.query.mode === 'atk' ? 'atk' : 'def'))
const def = computed(() => parseTypes(route.query.def, 2))
const atk = computed(() => parseTypes(route.query.atk, 4))

function setQuery(patch: Record<string, string | undefined>) {
  const q: Record<string, string> = {}
  for (const [k, v] of Object.entries({ ...route.query, ...patch })) {
    if (typeof v === 'string' && v) q[k] = v
  }
  router.replace({ query: q })
}

const setDef = (v: TypeId[]) => setQuery({ def: v.join(',') })
const setAtk = (v: TypeId[]) => setQuery({ atk: v.join(',') })

// ---- Defense ----
const DEF_ROWS: { m: Multiplier; label: MessageKey }[] = [
  { m: 4, label: 'calc.weak' },
  { m: 2, label: 'calc.weak' },
  { m: 1, label: 'calc.neutral' },
  { m: 0.5, label: 'calc.resists' },
  { m: 0.25, label: 'calc.resists' },
  { m: 0, label: 'calc.immune' },
]
const defProfile = computed(() => (def.value.length ? defensiveProfile(def.value) : null))
const defRows = computed(() => DEF_ROWS.filter((r) => defProfile.value?.[r.m].length))

// ---- Offense ----
const coverage = computed(() => (atk.value.length ? offensiveProfile(atk.value) : null))
// Most to least effective, immunities last; ties keep type order (stable sort).
const singles = computed(() => coverage.value?.filter((e) => e.def.length === 1).sort((a, b) => b.best - a.best) ?? [])
const counts = computed(() => {
  const c: Record<number, number> = { 0: 0, 0.25: 0, 0.5: 0, 1: 0, 2: 0, 4: 0 }
  for (const e of coverage.value ?? []) c[e.best]!++
  return c
})
const immune = computed(() => coverage.value?.filter((e) => e.best === 0) ?? [])
const resisted = computed(() => coverage.value?.filter((e) => e.best > 0 && e.best <= 0.5) ?? [])
const immuneGroups = computed(() => groupByRoot(immune.value))
const resistedGroups = computed(() => groupByRoot(resisted.value))
const neutral = computed(() => coverage.value?.filter((e) => e.best === 1) ?? [])
const COUNT_ORDER: Multiplier[] = [4, 2, 1, 0.5, 0.25, 0]
</script>

<template>
  <div class="panel">
    <h1>{{ t('title.calc') }}</h1>
    <nav class="tabs">
      <RouterLink :to="{ query: { ...route.query, mode: undefined } }" :class="{ active: mode === 'def' }">
        {{ t('calc.tabDef') }}
      </RouterLink>
      <RouterLink :to="{ query: { ...route.query, mode: 'atk' } }" :class="{ active: mode === 'atk' }">
        {{ t('calc.tabAtk') }}
      </RouterLink>
    </nav>

    <template v-if="mode === 'def'">
      <p class="muted">{{ t('calc.pickDef') }}</p>
      <TypePicker :model-value="def" :max="2" @update:model-value="setDef" />
    </template>
    <template v-else>
      <p class="muted">{{ t('calc.pickAtk') }}</p>
      <TypePicker :model-value="atk" :max="4" @update:model-value="setAtk" />
    </template>
  </div>

  <!-- Defense results -->
  <div v-if="mode === 'def' && defProfile" class="panel">
    <table class="groups">
      <tbody>
        <tr v-for="row in defRows" :key="row.m">
          <th>
            <span class="mult-tag" :class="multClass(row.m)">{{ formatMult(row.m) }}</span>
            <span class="lbl muted">{{ t(row.label) }}</span>
          </th>
          <td>
            <TypeIcon v-for="t in defProfile[row.m]" :key="t" :type="t" tip-group="defense" class="gap" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Offense results -->
  <template v-if="mode === 'atk' && coverage">
    <div class="panel">
      <p class="muted">{{ t('calc.againstEach') }}</p>
      <div class="single-grid">
        <div v-for="e in singles" :key="e.def[0]" class="single" :class="multClass(e.best)">
          <TypeIcon :type="e.def[0]!" />
          <b class="num">{{ formatMult(e.best) }}</b>
        </div>
      </div>

      <p class="muted counts-title">{{ t('calc.acrossAll', { n: coverage.length }) }}</p>
      <div class="counts">
        <div v-for="m in COUNT_ORDER" :key="m" class="count">
          <span class="mult-tag" :class="multClass(m)">{{ formatMult(m) }}</span>
          <b class="num">{{ counts[m] }}</b>
        </div>
      </div>
    </div>

    <div class="panel">
      <h2>{{ t('calc.immuneTitle', { n: immune.length }) }}</h2>
      <p v-if="!immune.length" class="muted">{{ t('calc.noImmune') }}</p>
      <div v-for="g in immuneGroups.groups" :key="g.root.def[0]" class="root-row">
        <span class="chip" :class="multClass(0)"><TypeIcon :type="g.root.def[0]!" /></span>
        <span class="muted">{{ t('calc.everyDual') }}</span>
      </div>
      <div v-if="immuneGroups.pairOnly.length" class="root-row">
        <span class="muted pair-lbl">{{ t('calc.combosOnly') }}</span>
        <span class="combos">
          <span
            v-for="e in immuneGroups.pairOnly"
            :key="e.def.join()"
            class="chip"
            :class="multClass(0)"
            v-tip:chips="typesLabel(e.def)"
          >
            <TypeIcon v-for="t in e.def" :key="t" :type="t" :tip="false" lazy />
          </span>
        </span>
      </div>
    </div>

    <div class="panel">
      <h2>{{ t('calc.resistedTitle', { n: resisted.length }) }}</h2>
      <p v-if="!resisted.length" class="muted">{{ t('calc.noResist') }}</p>
      <div v-for="g in resistedGroups.groups" :key="g.root.def[0]" class="root-row">
        <span
          class="chip"
          :class="multClass(g.root.best)"
          v-tip:chips="`${typesLabel(g.root.def)}: ${formatMult(g.root.best)}`"
        >
          <TypeIcon :type="g.root.def[0]!" :tip="false" />
        </span>
        <template v-if="g.combos.length">
          <span class="muted">+</span>
          <span class="combos">
            <span
              v-for="c in g.combos"
              :key="c.partner"
              class="chip"
              :class="multClass(c.entry.best)"
              v-tip:chips="`${typesLabel(c.entry.def)}: ${formatMult(c.entry.best)}`"
            >
              <TypeIcon :type="c.partner" :tip="false" lazy />
            </span>
          </span>
        </template>
      </div>
      <div v-if="resistedGroups.pairOnly.length" class="root-row">
        <span class="muted pair-lbl">{{ t('calc.combosOnly') }}</span>
        <span class="combos">
          <span
            v-for="e in resistedGroups.pairOnly"
            :key="e.def.join()"
            class="chip"
            :class="multClass(e.best)"
            v-tip:chips="`${typesLabel(e.def)}: ${formatMult(e.best)}`"
          >
            <TypeIcon v-for="t in e.def" :key="t" :type="t" :tip="false" lazy />
          </span>
        </span>
      </div>
      <p v-if="resisted.length" class="muted small legend">
        <span class="mult-tag m-0_5">½×</span> <span class="mult-tag m-0_25">¼×</span>
        {{ t('calc.partnersNote') }}
      </p>
    </div>

    <details class="panel">
      <summary>
        <h2>{{ t('calc.neutralTitle', { n: neutral.length }) }}</h2>
      </summary>
      <div class="combos">
        <span v-for="e in neutral" :key="e.def.join()" class="chip plain" v-tip:chips="typesLabel(e.def)">
          <TypeIcon v-for="t in e.def" :key="t" :type="t" :tip="false" lazy />
        </span>
      </div>
    </details>
  </template>

  <p v-if="(mode === 'def' && !def.length) || (mode === 'atk' && !atk.length)" class="muted hint">
    {{ t('calc.selectHint') }}
  </p>
</template>

<style scoped>
.groups {
  border-collapse: collapse;
  width: 100%;
}
.groups th,
.groups td {
  border-top: 1px solid var(--border);
  padding: 6px 4px;
  vertical-align: middle;
  text-align: left;
}
.groups tr:first-child th,
.groups tr:first-child td {
  border-top: none;
}
.groups th {
  width: 1%;
  white-space: nowrap;
  font-weight: normal;
}
.lbl {
  display: inline-block;
  width: 60px;
  margin-left: 6px;
}
.gap {
  margin: 2px 4px 2px 0;
}

.single-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(78px, 1fr));
  gap: 4px;
  margin-bottom: 12px;
}
.single {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  padding: 3px 5px;
  border: 1px solid var(--border);
  border-radius: 3px;
}

.counts-title {
  margin-bottom: 4px;
}
.counts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
}
.count {
  display: flex;
  align-items: center;
  gap: 6px;
}

.combos {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.chip {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  border: 1px solid var(--border);
  border-radius: 3px;
}
.root-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 5px 0;
  border-top: 1px solid var(--border);
}
.root-row > .muted {
  line-height: 22px;
}
.pair-lbl {
  white-space: nowrap;
}
.legend {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 8px 0 0;
}
.small {
  font-size: 11px;
}
.chip.plain {
  background: var(--panel-alt);
}

summary {
  cursor: pointer;
}
summary h2 {
  display: inline;
}
details[open] summary {
  margin-bottom: 8px;
}

.hint {
  text-align: center;
}
</style>

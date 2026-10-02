<script setup lang="ts">
import { computed } from 'vue'
import type { Multiplier, TypeId } from '@/data/types'
import { t, type MessageKey } from '@/i18n'
import { defensiveProfile, formatMult, multClass } from '@/lib/typecalc'
import TypeIcon from '@/components/TypeIcon.vue'

const props = defineProps<{ types: readonly TypeId[] }>()

const ROWS: { m: Multiplier; label: MessageKey }[] = [
  { m: 4, label: 'calc.weak' },
  { m: 2, label: 'calc.weak' },
  { m: 0.5, label: 'calc.resists' },
  { m: 0.25, label: 'calc.resists' },
  { m: 0, label: 'calc.immune' },
]
const profile = computed(() => defensiveProfile(props.types))
const rows = computed(() => ROWS.filter((r) => profile.value[r.m].length))
</script>

<template>
  <div class="panel">
    <table class="groups">
      <tbody>
        <tr v-for="row in rows" :key="row.m">
          <th>
            <span class="tier">
              <span class="mult-tag" :class="multClass(row.m)">{{ formatMult(row.m) }}</span>
              <span class="lbl muted">{{ t(row.label) }}</span>
            </span>
          </th>
          <td>
            <span class="icons">
              <TypeIcon v-for="t in profile[row.m]" :key="t" :type="t" />
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
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
.tier {
  display: flex;
  align-items: center;
  gap: 6px;
}
.lbl {
  min-width: 60px;
}
.icons {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>

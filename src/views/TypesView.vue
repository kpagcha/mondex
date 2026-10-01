<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { AnimatePresence, motion } from 'motion-v'
import { TYPES, isType, type Multiplier } from '@/data/types'
import { ATK_ROWS, DEF_ROWS, typeInfo, type Entry, type EntryKey, type TypeInfo } from '@/data/typeinfo'
import { t, termName, typeName, type MessageKey } from '@/i18n'
import { attackProfile, defensiveProfile, formatMult, multClass, type Profile } from '@/lib/typecalc'
import { FADE, PRESS, SPRING } from '@/lib/motion'
import TypeIcon from '@/components/TypeIcon.vue'

// The selected type is the route param (`/types/fire`), validated by the route itself.
const route = useRoute()
const type = computed(() => {
  const p = route.params.type
  return typeof p === 'string' && isType(p) ? p : null
})

const MULTS: Multiplier[] = [2, 0.5, 0]

const sections = computed(() => {
  const ty = type.value
  if (!ty) return []
  const info: TypeInfo = typeInfo(ty)
  // Only the multipliers and interactions this type actually has.
  const rows = (p: Profile) => MULTS.filter((m) => p[m].length).map((m) => ({ m, types: p[m] }))
  const infoRows = (keys: readonly EntryKey[]) =>
    keys.flatMap((k) => (info[k]?.length ? [{ label: `info.${k}` as MessageKey, entries: info[k] }] : []))
  return [
    // The defending side also covers the type's Pokémon; the attacking side, its moves.
    {
      title: 'types.defending' as const,
      rows: rows(defensiveProfile([ty])),
      info: infoRows(DEF_ROWS),
      notes: info.notes ?? [],
    },
    { title: 'types.attacking' as const, rows: rows(attackProfile(ty)), info: infoRows(ATK_ROWS), notes: [] },
  ]
})

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
  <div class="panel">
    <h1>{{ t('title.types') }}</h1>
    <p class="muted">{{ t('types.intro') }}</p>
    <nav class="list">
      <!-- Picking the selected type again closes it. -->
      <RouterLink
        v-for="ty in TYPES"
        :key="ty"
        v-slot="{ href, navigate }"
        :to="ty === type ? '/types' : `/types/${ty}`"
        custom
      >
        <motion.a
          :href="href"
          class="opt"
          :class="{ on: ty === type }"
          :aria-current="ty === type ? 'page' : undefined"
          :while-press="PRESS"
          @click="navigate"
        >
          <!-- The highlight is one element that slides between types. -->
          <motion.span v-if="ty === type" layout-id="type-pill" class="pill" :transition="SPRING" />
          <TypeIcon :type="ty" :scale="2" class="icon" />
        </motion.a>
      </RouterLink>
    </nav>
  </div>

  <AnimatePresence mode="wait" :initial="false">
    <motion.div
      v-if="type"
      :key="type"
      :initial="{ opacity: 0, y: 6 }"
      :animate="{ opacity: 1, y: 0 }"
      :exit="{ opacity: 0, y: -4 }"
      :transition="FADE"
    >
      <div class="panel">
        <h2 class="name">
          <TypeIcon :type="type" :scale="2" />
          {{ typeName(type) }}
        </h2>
        <div class="sides">
          <section v-for="s in sections" :key="s.title">
            <h3>{{ t(s.title) }}</h3>
            <table class="groups">
              <tbody>
                <tr v-for="row in s.rows" :key="row.m">
                  <th>
                    <span class="mult-tag" :class="multClass(row.m)">{{ formatMult(row.m) }}</span>
                  </th>
                  <td>
                    <span class="icons">
                      <RouterLink v-for="x in row.types" :key="x" :to="`/types/${x}`">
                        <TypeIcon :type="x" />
                      </RouterLink>
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            <dl v-if="s.info.length || s.notes.length" class="info">
              <template v-for="row in s.info" :key="row.label">
                <dt class="muted">{{ t(row.label) }}</dt>
                <dd>
                  <span v-for="e in row.entries" :key="e.term" class="term">
                    {{ termName(e.term) }}
                    <span v-if="e.mult !== undefined" class="mult-tag" :class="multClass(e.mult)">
                      {{ formatMult(e.mult) }}
                    </span>
                    <TypeIcon v-if="e.vs" :type="e.vs" />
                    <span v-if="effectText(e)" class="effect num">{{ effectText(e) }}</span>
                  </span>
                </dd>
              </template>
              <template v-if="s.notes.length">
                <dt class="muted">{{ t('info.notes') }}</dt>
                <dd>
                  <span v-for="n in s.notes" :key="n.key" class="term">{{ t(n.key) }}</span>
                </dd>
              </template>
            </dl>
          </section>
        </div>
      </div>
    </motion.div>
  </AnimatePresence>

  <p v-if="!type" class="muted hint">{{ t('types.selectHint') }}</p>
</template>

<style scoped>
.list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
  gap: 4px;
}
.opt {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  background: var(--panel-alt);
  border: 1px solid var(--border);
  border-radius: 3px;
}
.opt:hover {
  background: var(--hover);
}
.opt.on {
  border-color: var(--accent);
}
.opt .pill {
  position: absolute;
  inset: 0;
  background: var(--sel);
  border-radius: 2px;
}
.opt .icon {
  position: relative;
}

.name {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.sides {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px 24px;
}

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
.icons {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.icons a {
  display: flex;
}

.info {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 6px 10px;
  align-items: baseline;
  margin: 0;
  padding: 8px 4px 0;
  border-top: 1px solid var(--border);
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

.hint {
  text-align: center;
}
</style>

<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { AnimatePresence, motion } from 'motion-v'
import { TYPES, isType, type Multiplier, type TypeId } from '@/data/types'
import { ATK_ROWS, DEF_ROWS, MORE_ROWS, typeInfo, type EntryKey, type TypeInfo } from '@/data/typeinfo'
import { t, typeName, type MessageKey } from '@/i18n'
import { attackProfile, defensiveProfile, formatMult, multClass, type Profile } from '@/lib/typecalc'
import { FADE, PRESS, SPRING } from '@/lib/motion'
import { hintFor } from '@/lib/hints'
import { reveal } from '@/lib/scroll'
import TypeIcon from '@/components/TypeIcon.vue'
import QuickLinks from '@/components/QuickLinks.vue'
import InfoRows, { type InfoRow } from '@/components/InfoRows.vue'

// The selected type is the route param (`/types/fire`), validated by the route itself.
const route = useRoute()
const type = computed(() => {
  const p = route.params.type
  return typeof p === 'string' && isType(p) ? p : null
})

const MULTS: Multiplier[] = [2, 0.5, 0]

const info = computed<TypeInfo | null>(() => (type.value ? typeInfo(type.value) : null))

/** Only the interactions this type actually has. */
function infoRows(keys: readonly EntryKey[]): InfoRow[] {
  const i = info.value
  const name = type.value ? typeName(type.value) : ''
  return keys.flatMap((k) =>
    i?.[k]?.length ? [{ label: t(`info.${k}` as MessageKey, { type: name }), entries: i[k] }] : [],
  )
}

const sections = computed(() => {
  const ty = type.value
  if (!ty) return []
  // Only the multipliers this type actually has.
  const rows = (p: Profile) => MULTS.filter((m) => p[m].length).map((m) => ({ m, types: p[m] }))
  const notes = (side?: 'atk') => {
    const list = info.value?.notes?.filter((n) => n.side === side).map((n) => t(n.key)) ?? []
    return list.length ? [{ label: t('info.notes'), notes: list }] : []
  }
  return [
    // Interactions go on the side they help: protecting the type's Pokémon, or its attacks (its moves, and its
    // Pokémon on the offense).
    {
      title: 'types.defending' as const,
      side: 'def' as const,
      rows: rows(defensiveProfile([ty])),
      info: [...infoRows(DEF_ROWS), ...notes()],
    },
    {
      title: 'types.attacking' as const,
      side: 'atk' as const,
      rows: rows(attackProfile(ty)),
      info: [...infoRows(ATK_ROWS), ...notes('atk')],
    },
  ]
})

const more = computed(() => infoRows(MORE_ROWS))

// Picking a type brings its matchups into view (on phones they start below the list).
const detail = useTemplateRef<HTMLElement>('detail')
watch(
  type,
  (ty) => {
    if (ty) reveal(detail.value, detail.value?.querySelector('.groups'))
  },
  { flush: 'post' },
)

/** Remembered per viewer, and kept on while moving between types. */
const LEARN_KEY = 'mondex.types.learn'
const learn = ref(readFlag(LEARN_KEY))
function toggleLearn() {
  learn.value = !learn.value
  writeFlag(LEARN_KEY, learn.value)
}

/** The memory hook for a matchup on this type's `side`; `other` is the type in the row. */
function hint(side: 'def' | 'atk', other: TypeId): string {
  const ty = type.value!
  const [atk, def] = side === 'def' ? [other, ty] : [ty, other]
  // Rows only hold non-neutral matchups, which all have one.
  return hintFor(atk, def) ?? ''
}

function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}
function writeFlag(key: string, on: boolean) {
  try {
    localStorage.setItem(key, on ? '1' : '0')
  } catch {
    // Storage unavailable: the choice lasts for this page load.
  }
}

// Whether "More interactions" is open is remembered across visits.
const MORE_KEY = 'mondex.types.more'
const moreOpen = ref(readFlag(MORE_KEY))
function onToggle(e: Event) {
  moreOpen.value = (e.target as HTMLDetailsElement).open
  writeFlag(MORE_KEY, moreOpen.value)
}
</script>

<template>
  <QuickLinks class="tools" />
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

  <div ref="detail">
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
            <button type="button" class="btn learn" :class="{ on: learn }" :aria-pressed="learn" @click="toggleLearn">
              {{ t('types.learn') }}
            </button>
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
                      <!-- Learn mode: one line per matchup, with its memory hook. -->
                      <ul v-if="learn" class="hints">
                        <li v-for="x in row.types" :key="x">
                          <RouterLink :to="`/types/${x}`"><TypeIcon :type="x" /></RouterLink>
                          <span>{{ hint(s.side, x) }}</span>
                        </li>
                      </ul>
                      <span v-else class="icons">
                        <RouterLink v-for="x in row.types" :key="x" :to="`/types/${x}`">
                          <TypeIcon :type="x" />
                        </RouterLink>
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
              <InfoRows v-if="s.info.length" :rows="s.info" class="info" />
            </section>
          </div>
          <!-- Interactions with specific moves and abilities: useful, but secondary. -->
          <details v-if="more.length" class="more" :open="moreOpen" @toggle="onToggle">
            <summary class="muted">{{ t('info.more') }}</summary>
            <InfoRows :rows="more" />
          </details>
        </div>
      </motion.div>
    </AnimatePresence>
  </div>

  <p v-if="!type" class="muted hint">{{ t('types.selectHint') }}</p>
</template>

<style scoped>
.tools {
  margin-bottom: 12px;
}
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

.learn {
  margin-left: auto;
  font-family: var(--font-body, inherit);
  font-size: calc(12px * var(--text-scale));
  font-weight: normal;
}
.learn.on {
  background: var(--sel);
  border-color: var(--accent);
}

.hints {
  display: grid;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.hints li {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.hints a {
  flex: none;
  align-self: center;
  display: flex;
}

.sides {
  display: grid;
  gap: 20px;
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
  padding: 8px 4px 0;
  border-top: 1px solid var(--border);
}

.more {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--border);
  font-size: calc(12px * var(--text-scale));
}
.more summary {
  cursor: pointer;
  width: fit-content;
}
.more[open] summary {
  margin-bottom: 8px;
}

.hint {
  text-align: center;
}
</style>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ability, availableIds } from '@/data/dex'
import { REGULATION } from '@/data/format'
import { locale, t } from '@/i18n'
import { descriptions } from '@/i18n/en/abilities'
import { refName } from '@/i18n/refName'
import DexText from '@/components/DexText.vue'

// Every ability the regulation has, by name in the reader's language, with its short description. The descriptions
// are English for now (Spanish ones come later).
const abilities = computed(() =>
  availableIds('ability')
    .map((id) => ({ id, name: refName(ability(id)), text: descriptions[id]?.short ?? '' }))
    .sort((a, b) => a.name.localeCompare(b.name, locale.value)),
)

/** Folds a name for matching, ignoring case and accents: "levitacion" finds "Levitación". */
const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

/**
 * `name` split around the first match of the folded query `q`: [before, match, after], or null. The match is found in
 * the folded name, then mapped back character by character, so it's highlighted in the name as written.
 */
function split(name: string, q: string): [string, string, string] | null {
  const chars = [...name]
  let folded = ''
  const starts: number[] = [] // Where each character of the name starts in `folded`
  for (const c of chars) {
    starts.push(folded.length)
    folded += fold(c)
  }
  const at = folded.indexOf(q)
  if (at < 0) return null
  let from = 0
  while (from + 1 < starts.length && starts[from + 1]! <= at) from++
  const to = starts.findIndex((i) => i >= at + q.length)
  const end = to < 0 ? chars.length : to
  return [chars.slice(0, from).join(''), chars.slice(from, end).join(''), chars.slice(end).join('')]
}

const query = ref('')
const shown = computed(() => {
  const q = fold(query.value.trim())
  if (!q) return abilities.value.map((a) => ({ ...a, parts: null }))
  return abilities.value.flatMap((a) => {
    const parts = split(a.name, q)
    return parts ? [{ ...a, parts }] : []
  })
})
</script>

<template>
  <div class="panel">
    <h1>{{ t('title.abilities') }}</h1>
    <p class="muted">{{ t('abilities.intro', { reg: REGULATION }) }}</p>
    <input
      v-model="query"
      type="search"
      class="search"
      :placeholder="t('abilities.search')"
      :aria-label="t('abilities.search')"
    />
    <dl v-if="shown.length" class="entries">
      <template v-for="a in shown" :key="a.id">
        <dt>
          <RouterLink :to="{ name: 'ability', params: { id: a.id } }">
            <template v-if="a.parts"
              >{{ a.parts[0] }}<mark>{{ a.parts[1] }}</mark
              >{{ a.parts[2] }}</template
            >
            <template v-else>{{ a.name }}</template>
          </RouterLink>
        </dt>
        <dd class="muted"><DexText :text="a.text" /></dd>
      </template>
    </dl>
    <p v-else class="muted">{{ t('abilities.none') }}</p>
  </div>
</template>

<style scoped>
.search {
  width: 100%;
  max-width: 320px;
  margin-bottom: 12px;
  padding: 6px 8px;
  font: inherit;
  color: inherit;
  background: var(--panel-alt);
  border: 1px solid var(--border-strong);
  border-radius: 3px;
}
.entries {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 6px 16px;
  margin: 0;
}
.entries dt {
  font-weight: bold;
}
/* The part of a name matching the search. */
mark {
  color: inherit;
  background: var(--sel);
  border-radius: 2px;
}
.entries dd {
  margin: 0;
}
/* One column on phones: the name above its description. */
@media (max-width: 560px) {
  .entries {
    grid-template-columns: 1fr;
    gap: 2px;
  }
  .entries dd {
    margin-bottom: 8px;
  }
}
</style>

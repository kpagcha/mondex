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

/** Matches names ignoring case and accents: "levitacion" finds "Levitación". */
const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
const query = ref('')
const shown = computed(() => {
  const q = fold(query.value.trim())
  return q ? abilities.value.filter((a) => fold(a.name).includes(q)) : abilities.value
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
          <RouterLink :to="{ name: 'ability', params: { id: a.id } }">{{ a.name }}</RouterLink>
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

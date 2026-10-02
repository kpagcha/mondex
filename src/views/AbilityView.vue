<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ability, available, pokemon, type AbilityId, type PokemonId } from '@/data/dex'
import HOLDERS from '@/data/generated/abilities.holders.json'
import { REGULATION } from '@/data/format'
import { t, tSplit, type MessageKey } from '@/i18n'
import { descriptions } from '@/i18n/en/abilities'
import { refName } from '@/i18n/refName'
import { effectText, interactionsOf } from '@/lib/interactions'
import { formatMult, multClass } from '@/lib/typecalc'
import DexRef from '@/components/DexRef.vue'
import DexText from '@/components/DexText.vue'
import TypeIcon from '@/components/TypeIcon.vue'

// One ability: its description (English for now), the legal Pokémon that can have it, and what it does to types
// beyond the chart, read from the type data rather than written twice.
const route = useRoute()
const id = computed(() => String(route.params.id))
const ref = computed(() => ability(id.value as AbilityId))
const exists = computed(() => available(ref.value))

const text = computed(() => descriptions[id.value])
const holders = computed(() => ((HOLDERS as Record<string, PokemonId[]>)[id.value] ?? []).map(pokemon))
const interactions = computed(() => interactionsOf(ref.value))

/** An interaction's row from the ability's side ("{type} moves against it"), split around its type badge. */
const rowText = (row: string) => tSplit(`ability.row.${row}` as MessageKey, 'type')
</script>

<template>
  <div class="panel">
    <template v-if="exists">
      <h1>{{ refName(ref) }}</h1>
      <!-- The long description; the short one is for the list, and stands in when there's nothing more to say. -->
      <p v-if="text"><DexText :text="text.long ?? text.short" /></p>

      <section v-if="interactions.length">
        <h2>{{ t('ability.interactions') }}</h2>
        <ul class="interactions">
          <li v-for="(x, i) in interactions" :key="i">
            <span class="row">
              {{ rowText(x.row)[0] }}
              <RouterLink :to="{ name: 'types', params: { type: x.type } }"
                ><TypeIcon :type="x.type" :scale="2"
              /></RouterLink>
              {{ rowText(x.row)[1] }}
            </span>
            <span v-if="x.entry.mult !== undefined" class="mult-tag" :class="multClass(x.entry.mult)">
              {{ formatMult(x.entry.mult) }}
            </span>
            <span v-if="x.entry.cond" class="muted">(<DexRef :to="x.entry.cond" />)</span>
            <span v-if="effectText(x.entry)" class="muted num">{{ effectText(x.entry) }}</span>
          </li>
        </ul>
      </section>

      <section v-if="holders.length">
        <h2>{{ t('ability.pokemon') }}</h2>
        <ul class="holders">
          <li v-for="p in holders" :key="p.id"><DexRef :to="p" /></li>
        </ul>
      </section>
    </template>
    <p v-else>{{ t('ability.notFound', { id, reg: REGULATION }) }}</p>
  </div>
</template>

<style scoped>
section {
  margin-top: 16px;
}
.interactions {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.interactions li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.row {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.holders {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.holders li {
  padding: 1px 6px;
  background: var(--panel-alt);
  border: 1px solid var(--border);
  border-radius: 3px;
}
</style>

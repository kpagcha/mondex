<script setup lang="ts">
import { computed } from 'vue'
import type { Ref } from '@/data/dex'
import DexRef from '@/components/DexRef.vue'

// Curated text with references to dex entries embedded as markers (`{type:flying}`, `{move:taunt}`): the markers
// render as the entries' names, in the reader's language, linked once their category has pages. `npm run check-text`
// makes sure every marker names an entry the regulation has.
const props = defineProps<{ text: string }>()

const parts = computed(() =>
  props.text.split(/(\{\w+:\w+\})/).map((part) => {
    const marker = part.match(/^\{(\w+):(\w+)\}$/)
    return marker ? { ref: { kind: marker[1], id: marker[2] } as Ref } : { text: part }
  }),
)
</script>

<template>
  <template v-for="(part, i) in parts" :key="i">
    <DexRef v-if="part.ref" :to="part.ref" />
    <template v-else>{{ part.text }}</template>
  </template>
</template>

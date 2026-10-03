<script setup lang="ts">
import { computed } from 'vue'
import { PAGES, type Ref } from '@/data/dex'
import { refName } from '@/i18n/refName'

// A dex entry by name: a link to its page once its category has one (see `PAGES`), plain text until then. `tip`, if
// given, shows on hovering the link.
const props = defineProps<{ to: Ref; tip?: string }>()
const link = computed(() => {
  const page = PAGES[props.to.kind]
  return page && { name: page.route, params: { [page.param ?? 'id']: props.to.id } }
})
</script>

<template>
  <RouterLink v-if="link" v-tip="tip" :to="link">{{ refName(to) }}</RouterLink>
  <template v-else>{{ refName(to) }}</template>
</template>

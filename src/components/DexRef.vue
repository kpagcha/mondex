<script setup lang="ts">
import { computed } from 'vue'
import { PAGES, type Ref } from '@/data/dex'
import { refName } from '@/i18n'

// A dex entry by name: a link to its page once its category has one (see `PAGES`), plain text until then.
const props = defineProps<{ to: Ref }>()
const page = computed(() => PAGES[props.to.kind])
</script>

<template>
  <RouterLink v-if="page" :to="{ name: page, params: { id: to.id } }">{{ refName(to) }}</RouterLink>
  <template v-else>{{ refName(to) }}</template>
</template>

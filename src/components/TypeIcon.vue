<script setup lang="ts">
import { iconUrl, type TypeId } from '@/data/types'
import { typeName } from '@/i18n'

withDefaults(defineProps<{ type: TypeId; scale?: 1 | 2; lazy?: boolean; tip?: boolean; tipGroup?: string }>(), {
  scale: 1,
  lazy: false,
  tip: true,
})
</script>

<template>
  <img
    class="pixel type-icon"
    :src="iconUrl(type)"
    :alt="typeName(type)"
    v-tip:[tipGroup]="tip && typeName(type)"
    :width="32 * scale"
    :height="14 * scale"
    :loading="lazy ? 'lazy' : undefined"
    decoding="async"
    draggable="false"
  />
</template>

<style scoped>
.type-icon {
  display: inline-block;
  vertical-align: middle;
}
</style>

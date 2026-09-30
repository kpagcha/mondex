<script setup lang="ts">
import { TYPE_NAMES, iconUrl, type TypeId } from '@/data/types'

withDefaults(defineProps<{ type: TypeId; scale?: 1 | 2; lazy?: boolean }>(), {
  scale: 1,
  lazy: false,
})
</script>

<template>
  <img
    class="pixel type-icon"
    :src="iconUrl(type)"
    :alt="TYPE_NAMES[type]"
    :title="TYPE_NAMES[type]"
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

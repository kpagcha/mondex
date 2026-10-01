<script setup lang="ts">
import { iconUrl, type TypeId } from '@/data/types'
import { typeName } from '@/i18n'

withDefaults(defineProps<{ type: TypeId; scale?: 1 | 2; lazy?: boolean }>(), {
  scale: 1,
  lazy: false,
})
</script>

<template>
  <img
    class="pixel type-icon"
    :class="{ s1: scale === 1 }"
    :src="iconUrl(type)"
    :alt="typeName(type)"
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
.type-icon.s1 {
  width: calc(32px * var(--icon-scale, 1));
  height: calc(14px * var(--icon-scale, 1));
}
</style>

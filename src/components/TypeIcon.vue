<script setup lang="ts">
import { computed } from 'vue'
import { iconUrl, type TypeId } from '@/data/types'
import { typeName } from '@/i18n'
import { useStyle } from '@/composables/useStyle'
import { TYPE_GLYPHS } from '@/data/typeGlyphs'

const props = withDefaults(defineProps<{ type: TypeId; scale?: 1 | 2; lazy?: boolean }>(), {
  scale: 1,
  lazy: false,
})

// The retro style swaps the sprites for fixed-width CSS badges (styled in `src/styles/retro.css`): the type glyph,
// then the name on large badges; small ones are just the glyph.
const { style } = useStyle()
const badge = computed(() => style.value === 'retro')
const name = computed(() => typeName(props.type))
const glyph = computed(() => `url(${TYPE_GLYPHS[props.type]})`)
</script>

<template>
  <span
    v-if="badge"
    class="type-icon type-badge"
    :class="scale === 1 ? 's1' : 's2'"
    :data-type="type"
    role="img"
    :aria-label="name"
  >
    <span class="glyph" :style="{ '--glyph': glyph }" aria-hidden="true"></span>
    <span v-if="scale === 2" class="label" aria-hidden="true">{{ name }}</span>
  </span>
  <img
    v-else
    class="pixel type-icon"
    :class="{ s1: scale === 1 }"
    :src="iconUrl(type)"
    :alt="name"
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

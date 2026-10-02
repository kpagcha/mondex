<script setup lang="ts">
// Fences dev-only controls off from the app: a striped, dashed zone with a yellow "Dev only" label on its top edge.
// `compact` is a lighter version for small spots like a sidebar. Callers set its outer margins.
import { useId } from 'vue'

defineProps<{ compact?: boolean }>()
const id = useId()
</script>

<template>
  <section class="dev-zone" :class="{ compact }" :aria-labelledby="id">
    <span :id="id" class="tag font-display">Dev only</span>
    <slot />
  </section>
</template>

<style scoped>
.dev-zone {
  position: relative;
  padding: 26px 12px 1px;
  border: 2px dashed var(--border-strong);
  /* Faint diagonal stripes so the zone reads as "not part of the app" at a glance. */
  background: repeating-linear-gradient(
    -45deg,
    transparent 0 10px,
    color-mix(in srgb, var(--muted) 8%, transparent) 10px 20px
  );
}
/* Sits centered on the zone's top border, like a fieldset legend. */
.tag {
  position: absolute;
  top: 0;
  left: 50%;
  translate: -50% -50%;
  white-space: nowrap;
  padding: 3px 10px;
  /* Fixed hazard colors, the same in light and dark. */
  border: 2px solid #141414;
  background: #ffd23f;
  color: #141414;
  font-weight: bold;
  font-size: calc(12px * var(--text-scale));
  letter-spacing: 1px;
  text-transform: uppercase;
}

.compact {
  padding: 16px 10px 10px;
  border-width: 1px;
  background: repeating-linear-gradient(
    -45deg,
    transparent 0 10px,
    color-mix(in srgb, var(--muted) 4%, transparent) 10px 20px
  );
  font-size: calc(12px * var(--text-scale));
}
.compact .tag {
  padding: 1px 6px;
  border-width: 1px;
  font-size: calc(10px * var(--text-scale));
}
</style>

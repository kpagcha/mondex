<script setup lang="ts">
import { t, type MessageKey } from '@/i18n'

// Links to the type tools, as a row of cards. `compact` (the Types page) gives each a one-line description; otherwise
// (the home page, with narrower cards) a slightly longer one that may wrap.
defineProps<{ compact?: boolean }>()

const LINKS: { to: string; label: MessageKey; desc: MessageKey; long: MessageKey }[] = [
  { to: '/types/chart', label: 'nav.chart', desc: 'quick.chart', long: 'quick.chartLong' },
  { to: '/types/calc', label: 'nav.calc', desc: 'quick.calc', long: 'quick.calcLong' },
  { to: '/types/quiz', label: 'nav.quiz', desc: 'quick.quiz', long: 'quick.quizLong' },
]
</script>

<template>
  <div class="quick-links" :class="{ compact }">
    <RouterLink v-for="l in LINKS" :key="l.to" :to="l.to" class="quick">
      <span class="quick-title font-display">{{ t(l.label) }} <span class="arrow" aria-hidden="true">›</span></span>
      <span class="quick-desc muted">{{ t(compact ? l.desc : l.long) }}</span>
    </RouterLink>
  </div>
</template>

<style scoped>
.quick-links {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
@media (max-width: 560px) {
  .quick-links {
    grid-template-columns: minmax(0, 1fr);
  }
}
.quick {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  min-height: 44px;
  padding: 10px 12px;
  background: var(--panel-alt);
  border: 1px solid var(--border);
  border-radius: 3px;
  color: var(--text);
}
.quick:hover {
  text-decoration: none;
  border-color: var(--accent);
}
.quick-title {
  font-weight: bold;
  font-size: calc(14px * var(--text-scale));
}
.arrow {
  color: var(--accent);
}
.quick-desc {
  font-size: calc(12px * var(--text-scale));
  line-height: 1.4;
}
/* One line, cut short with an ellipsis if a card gets too narrow. */
.compact .quick-desc {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

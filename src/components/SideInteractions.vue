<script setup lang="ts">
import { ref } from 'vue'
import { t } from '@/i18n'
import type { SideInfo } from '@/lib/interactions'
import InfoRows from '@/components/InfoRows.vue'

defineProps<{ info: SideInfo }>()

// Whether the less common interactions are open is remembered across visits (and shared by every side).
const LESS_KEY = 'mondex.info.less'
function readOpen(): boolean {
  try {
    return localStorage.getItem(LESS_KEY) === '1'
  } catch {
    return false
  }
}
const open = ref(readOpen())
function onToggle(e: Event) {
  open.value = (e.target as HTMLDetailsElement).open
  try {
    localStorage.setItem(LESS_KEY, open.value ? '1' : '0')
  } catch {
    // Storage unavailable: the choice lasts for this page load.
  }
}
</script>

<template>
  <InfoRows v-if="info.major.length" :rows="info.major" />
  <details v-if="info.minor.length || info.more.length" class="less" :open="open" @toggle="onToggle">
    <summary class="muted">{{ t('info.less') }}</summary>
    <InfoRows v-if="info.minor.length" :rows="info.minor" />
    <!-- Specific moves and abilities: the least prominent. -->
    <div v-if="info.more.length" class="more">
      <p class="muted">{{ t('info.more') }}</p>
      <InfoRows :rows="info.more" />
    </div>
  </details>
</template>

<style scoped>
.less {
  font-size: calc(12px * var(--text-scale));
}
.info + .less {
  margin-top: 10px;
}
.less summary {
  cursor: pointer;
  width: fit-content;
}
.less[open] summary {
  margin-bottom: 8px;
}
.more {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed var(--border);
}
.more p {
  margin: 0 0 6px;
}
</style>

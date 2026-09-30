<script setup lang="ts">
import { t } from '@/i18n'
</script>

<template>
  <div class="panel">
    <h1>mondex</h1>
    <p class="muted">{{ t('home.intro') }}</p>
  </div>
  <div class="tools">
    <RouterLink to="/types" class="panel tool">
      <h2>{{ t('title.chart') }}</h2>
      <p class="muted">{{ t('home.chartDesc') }}</p>
    </RouterLink>
    <RouterLink to="/types/calc" class="panel tool">
      <h2>{{ t('title.calc') }}</h2>
      <p class="muted">{{ t('home.calcDesc') }}</p>
    </RouterLink>
    <RouterLink to="/types/quiz" class="panel tool">
      <h2>{{ t('title.quiz') }}</h2>
      <p class="muted">{{ t('home.quizDesc') }}</p>
    </RouterLink>
  </div>
</template>

<style scoped>
.tools {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}
.tool {
  display: block;
  color: var(--text);
  margin: 0;
}
.tool:hover {
  text-decoration: none;
  border-color: var(--accent);
}
.tool h2 {
  color: var(--link);
}
.tool p {
  margin: 0;
}
</style>

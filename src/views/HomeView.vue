<script setup lang="ts">
import { t } from '@/i18n'
import { GAME_NAME, REGULATION } from '@/data/format'
import TypeIcon from '@/components/TypeIcon.vue'
import QuickLinks from '@/components/QuickLinks.vue'
</script>

<template>
  <!-- One card per dex section; only Types exists so far. -->
  <div class="home">
    <div class="intro">
      <h1 class="title">mon<span>dex</span></h1>
      <p class="muted">{{ t('home.intro', { game: GAME_NAME, reg: REGULATION }) }}</p>
    </div>
    <section class="panel section">
      <RouterLink to="/types" class="section-head">
        <span class="icons" aria-hidden="true">
          <TypeIcon type="fire" />
          <TypeIcon type="water" />
          <TypeIcon type="grass" />
        </span>
        <span class="section-text">
          <span class="section-title font-display">{{ t('title.types') }} <span class="arrow">›</span></span>
          <span class="muted">{{ t('home.typesDesc') }}</span>
        </span>
      </RouterLink>
      <QuickLinks />
    </section>
  </div>
</template>

<style scoped>
.home {
  max-width: 720px;
  margin: 0 auto;
  padding-top: 32px;
}
.intro {
  text-align: center;
  margin-bottom: 24px;
}
.title {
  font-size: calc(48px * var(--display-scale, 1) * var(--text-scale));
  letter-spacing: -1px;
  line-height: 1.1;
}
.title span {
  color: var(--accent);
}
.intro p {
  max-width: 520px;
  margin: 0 auto;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
}
.section-head {
  display: flex;
  align-items: center;
  gap: 14px;
  color: var(--text);
}
.section-head:hover {
  text-decoration: none;
}
.icons {
  display: flex;
  gap: 4px;
  flex: none;
}
.section-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.section-title {
  font-weight: bold;
  font-size: calc(20px * var(--display-scale, 1) * var(--text-scale));
}
.section-head:hover .section-title {
  text-decoration: underline;
}
.arrow {
  color: var(--accent);
}

@media (max-width: 560px) {
  .home {
    padding-top: 8px;
  }
  .title {
    font-size: calc(40px * var(--display-scale, 1) * var(--text-scale));
  }
  /* Icons on their own row above the title; the description goes. */
  .section-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .section-text .muted {
    display: none;
  }
}
</style>

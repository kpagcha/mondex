<script setup lang="ts">
import { watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { AnimatePresence, MotionConfig, motion } from 'motion-v'
import { FADE, SPRING } from '@/lib/motion'
import { THEME_MODES, useTheme, type ThemeMode } from '@/composables/useTheme'
import { LOCALES, locale, setLocale, t, type Locale } from '@/i18n'

const { mode, setMode } = useTheme()
const isDev = import.meta.env.DEV
const route = useRoute()

watchEffect(() => {
  const key = route.meta.titleKey
  document.title = key ? `${t(key)} · mondex` : 'mondex'
})
</script>

<template>
  <!-- Motion respects the OS "reduce motion" setting everywhere below. -->
  <MotionConfig reduced-motion="user">
    <header class="site-header">
      <div class="wrap bar">
        <RouterLink to="/" class="logo font-display">mon<span>dex</span></RouterLink>
        <nav class="nav font-display">
          <!-- The active highlight is one element that slides between links. -->
          <RouterLink v-slot="{ isExactActive }" to="/types" exact-active-class="active">
            <motion.span v-if="isExactActive" layout-id="nav-pill" class="pill" :transition="SPRING" />
            <span class="label">{{ t('nav.chart') }}</span>
          </RouterLink>
          <RouterLink v-slot="{ isActive }" to="/types/calc" active-class="active">
            <motion.span v-if="isActive" layout-id="nav-pill" class="pill" :transition="SPRING" />
            <span class="label">{{ t('nav.calc') }}</span>
          </RouterLink>
          <RouterLink v-slot="{ isActive }" to="/types/quiz" active-class="active">
            <motion.span v-if="isActive" layout-id="nav-pill" class="pill" :transition="SPRING" />
            <span class="label">{{ t('nav.quiz') }}</span>
          </RouterLink>
        </nav>
      </div>
    </header>
    <main class="wrap">
      <RouterView v-slot="{ Component, route: r }">
        <!-- Keyed by path so query changes (calculator picks) don't replay it. -->
        <AnimatePresence mode="wait" :initial="false">
          <motion.div
            :key="r.path"
            :initial="{ opacity: 0, y: 6 }"
            :animate="{ opacity: 1, y: 0 }"
            :exit="{ opacity: 0, y: -4 }"
            :transition="FADE"
          >
            <component :is="Component" />
          </motion.div>
        </AnimatePresence>
      </RouterView>
    </main>
    <footer class="wrap footer muted">
      <!-- Language and theme are detected automatically, so they live down here. -->
      <div class="settings">
        <label class="setting">
          {{ t('lang.label') }}
          <select :value="locale" @change="setLocale(($event.target as HTMLSelectElement).value as Locale)">
            <option v-for="(label, code) in LOCALES" :key="code" :value="code" :lang="code">{{ label }}</option>
          </select>
        </label>
        <label class="setting">
          {{ t('theme.label') }}
          <select :value="mode" @change="setMode(($event.target as HTMLSelectElement).value as ThemeMode)">
            <option v-for="m in THEME_MODES" :key="m" :value="m">{{ t(`theme.${m}`) }}</option>
          </select>
        </label>
      </div>
      <div class="credits">
        <span>
          {{ t('footer.icons') }} <a href="https://pokemonshowdown.com/" rel="noopener">Pokémon Showdown</a>.
          {{ t('footer.copyright') }}
        </span>
        <RouterLink v-if="isDev" to="/dev" class="dev">Dev</RouterLink>
      </div>
    </footer>
  </MotionConfig>
</template>

<style scoped>
.wrap {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: 0 16px;
}

.site-header {
  background: var(--panel);
  border-bottom: 1px solid var(--border);
  margin-bottom: 16px;
}

.bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 16px;
  min-height: 44px;
  padding-top: 4px;
  padding-bottom: 4px;
}

.logo {
  font-size: calc(20px * var(--display-scale, 1));
  font-weight: bold;
  letter-spacing: -0.5px;
  color: var(--text);
}
.logo span {
  color: var(--accent);
}
.logo:hover {
  text-decoration: none;
}

.nav {
  display: flex;
  gap: 4px;
  /* Sits beside the logo when it fits, else drops to its own row (scrolling sideways as a last resort). */
  flex: 1 0 auto;
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
}
.nav a {
  flex: none;
  white-space: nowrap;
  position: relative;
  padding: 4px 8px;
  border-radius: 3px;
  color: var(--text);
}
.nav a:hover {
  background: var(--hover);
  text-decoration: none;
}
.nav .pill {
  position: absolute;
  inset: 0;
  background: var(--sel);
  border-radius: 3px;
}
.nav .label {
  position: relative;
}

@media (max-width: 720px) {
  .bar {
    column-gap: 12px;
  }
}

main {
  flex: 1 0 auto;
}

.footer {
  padding-top: 8px;
  padding-bottom: 24px;
  font-size: calc(11px * var(--text-scale));
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.settings {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
}
.setting {
  display: flex;
  align-items: center;
  gap: 8px;
}

.setting select {
  min-height: 26px;
  padding: 2px 4px;
  font: inherit;
  color: var(--text);
  background: var(--panel-alt);
  border: 1px solid var(--border-strong);
  border-radius: 3px;
  cursor: pointer;
}

.credits {
  display: flex;
  align-items: center;
  gap: 8px;
}
.credits .dev {
  padding: 0 4px;
  border: 1px dashed var(--border-strong);
  border-radius: 3px;
  color: var(--muted);
}
</style>

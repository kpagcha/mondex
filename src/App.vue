<script setup lang="ts">
import { watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import { LOCALES, locale, setLocale, t, type Locale } from '@/i18n'

const { theme, toggle } = useTheme()
const route = useRoute()

watchEffect(() => {
  const key = route.meta.titleKey
  document.title = key ? `${t(key)} · mondex` : 'mondex'
})

function onLang(e: Event) {
  setLocale((e.target as HTMLSelectElement).value as Locale)
}
</script>

<template>
  <header class="site-header">
    <div class="wrap bar">
      <RouterLink to="/" class="logo">mon<span>dex</span></RouterLink>
      <nav class="nav">
        <RouterLink to="/types" exact-active-class="active">{{ t('nav.chart') }}</RouterLink>
        <RouterLink to="/types/calc" active-class="active">{{ t('nav.calc') }}</RouterLink>
        <RouterLink to="/types/quiz" active-class="active">{{ t('nav.quiz') }}</RouterLink>
      </nav>
      <div class="controls">
        <select class="lang" :value="locale" :aria-label="t('lang.label')" :title="t('lang.label')" @change="onLang">
          <option v-for="(label, code) in LOCALES" :key="code" :value="code">{{ label }}</option>
        </select>
        <button
          class="btn theme"
          type="button"
          :title="t(theme === 'dark' ? 'theme.toLight' : 'theme.toDark')"
          @click="toggle"
        >
          {{ t(theme === 'dark' ? 'theme.dark' : 'theme.light') }}
        </button>
      </div>
    </div>
  </header>
  <main class="wrap">
    <RouterView />
  </main>
  <footer class="wrap footer muted">
    {{ t('footer.icons') }} <a href="https://pokemonshowdown.com/" rel="noopener">Pokémon Showdown</a>.
    {{ t('footer.copyright') }}
  </footer>
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
  gap: 16px;
  min-height: 44px;
  flex-wrap: wrap;
}

.logo {
  font-size: 20px;
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
  flex: 1;
  flex-wrap: wrap;
}
.nav a {
  padding: 4px 8px;
  border-radius: 3px;
  color: var(--text);
}
.nav a:hover {
  background: var(--hover);
  text-decoration: none;
}
.nav a.active {
  background: var(--sel);
  font-weight: bold;
}

.controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.lang {
  min-height: 26px;
  padding: 2px 4px;
  font: inherit;
  color: inherit;
  background: var(--panel-alt);
  border: 1px solid var(--border-strong);
  border-radius: 3px;
  cursor: pointer;
}

.theme {
  min-width: 64px;
}

main {
  flex: 1 0 auto;
}

.footer {
  padding-top: 8px;
  padding-bottom: 24px;
  font-size: 11px;
}
</style>

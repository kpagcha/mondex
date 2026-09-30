<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'

const { mode, cycle } = useTheme()
const themeLabel = computed(
  () => ({ light: 'Light', dark: 'Dark', system: 'Auto' })[mode.value],
)
</script>

<template>
  <header class="site-header">
    <div class="wrap bar">
      <RouterLink to="/" class="logo">mon<span>dex</span></RouterLink>
      <nav class="nav">
        <RouterLink to="/types" exact-active-class="active">Type chart</RouterLink>
        <RouterLink to="/types/calc" active-class="active">Calculator</RouterLink>
        <RouterLink to="/types/quiz" active-class="active">Quiz</RouterLink>
      </nav>
      <button class="btn theme" type="button" :title="`Theme: ${themeLabel}`" @click="cycle">
        {{ themeLabel }}
      </button>
    </div>
  </header>
  <main class="wrap">
    <RouterView />
  </main>
  <footer class="wrap footer muted">
    Type icons from <a href="https://pokemonshowdown.com/" rel="noopener">Pokémon Showdown</a>.
    Pokémon © Nintendo, Game Freak, The Pokémon Company.
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

.theme {
  min-width: 56px;
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

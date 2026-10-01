<script setup lang="ts">
import { ref, watch, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { AnimatePresence, MotionConfig, motion } from 'motion-v'
import { FADE, PAGE, SPRING } from '@/lib/motion'
import { t } from '@/i18n'
import { GAME_NAME, REGULATION } from '@/data/format'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const route = useRoute()

watchEffect(() => {
  const key = route.meta.titleKey
  document.title = key ? `${t(key)} · ${GAME_NAME} · mondex` : `mondex · ${GAME_NAME} dex`
})

// Same query as the phone-only styles below.
const phoneQuery = window.matchMedia('(max-width: 720px) and (hover: none) and (pointer: coarse)')
const isPhone = ref(phoneQuery.matches)
phoneQuery.addEventListener('change', (e) => (isPhone.value = e.matches))

// On phones, pages push each other sideways: going deeper, the new page comes in from the right as
// the old one leaves to the left; going back, the reverse. Both travel a full screen width in lockstep.
const depth = (path: string) => path.split('/').filter(Boolean).length
const direction = ref(1)
watch(
  () => route.path,
  (to, from) => (direction.value = depth(to) >= depth(from) ? 1 : -1),
)
const pageVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? '100vw' : '-100vw' }),
  center: { x: 0 },
  exit: (dir: number) => ({ x: dir > 0 ? '-100vw' : '100vw' }),
}
// On desktop, the old page fades out, then the new one fades in from slightly below.
const fadeVariants = {
  enter: { opacity: 0, y: 6 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
}
</script>

<template>
  <!-- Motion respects the OS "reduce motion" setting everywhere below. -->
  <MotionConfig reduced-motion="user">
    <header class="site-header">
      <div class="wrap bar">
        <RouterLink to="/" class="logo font-display">mon<span>dex</span></RouterLink>
        <span class="format muted">{{ t('format.label', { game: GAME_NAME, reg: REGULATION }) }}</span>
        <nav class="nav font-display">
          <!-- The active highlight is one element that slides between links. -->
          <RouterLink v-slot="{ isActive }" to="/types" active-class="active">
            <motion.span v-if="isActive" layout-id="nav-pill" class="pill" :transition="SPRING" />
            <span class="label">{{ t('nav.types') }}</span>
          </RouterLink>
          <RouterLink v-slot="{ isActive }" to="/types/chart" active-class="active">
            <motion.span v-if="isActive" layout-id="nav-pill" class="pill" :transition="SPRING" />
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
          <RouterLink v-slot="{ isActive }" to="/settings" active-class="active" class="end">
            <motion.span v-if="isActive" layout-id="nav-pill" class="pill" :transition="SPRING" />
            <span class="label">{{ t('nav.settings') }}</span>
          </RouterLink>
        </nav>
      </div>
    </header>
    <main class="wrap">
      <RouterView v-slot="{ Component, route: r }">
        <!-- Keyed by route rather than URL so query and param changes (calculator picks, the selected type) don't replay it.
             On phones, popLayout lifts the leaving page out of the flow so both pages slide side by side. -->
        <AnimatePresence :mode="isPhone ? 'popLayout' : 'wait'" :initial="false" :custom="direction">
          <motion.div
            :key="r.matched[0]?.path ?? r.path"
            :custom="direction"
            :variants="isPhone ? pageVariants : fadeVariants"
            initial="enter"
            animate="center"
            exit="exit"
            :transition="isPhone ? PAGE : FADE"
          >
            <!-- Mobile replaces the header links with a way back to the home page. -->
            <RouterLink v-if="r.name !== 'home'" to="/" class="back font-display">
              <span class="chevron" aria-hidden="true">‹</span> {{ t('nav.back') }}
            </RouterLink>
            <component :is="Component" />
          </motion.div>
        </AnimatePresence>
      </RouterView>
    </main>
    <footer class="wrap footer muted">
      <div class="credits">
        <span>
          {{ t('footer.icons') }} <a href="https://pokemonshowdown.com/" rel="noopener">Pokémon Showdown</a>.
          {{ t('footer.copyright') }}
        </span>
        <!-- Phones hide the header links, so settings are also reachable from here. -->
        <RouterLink to="/settings" class="settings-link">{{ t('nav.settings') }}</RouterLink>
      </div>
    </footer>
    <ConfirmDialog />
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
  box-shadow: var(--shadow);
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
.format {
  font-size: calc(11px * var(--text-scale));
  white-space: nowrap;
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
.nav .end {
  margin-left: auto;
}
.nav .label {
  position: relative;
}

.back {
  display: none;
  align-items: center;
  gap: 5px;
  width: fit-content;
  margin-bottom: 12px;
  padding: 3px 10px 3px 7px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--panel);
  box-shadow: var(--shadow);
  color: var(--muted);
}
.back .chevron {
  font-weight: bold;
  font-size: 1.25em;
  line-height: 1;
}
.back:hover {
  background: var(--panel-alt);
  color: var(--text);
  text-decoration: none;
}

/* Phones only: a narrow desktop window keeps the header links. */
@media (max-width: 720px) and (hover: none) and (pointer: coarse) {
  .nav {
    display: none;
  }
  .back {
    display: flex;
  }
}

main {
  flex: 1 0 auto;
  /* Anchors the leaving page, and cuts it off where the new page ends instead of over the footer. */
  position: relative;
  overflow-y: clip;
}

.footer {
  padding-top: 8px;
  padding-bottom: 24px;
  font-size: calc(11px * var(--text-scale));
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.credits {
  display: flex;
  align-items: center;
  gap: 8px;
}
.credits .settings-link {
  margin-left: auto;
  white-space: nowrap;
}
</style>

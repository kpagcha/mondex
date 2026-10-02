<script setup lang="ts">
import { t, tSplit } from '@/i18n'

const icons = tSplit('credits.iconsBody', 'source')
</script>

<template>
  <div class="panel">
    <h1>{{ t('title.credits') }}</h1>
    <p class="muted">{{ t('credits.intro') }}</p>
  </div>

  <div class="panel">
    <h2>{{ t('credits.iconsTitle') }}</h2>
    <p>
      {{ icons[0] }}<a href="https://archives.bulbagarden.net/" rel="noopener">Bulbagarden Archives</a>{{ icons[1] }}
      <a href="https://bulbapedia.bulbagarden.net/wiki/Type" rel="noopener">Bulbapedia</a>.
    </p>
  </div>

  <div class="panel">
    <h2>Pokémon</h2>
    <p>{{ t('footer.copyright') }}</p>
    <p>{{ t('credits.trademarks') }}</p>
  </div>
</template>

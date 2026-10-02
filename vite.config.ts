import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => ({
  // Production is served from GitHub Pages at https://kpagcha.github.io/mondex/; `vite preview` serves that build
  // locally, so it needs the same base or its asset URLs fall through to index.html.
  base: command === 'build' || isPreview ? '/mondex/' : '/',
  // Listen on the network too, so the dev server can be opened from a phone on the same Wi-Fi.
  server: { host: true },
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}))

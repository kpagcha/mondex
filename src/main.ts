import './styles/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'

// Dev-only font lab: re-applies saved font picks on every page.
if (import.meta.env.DEV) void import('./dev/fonts')

createApp(App).use(router).mount('#app')

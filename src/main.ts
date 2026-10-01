import './styles/main.css'
import './styles/retro.css'

import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { vTip } from './directives/tip'

// Dev-only font lab: re-apply saved picks on every page.
if (import.meta.env.DEV) void import('./dev/fonts')

createApp(App).use(router).directive('tip', vTip).mount('#app')

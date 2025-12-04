import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { useAuthStore } from './stores/auth.js'

import './styles/variables.css'
import './styles/themes.css'
import './styles/global.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// Initialize auth store before mounting
const authStore = useAuthStore()
authStore.init().then(() => {
  app.mount('#app')
})

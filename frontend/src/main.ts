import { createApp } from 'vue'
import App from './App.vue'
import router from '@/router/index'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
// import '@/main.css'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(router)
app.use(pinia)
app.mount('#app')

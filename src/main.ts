import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import { router } from './app/router'
import './assets/styles/base.css'
import { installAlchemyProvider } from './features/alchemy'

const app = createApp(App)

app.use(createPinia())
app.use(router)
installAlchemyProvider(app)
app.mount('#app')

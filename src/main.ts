import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import { router } from './app/router'
import './assets/styles/base.css'
import { installAlchemyProvider } from './features/alchemy'

if (
  import.meta.env.DEV &&
  new URLSearchParams(window.location.search).get('text-scale') === 'large'
) {
  document.documentElement.dataset['textScaleFixture'] = 'large'
}

const app = createApp(App)

app.use(createPinia())
app.use(router)
installAlchemyProvider(app)
app.mount('#app')

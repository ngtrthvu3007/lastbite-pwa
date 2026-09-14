import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { DefaultApolloClient } from '@vue/apollo-composable'
import PrimeVue from 'primevue/config'
import { apolloClient } from './lib/apollo'
import { lastbitePreset } from './primevue/lastbite-preset'
import router from './router'
import './main.css'
import App from './App.vue'

const app = createApp(App)

app.provide(DefaultApolloClient, apolloClient)
app.use(createPinia())
app.use(PrimeVue, {
  theme: {
    preset: lastbitePreset,
    options: {
      darkModeSelector: false,
    },
  },
})
app.use(router)

app.mount('#app')

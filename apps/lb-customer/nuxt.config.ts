// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'
import { lastbitePreset } from './app/primevue/lastbite-preset'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      graphqlEndpoint:
        process.env.NUXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:3000/graphql',
    },
  },
  devServer: {
    host: '0.0.0.0',
    port: 5173,
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      watch: {
        usePolling: true,
        interval: 100,
      },
    },
  },
  css: ['~/main.css'],
  modules: ['@primevue/nuxt-module'],
  primevue: {
    options: {
      theme: {
        preset: lastbitePreset,
        options: {
          darkModeSelector: false,
        },
      },
    },
  },
})

// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
import { presets } from "./app/presets";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || "http://localhost:3000",
      graphqlEndpoint: process.env.NUXT_PUBLIC_GRAPHQL_ENDPOINT || "http://localhost:3000/graphql",
    },
  },
  routeRules: {
    // The session cookie lives on the API host, so the Nuxt server cannot tell who is signed in.
    "/merchant/**": { ssr: false },
  },
  app: {
    head: {
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@500;700;800&display=swap",
        },
      ],
    },
  },
  devServer: {
    host: "0.0.0.0",
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
  css: ["~/main.css"],
  modules: ["@primevue/nuxt-module"],
  primevue: {
    options: {
      theme: {
        preset: presets,
        options: {
          darkModeSelector: false,
        },
      },
    },
  },
});

import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";

export default defineNuxtPlugin({
  name: "query",
  setup(nuxtApp) {
    const queryClient = new QueryClient();

    nuxtApp.vueApp.use(VueQueryPlugin, { queryClient });

    return { provide: { queryClient } };
  },
});

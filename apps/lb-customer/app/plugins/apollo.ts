import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client/core'
import { DefaultApolloClient } from '@vue/apollo-composable'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()

  const apolloClient = new ApolloClient({
    link: createHttpLink({
      uri: String(config.public.graphqlEndpoint),
      credentials: 'include',
    }),
    cache: new InMemoryCache(),
    ssrMode: import.meta.server,
  })

  nuxtApp.vueApp.provide(DefaultApolloClient, apolloClient)

  return {
    provide: {
      apollo: apolloClient,
    },
  }
})

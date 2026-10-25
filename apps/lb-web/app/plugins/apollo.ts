import { ApolloClient, ApolloLink, createHttpLink, InMemoryCache } from "@apollo/client/core";
import { onError } from "@apollo/client/link/error";
import { DefaultApolloClient } from "@vue/apollo-composable";
import { GRAPHQL_UNAUTHENTICATED } from "~/constants/auth";
import { API_CREDENTIALS } from "~/constants/http";

export default defineNuxtPlugin((nuxtApp) => {
  const { graphqlEndpoint } = useRuntimeConfig().public;
  const { handleUnauthorized } = useAuth();

  const errorLink = onError(({ graphQLErrors }) => {
    if (graphQLErrors?.some((error) => error.extensions?.code === GRAPHQL_UNAUTHENTICATED)) {
      handleUnauthorized();
    }
  });

  const httpLink = createHttpLink({ uri: graphqlEndpoint, credentials: API_CREDENTIALS });

  const apolloClient = new ApolloClient({
    link: ApolloLink.from([errorLink, httpLink]),
    cache: new InMemoryCache(),
    ssrMode: import.meta.server,
  });

  nuxtApp.vueApp.provide(DefaultApolloClient, apolloClient);

  return { provide: { apollo: apolloClient } };
});

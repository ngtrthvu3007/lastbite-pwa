import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client/core'

const graphqlEndpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT || 'http://localhost:3000/graphql'

export const apolloClient = new ApolloClient({
  link: createHttpLink({
    uri: graphqlEndpoint,
    credentials: 'include',
  }),
  cache: new InMemoryCache(),
})

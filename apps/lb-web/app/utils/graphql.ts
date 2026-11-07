import { graphqlErrorSchema } from '~/schemas/graphql'

export const getGraphqlErrorDetails = (error: unknown) => {
  const extensions = graphqlErrorSchema.safeParse(error).data?.graphQLErrors.map((e) => e.extensions) ?? []

  return {
    code: extensions.map(({ code }) => code).find(Boolean),
    fields: extensions.flatMap(({ fields }) => fields),
  }
}

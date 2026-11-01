import { z } from 'zod'

// What Apollo throws when the API refuses a request: each GraphQL error carries an error code and,
// for validation errors, extensions.fields: [{ field, code }]. A missing or malformed part falls back to empty.
const extensionsSchema = z.object({
  code: z.string().optional().catch(undefined),
  fields: z.array(z.object({ field: z.string(), code: z.string() })).catch([]),
})

export const graphqlErrorSchema = z.object({
  graphQLErrors: z.array(z.object({ extensions: extensionsSchema.catch({ fields: [] }) })),
})

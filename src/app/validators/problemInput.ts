import { z } from 'zod'

export const problemInput = z
  .object({
    type: z.enum(['riddle', 'math'], {
      required_error: 'Type is reuired',
    }),
    problem: z.string({
      required_error: 'Problem is required',
    }),
  })
  .required()

export const problemInputOnlyType = z.object({
  type: z
    .enum(['riddle', 'math'], {
      required_error: 'Type is reuired',
    })
    .optional(),
})

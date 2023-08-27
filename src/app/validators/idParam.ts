import { z } from 'zod'

export const idRequired = z
  .object({
    id: z
      .string({
        required_error: 'Problem ID is required',
      })
      .regex(/^\d+$/)
      .transform(Number),
  })
  .required()

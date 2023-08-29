import { z } from 'zod'

export const answerBody = z
  .object({
    answer: z.string({
      required_error: 'Answer is required',
    }),
  })
  .required()

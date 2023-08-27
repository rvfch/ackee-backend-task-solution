import { NextFunction, Request, Response } from 'express'
import { ZodError, ZodType, infer as zInfer } from 'zod'
import { ValidationError } from '../errors'

type ValidatedRequest<
  B extends ZodType<any> = ZodType<object>,
  Q extends ZodType<any> = ZodType<object>,
  P extends ZodType<any> = ZodType<object>,
> = Request & {
  body: zInfer<B>
  query: zInfer<Q>
  params: zInfer<P>
}

const validate = <
  BodySchema extends ZodType<any> = ZodType<object>,
  QuerySchema extends ZodType<any> = ZodType<object>,
  ParamsSchema extends ZodType<any> = ZodType<object>,
>(schema: {
  body?: BodySchema
  query?: QuerySchema
  params?: ParamsSchema
}) => {
  return (
    req: ValidatedRequest<BodySchema, QuerySchema, ParamsSchema>,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      if (schema.body) req.body = schema.body.parse(req.body)
      if (schema.query) req.query = schema.query.parse(req.query)
      if (schema.params) req.params = schema.params.parse(req.params)

      next()
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new ValidationError(
            { message: 'Validation error', code: 'VALIDATION_ERROR' },
            { issues: error.issues }
          )
        )
      } else {
        next(error)
      }
    }
  }
}

export default validate

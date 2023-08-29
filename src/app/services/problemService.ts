import { ctrl } from '../controllers'
import * as openapi from '../../openapi'
import {
  Problem,
  ProblemType,
  ProblemWithoutAnswer,
  ProblemsRepository,
} from '../repos/problem'
import config from '../../config'
import Piscina = require('piscina')
import path = require('path')
import {
  BadRequest,
  E_CODE,
  InternalServerError,
  NotAuthorized,
  NotFound,
  ValidationError,
} from '../errors'
import { executeTxAsync } from '../repos'
import _ = require('lodash')
import { HttpStatus } from '../constants/http-status-code'
import { Credentials } from '../controllers/appMessage'

const isTest = config.node.env === 'test'
const EVAL_WORKER_PATH = path.resolve(
  __dirname,
  `../utils/evaluatorWorker.${isTest ? 'ts' : 'js'}`
)
const problemsRepo = new ProblemsRepository('problems')

/**
 * Lists all the problems
 */
export const list = async (): Promise<
  openapi.OpenAPIResponse<openapi.api.paths['/problems']>
> => {
  const message = ctrl.getOasPathAppMessage<openapi.api.paths['/problems']>()

  // Retrieve problems while omitting their answers
  const problems: ProblemWithoutAnswer[] = await problemsRepo.findMany(
    message.requestBody,
    ['answer']
  )

  // Check if problems are available
  if (!problems) {
    throw new InternalServerError({
      message: 'Cant load problems',
      code: E_CODE.INTERNAL_SERVER_ERROR.code,
    })
  }

  return Promise.resolve({
    statusCode: HttpStatus.OK,
    problems,
    payload: message.requestBody,
  })
}

/**
 * Creates a new problem
 */
export const create = async (): Promise<
  openapi.OpenAPIResponse<openapi.api.paths['/problems']>
> => {
  const message = ctrl.getOasPathAppMessage<openapi.api.paths['/problems']>()

  const dto = {
    ...message.requestBody,
    author: message.user?.username,
    answer: message.requestBody.answer ?? undefined,
  }

  // Process the problem based on its type
  await processByProblemType(dto)

  // Persist the problem
  const problem = await executeTxAsync(trx => problemsRepo.create(dto, trx))

  // Check if problem is created successfully
  if (!problem) {
    throw new InternalServerError({
      message: 'Cant create problem',
      code: E_CODE.INTERNAL_SERVER_ERROR.code,
    })
  }

  return Promise.resolve({
    statusCode: HttpStatus.CREATED,
    problem,
    payload: message.requestBody,
  })
}

/**
 * Retrieves a single problem by ID
 */
export const getOne = async (): Promise<
  openapi.OpenAPIResponse<openapi.api.paths['/problems/{id}']>
> => {
  const message =
    ctrl.getOasPathAppMessage<openapi.api.paths['/problems/{id}']>()

  // Retrieve the problem without its answer
  const problem = await problemsRepo.findOne(message.param.id, ['answer'])

  if (!problem) {
    throw new NotFound({
      message: `Problem ${message.param.id} not found`,
      code: E_CODE.NOT_FOUND.code,
    })
  }

  return Promise.resolve({
    statusCode: HttpStatus.OK,
    problem,
    payload: message.requestBody,
  })
}

/**
 * Updates an existing problem
 */
export const update = async (): Promise<
  openapi.OpenAPIResponse<openapi.api.paths['/problems/{id}']>
> => {
  const message =
    ctrl.getOasPathAppMessage<openapi.api.paths['/problems/{id}']>()

  // Check if it is authenticated user's problem
  await authorizeProblem(message)

  const dto = {
    ...message.requestBody,
    answer: message.requestBody.answer ?? undefined,
  }

  // Process the problem based on its type
  await processByProblemType(dto)

  // Persist the updated problem
  const updatedProblem = await executeTxAsync(trx =>
    problemsRepo.update(message.param.id, dto, trx)
  )

  return Promise.resolve({
    statusCode: HttpStatus.OK,
    problem: updatedProblem,
    payload: message.requestBody,
  })
}

/**
 * Deletes a problem by ID
 */
export const destroy = async (): Promise<
  openapi.OpenAPIResponse<openapi.api.paths['/problems/{id}']>
> => {
  const message =
    ctrl.getOasPathAppMessage<openapi.api.paths['/problems/{id}']>()

  // Check if it is authenticated user's problem
  await authorizeProblem(message)

  const result = await executeTxAsync(trx =>
    problemsRepo.delete(message.param.id, trx)
  )

  if (!result) {
    throw new NotFound({
      message: `Problem ${message.param.id} not found`,
      code: E_CODE.NOT_FOUND.code,
    })
  }

  return Promise.resolve({
    statusCode: HttpStatus.OK,
    payload: message.requestBody,
  })
}

/**
 * Validates an answer for a problem
 */
export const solve = async (): Promise<
  openapi.OpenAPIResponse<openapi.api.paths['/problems/{id}/answer']>
> => {
  const message =
    ctrl.getOasPathAppMessage<openapi.api.paths['/problems/{id}/answer']>()

  const problem: Problem = await problemsRepo.findOne(message.param.id)

  if (problem) {
    return Promise.resolve({
      statusCode: HttpStatus.OK,
      correct: problem.answer === message.requestBody.answer,
      payload: message.requestBody,
    })
  }

  throw new NotFound({
    message: `Problem ${message.param.id} not found`,
    code: E_CODE.PROBLEM_NOT_FOUND.code,
  })
}

/**
 * Asynchronously evaluates a math expression
 */
const handleEvaluateAsync = async (expression: string): Promise<string> => {
  const piscina = new Piscina({
    filename: path.resolve(__dirname, EVAL_WORKER_PATH),
    execArgv: isTest ? ['-r', 'ts-node/register'] : undefined,
  })

  let result
  try {
    result = await piscina.run(expression)
  } catch (error) {
    throw new ValidationError({
      message: `Invalid expression: ${expression}`,
      code: E_CODE.INVALID_EXPRESSION.code,
    })
  }

  return _.toString(result)
}

/**
 * Method to check if the problem is created by the authenticated user
 */
const authorizeProblem = async <TOpenAPIRoute>(
  message: TOpenAPIRoute & { param: { id: number }; user?: Credentials }
): Promise<void> => {
  const problem = await problemsRepo.findOne(message.param.id)

  if (problem) {
    if (message.user?.username !== problem.author) {
      throw new NotAuthorized(E_CODE.NOT_AUTHORIZED)
    }
  } else {
    throw new NotFound({
      message: `Problem ${message.param.id} not found`,
      code: E_CODE.PROBLEM_NOT_FOUND.code,
    })
  }
}

const processByProblemType = async (
  dto: Partial<Problem>
): Promise<Problem> => {
  switch (dto.type) {
    case ProblemType.MATH:
      if (dto.problem) {
        dto.answer = await handleEvaluateAsync(dto.problem)
      } else {
        throw new BadRequest({
          message: 'Problem is empty',
          code: E_CODE.BAD_REQUEST.code,
        })
      }
      break
    case ProblemType.RIDDLE:
      dto.answer = dto.answer ?? config.riddle.answer
  }
  return dto as Problem
}

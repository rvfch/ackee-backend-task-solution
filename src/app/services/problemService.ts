import { ctrl } from '../controllers'
import * as openapi from '../../openapi'
import { Problem, ProblemType, ProblemsRepository } from '../repos/problem'
import config from '../../config'
import Piscina = require('piscina')
import path = require('path')
import { E_CODE, NotFound, ValidationError } from '../errors'
import { executeTxAsync } from '../repos'
import _ = require('lodash')
import { ProblemDTO } from '../dto/problemDto'

const EVAL_WORKER_PATH = '../utils/evaluator-worker.js'

const problemsRepo = new ProblemsRepository('problems')

export const list = async (): Promise<
  openapi.OpenAPIResponse<openapi.api.paths['/problems']>
> => {
  const message = ctrl.getOasPathAppMessage<openapi.api.paths['/problems']>()
  const problems = await problemsRepo.findMany(message.requestBody)
  return { problems, payload: message.requestBody }
}

export const create = async (): Promise<
  openapi.OpenAPIResponse<openapi.api.paths['/problems']>
> => {
  const message = ctrl.getOasPathAppMessage<openapi.api.paths['/problems']>()
  const dto = {
    ...message.requestBody,
    author: message.user?.username,
    answer: config.riddle.answer,
  }
  switch (dto.type) {
    case ProblemType.MATH:
      dto.answer = await handleEvaluateAsync(dto.problem)
      break
    case ProblemType.RIDDLE:
      dto.answer = config.riddle.answer
  }

  const problem = new ProblemDTO(
    await executeTxAsync(trx => problemsRepo.create(dto, trx))
  ).toJSON()
  return { problem, payload: message.requestBody }
}

export const getOne = async (): Promise<
  openapi.OpenAPIResponse<openapi.api.paths['/problems/{id}']>
> => {
  const message =
    ctrl.getOasPathAppMessage<openapi.api.paths['/problems/{id}']>()
  const problem = await problemsRepo.findOne(message.param.id)
  return { problem, payload: message.requestBody }
}

export const update = async (): Promise<
  openapi.OpenAPIResponse<openapi.api.paths['/problems/{id}']>
> => {
  const message =
    ctrl.getOasPathAppMessage<openapi.api.paths['/problems/{id}']>()
  const updatedProblem = await executeTxAsync(trx =>
    problemsRepo.update(message.param.id, message.requestBody, trx)
  )
  return { problem: updatedProblem, payload: message.requestBody }
}

export const destroy = async (): Promise<
  openapi.OpenAPIResponse<openapi.api.paths['/problems/{id}']>
> => {
  const message =
    ctrl.getOasPathAppMessage<openapi.api.paths['/problems/{id}']>()
  await executeTxAsync(trx => problemsRepo.delete(message.param.id, trx))
  return { payload: message.requestBody }
}

export const solve = async (): Promise<
  openapi.OpenAPIResponse<openapi.api.paths['/problems/{id}/answer']>
> => {
  const message =
    ctrl.getOasPathAppMessage<openapi.api.paths['/problems/{id}/answer']>()
  const problem: Problem = await problemsRepo.findOne(message.param.id)
  if (problem) {
    return {
      correct: problem.answer === message.requestBody.answer,
      payload: message.requestBody,
    }
  }
  throw new NotFound({
    message: `Problem ${message.param.id} not found`,
    code: E_CODE.PROBLEM_NOT_FOUND.code,
  })
}

const handleEvaluateAsync = async (expression: string): Promise<string> => {
  // Evaluate the math expression asynchronously
  const piscina = new Piscina({
    filename: path.resolve(__dirname, EVAL_WORKER_PATH),
  })
  let result
  try {
    result = await piscina.run(expression)
  } catch (error) {
    throw new ValidationError({
      message: 'Invalid expression',
      code: E_CODE.INVALID_EXPRESSION.code,
    })
  }
  return _.toString(result)
}

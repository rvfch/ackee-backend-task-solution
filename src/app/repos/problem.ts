import { BaseRepository } from '.'
import * as openapi from '../../openapi'

export enum ProblemType {
  MATH = 'math',
  RIDDLE = 'riddle',
}

export interface Timestamps {
  created_at: string
  updated_at: string
}

export type Problem = openapi.api.components['schemas']['FullProblem'] &
  Timestamps

export type ProblemWithoutAnswer =
  openapi.api.components['schemas']['Problem'] & Timestamps

/**
 * Repository class for the problems entity
 */
export class ProblemsRepository extends BaseRepository<Problem> {
  protected readonly COLUMNS = [
    'id',
    'problem',
    'type',
    'answer',
    'author',
    'created_at',
    'updated_at',
  ]
}

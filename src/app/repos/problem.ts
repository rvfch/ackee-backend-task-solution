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

export type Problem = openapi.api.components['schemas']['Problem']

export type ProblemWithTimestamps = Problem & Timestamps

export class ProblemsRepository extends BaseRepository<ProblemWithTimestamps> {}

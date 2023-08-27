import { E_CODE, InternalServerError } from '../errors'
import { Problem, ProblemType, ProblemWithTimestamps } from '../repos/problem'

const isProblemDefined = (
  problem: Partial<ProblemWithTimestamps>
): problem is ProblemWithTimestamps => {
  const requiredProperties = Object.keys(problem) as Array<keyof typeof problem>

  return !requiredProperties.some(
    prop => problem[prop] === undefined || problem[prop] === null
  )
}

export class ProblemDTO {
  id!: number
  problem!: string
  type!: ProblemType
  author!: string
  answer!: string
  created_at?: string
  updated_at?: string

  constructor(problem: ProblemWithTimestamps) {
    if (!isProblemDefined(problem)) {
      throw new InternalServerError({
        message: 'Missing required fields for Problem DTO',
        code: E_CODE.INTERNAL_SERVER_ERROR.code,
      })
    }

    Object.assign(this, problem)
  }

  public toJSON(): Omit<Problem, 'answer'> {
    const { answer, ...rest } = this
    return rest
  }
}

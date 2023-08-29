import config from '../../config'
import { t } from '../testing'

const apiPrefix = `/api/${config.api.version}`
const auth = { Authorization: 'Basic VGVzdDpUZXN0' } // Test:Test
const adminAuth = { Authorization: 'Basic YWRtaW46dGVzdA==' } // admin:test

describe('Problems Service Test', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  test('Authentication', () => {
    return t.request().get(`${apiPrefix}/problems`).expect(401)
  })
  describe('GET /problems', () => {
    it('should return a list of problems', () => {
      const input = {}
      return t
        .request()
        .get(`${apiPrefix}/problems`)
        .set(auth)
        .expect(200)
        .then(({ body }: any) => {
          const { payload } = body
          expect(payload).toEqual(input)
          expect(body.problems[0]).toMatchSnapshot({
            created_at: expect.any(String),
            updated_at: expect.any(String),
          })
        })
    })

    it('should return a list of unanswered problems', () => {
      const input = {
        answered: false,
      }
      return t
        .request()
        .get(`${apiPrefix}/problems`)
        .set(auth)
        .send(input)
        .expect(200)
        .then(({ body }: any) => {
          const { payload } = body
          expect(payload).toEqual(input)
          expect(body.problems[1]).toMatchSnapshot({
            created_at: expect.any(String),
            updated_at: expect.any(String),
          })
        })
    })

    it('should return a list of answered problems', async () => {
      const id = 1
      const answerInput = { answer: 'Test answer' }
      const listInput = {
        answered: true,
      }

      // answer the problem with id  1
      await t
        .request()
        .post(`${apiPrefix}/problems/${id}/answer`)
        .set(auth)
        .send(answerInput)
        .expect(200)
        .then(({ body }: any) => {
          expect(body.correct).toBeTruthy()
        })

      return t
        .request()
        .get(`${apiPrefix}/problems`)
        .set(auth)
        .send(listInput)
        .expect(200)
        .then(({ body }: any) => {
          const { payload } = body
          expect(payload).toEqual(listInput)
          expect(body.problems[0]).toMatchSnapshot({
            created_at: expect.any(String),
            updated_at: expect.any(String),
          })
        })
    })
  })

  describe('GET /problems/:id', () => {
    it('should return a one problem with id 1', () => {
      const input = {}
      const id = 1
      return t
        .request()
        .get(`${apiPrefix}/problems/${id}`)
        .set(auth)
        .expect(200)
        .then(({ body }: any) => {
          const { payload, ...rest } = body
          expect(payload).toEqual(input)
          expect(rest).toMatchSnapshot({
            problem: {
              created_at: expect.any(String),
              updated_at: expect.any(String),
            },
          })
        })
    })

    it('should return 404 problem not found', () => {
      const id = 99999999
      return t
        .request()
        .get(`${apiPrefix}/problems/${id}`)
        .set(auth)
        .expect(404)
        .then(({ body }: any) => {
          expect(body.message).toMatchSnapshot()
        })
    })

    it('should return validation error', () => {
      const id = 'tset'
      return t
        .request()
        .get(`${apiPrefix}/problems/${id}`)
        .set(auth)
        .expect(422)
        .then(({ body }: any) => {
          expect(body.message).toMatchSnapshot()
        })
    })
  })

  describe('POST /problems', () => {
    it('should successfully create a math problem and evaluate it', () => {
      const input = {
        type: 'math',
        problem: '2+2',
      }
      const answer = '4'
      return t
        .request()
        .post(`${apiPrefix}/problems`)
        .send(input)
        .set(auth)
        .expect(201)
        .then(({ body }: any) => {
          expect(body.problem.problem).toEqual(input.problem)
          expect(body.problem.type).toEqual(input.type)
          expect(body.problem.answer).toEqual(answer)
        })
    })

    it('should successfully create a riddle problem with answer from config', () => {
      const input = {
        type: 'riddle',
        problem: 'test problem',
      }
      return t
        .request()
        .post(`${apiPrefix}/problems`)
        .send(input)
        .set(auth)
        .expect(201)
        .then(({ body }: any) => {
          expect(body.problem.problem).toEqual(input.problem)
          expect(body.problem.type).toEqual(input.type)
          expect(body.problem.answer).toEqual(config.riddle.answer)
        })
    })

    it('should successfully create a riddle problem with answer from input', () => {
      const input = {
        type: 'riddle',
        problem: 'test problem',
        answer: 'Test test test',
      }
      return t
        .request()
        .post(`${apiPrefix}/problems`)
        .send(input)
        .set(auth)
        .expect(201)
        .then(({ body }: any) => {
          expect(body.problem.problem).toEqual(input.problem)
          expect(body.problem.type).toEqual(input.type)
          expect(body.problem.answer).toEqual(input.answer)
        })
    })

    it('invalid expression', () => {
      const input = {
        type: 'math',
        problem: 'test',
      }
      return t
        .request()
        .post(`${apiPrefix}/problems`)
        .send(input)
        .set(auth)
        .expect(422)
    })
  })

  describe('PUT /problems/:id', () => {
    it('should successfully update a problem', () => {
      const updatedInput = {
        type: 'math',
        problem: '2*2',
        answer: '4',
      }
      const id = 1 // Assuming the ID of an existing problem.
      return t
        .request()
        .put(`${apiPrefix}/problems/${id}`)
        .send(updatedInput)
        .set(adminAuth)
        .expect(200)
        .then(({ body }: any) => {
          expect(body.problem.problem).toEqual(updatedInput.problem)
          expect(body.problem.answer).toEqual(updatedInput.answer)
        })
    })

    it('invalid expression', () => {
      const updatedInput = {
        type: 'math',
        problem: 'test',
        answer: '4',
      }
      const id = 1 // Assuming the ID of an existing problem.
      return t
        .request()
        .put(`${apiPrefix}/problems/${id}`)
        .send(updatedInput)
        .set(adminAuth)
        .expect(422)
    })

    it('should throw 401 Unathorized', () => {
      const updatedInput = {
        type: 'math',
        problem: '2*2',
        answer: '4',
      }
      const id = 1 // Assuming the ID of an existing problem.
      return t
        .request()
        .put(`${apiPrefix}/problems/${id}`)
        .send(updatedInput)
        .set(auth)
        .expect(401)
        .then(({ body }: any) => {
          expect(body.message).toMatchSnapshot()
        })
    })
  })

  describe('POST /problems/:id/answer', () => {
    it('should successfully validate an answer', () => {
      const id = 1 // Assuming the ID of an existing problem.
      const answer = {
        answer: '4', // Assuming the correct answer for this problem.
      }
      return t
        .request()
        .post(`${apiPrefix}/problems/${id}/answer`)
        .send(answer)
        .set(auth)
        .expect(200)
        .then(({ body }: any) => {
          expect(body.correct).toBeTruthy()
        })
    })

    it('cant find problem', () => {
      const id = 99999 // Assuming the ID of an existing problem.
      const answer = {
        answer: '4', // Assuming the correct answer for this problem.
      }
      return t
        .request()
        .post(`${apiPrefix}/problems/${id}/answer`)
        .send(answer)
        .set(auth)
        .expect(404)
    })
  })

  describe('DELETE /problems/:id', () => {
    it('should successfully delete a problem', () => {
      const id = 1 // Assuming the ID of an existing problem.
      return t
        .request()
        .delete(`${apiPrefix}/problems/${id}`)
        .set(adminAuth)
        .expect(200)
    })

    it('unauthorized', () => {
      const id = 2 // Assuming the ID of an existing problem.
      return t
        .request()
        .delete(`${apiPrefix}/problems/${id}`)
        .set(auth)
        .expect(401)
    })

    it('cant find problem', () => {
      const id = 99999 // Assuming the ID of an existing problem.
      return t
        .request()
        .delete(`${apiPrefix}/problems/${id}`)
        .set(adminAuth)
        .expect(404)
    })
  })
})

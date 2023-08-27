import { createServer } from 'unicore'
import { ctrl } from './app/controllers'
import pino from 'pino-http'
import * as problem from './app/services/problemService'
import {
  problemInput,
  problemInputOnlyType,
} from './app/validators/problemInput'
import validate from './app/validators'
import { idRequired } from './app/validators/idParam'
import { answerBody } from './app/validators/answerInput'

const server = createServer()
server.use(pino())
server.use(ctrl.json)
server.use(ctrl.cors)
server.all('/', ctrl.httpRootHandler)
server.use(ctrl.healthz)

server.get(
  '/problems',
  validate({ body: problemInputOnlyType }),
  ctrl.service(problem.list)
)
server.post(
  '/problems',
  validate({ body: problemInput }),
  ctrl.service(problem.create)
)
server.get(
  '/problems/:id',
  validate({ body: problemInputOnlyType, params: idRequired }),
  ctrl.service(problem.getOne)
)
server.put(
  '/problems/:id',
  validate({ body: problemInput, params: idRequired }),
  ctrl.service(problem.update)
)
server.delete(
  '/problems/:id',
  validate({ params: idRequired }),
  ctrl.service(problem.destroy)
)
server.post(
  '/problems/:id/answer',
  validate({ body: answerBody, params: idRequired }),
  ctrl.service(problem.solve)
)

server.use(ctrl.httpErrorHandler)
server.use(ctrl.httpFinalHandler)

export default server

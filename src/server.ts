import { createRouter, createServer } from 'unicore'
import { ctrl } from './app/controllers'
import pino from 'pino-http'
import * as problemService from './app/services/problemService'
import {
  problemInput,
  problemInputFilter,
  problemInputOnlyType,
} from './app/validators/problemInput'
import validate from './app/validators'
import { idRequired } from './app/validators/idParam'
import { answerBody } from './app/validators/answerInput'
import config from './config'
import { serve, setup } from 'swagger-ui-express'
import * as fs from 'fs'
import * as YAML from 'yaml'

const docsFile = fs.readFileSync(config.api.docsPath, 'utf8')

// Create and set up the server
export const server = createServer()

server.use(pino())
server.use(ctrl.json)
server.use(ctrl.cors)
server.all('/', ctrl.httpRootHandler)
server.use(ctrl.healthz)

// Route definitions
const problemsRouter = createRouter()

problemsRouter.get(
  '/',
  validate({ body: problemInputFilter }),
  ctrl.service(problemService.list)
)
problemsRouter.post(
  '/',
  validate({ body: problemInput }),
  ctrl.service(problemService.create)
)
problemsRouter.get(
  '/:id',
  validate({ body: problemInputOnlyType, params: idRequired }),
  ctrl.service(problemService.getOne)
)
problemsRouter.put(
  '/:id',
  validate({ body: problemInput, params: idRequired }),
  ctrl.service(problemService.update)
)
problemsRouter.delete(
  '/:id',
  validate({ params: idRequired }),
  ctrl.service(problemService.destroy)
)
problemsRouter.post(
  '/:id/answer',
  validate({ body: answerBody, params: idRequired }),
  ctrl.service(problemService.solve)
)

// Use the problems router on the main server instance
// Swagger
if (config.api.swagger) {
  server.use(`/api/${config.api.version}`, serve)
  server.get(`/api/${config.api.version}`, setup(YAML.parse(docsFile)))
}
server.use(`/api/${config.api.version}/problems`, problemsRouter)

// Error handling
server.use(ctrl.httpErrorHandler)
server.use(ctrl.httpFinalHandler)

export default server

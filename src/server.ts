import { createServer } from 'unicore'
import { ctrl } from './app/controllers'
import pino from 'pino-http';
import * as hello from './app/services/helloService'

const server = createServer()
server.use(pino())
server.use(ctrl.json)
server.use(ctrl.cors)
server.all('/', ctrl.httpRootHandler)
server.use(ctrl.healthz)

server.all('/hello', ctrl.service(hello.hello))

server.use(ctrl.httpErrorHandler)
server.use(ctrl.httpFinalHandler)

export default server

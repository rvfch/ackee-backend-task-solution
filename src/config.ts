import { createLoader, safeValues, values } from 'configuru'
import path = require('path')
import { Level } from 'pino'

const loader = createLoader({
  defaultConfigPath: '.env.jsonc',
})

const configSchema = {
  logger: {
    level: loader.custom(x => x as Level)('LOGGER_DEFAULT_LEVEL'),
  },
  auth: {
    directBearerAuth: loader.bool('AUTH_DIRECT_BEARER_ENABLED'),
    directBasicAuth: loader.bool('AUTH_DIRECT_BASIC_ENABLED'),
  },
  enableTests: loader.bool('ENABLE_TESTS'),
  node: {
    env: loader.string('NODE_ENV'),
  },
  server: {
    port: loader.number('SERVER_PORT'),
    allowResponseErrors: loader.bool('SERVER_ALLOW_RESPONSE_ERRORS'),
    corsHeaders: loader.string('SERVER_CORS_ALLOW_HEADERS'),
    corsOrigins: loader.string('SERVER_CORS_ALLOW_ORIGINS'),
  },
  riddle: {
    answer: 'Riddle answer',
  },
  api: {
    version: 'v1',
    swagger: true,
    docsPath: path.resolve(__dirname, '../docs/api/openapi.yaml'),
  },
}

export default values(configSchema)
export const safeConfig = safeValues(configSchema)

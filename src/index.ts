import logger from './app/logger'
import config, { safeConfig } from './config'
import server from './server'
import * as shutdown from './app/shutdown'
import { knexInit } from './db/knexfile'

logger.info(safeConfig, 'Loaded config')
export const db = knexInit()
server
  .listenAsync(config.server.port)
  .then(() => logger.info(`Server started, port=${config.server.port}`))
  .catch((error: Error) => {
    logger.error('Server failed to start', error)
    process.exit(1)
  })

shutdown.prepareForGracefulShutdown()

export default server

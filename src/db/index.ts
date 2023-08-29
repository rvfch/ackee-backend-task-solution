import knex from 'knex'
import * as knexConfig from './knexfile'
import config from '../config'

const env = config.node.env || 'development'
const dbConfig = knexConfig[env as keyof typeof knexConfig]
const db = knex(dbConfig)

export default db

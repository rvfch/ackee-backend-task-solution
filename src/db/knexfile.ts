import path = require('path')
// Update with your config settings.

export const development = {
  client: 'sqlite3',
  connection: {
    filename: path.join(__dirname, '..', '..', 'db.sqlite'),
  },
  useNullAsDefault: true,
  migrations: {
    directory: './migrations',
    extension: 'ts',
  },
  seeds: {
    directory: './seeds',
    extension: 'ts',
  },
  debug: true,
}

export const production = {
  client: 'postgresql',
  connection: {
    database: 'my_db',
    user: 'username',
    password: 'password',
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    tableName: 'knex_migrations',
  },
}

export const test = {
  client: 'sqlite3',
  connection: {
    filename: './src/test/test.sqlite',
  },
  useNullAsDefault: true,
  pool: {
    min: 1,
    max: 1,
  },
  migrations: {
    directory: './src/db/migrations',
    extension: 'ts',
  },
  seeds: {
    directory: './src/db/seeds',
    extension: 'ts',
  },
}

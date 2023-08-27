import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('problems', table => {
    table.increments('id')
    table.string('problem', 255).notNullable()
    table.string('answer', 255).nullable()
    table.string('author', 255).notNullable()
    table.enum('type', ['math', 'riddle']).notNullable()
    table.timestamps(true, true)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('problems')
}

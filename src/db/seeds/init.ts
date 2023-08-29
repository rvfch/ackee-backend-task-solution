import { Knex } from 'knex'

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('problems').del()

  // Inserts seed entries
  await knex('problems').insert([
    {
      id: 1,
      problem: 'Test problem',
      answer: 'Test answer',
      author: 'admin',
      type: 'riddle',
    },
    {
      id: 2,
      problem: '5+5',
      answer: '10',
      author: 'admin',
      type: 'math',
    },
    {
      id: 3,
      problem: '12*3+4*(5-2)/20+500',
      answer: '536.6',
      author: 'admin',
      type: 'math',
    },
  ])
}

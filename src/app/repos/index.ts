import { Knex } from 'knex'
import { db } from '../..'
import { InternalServerError } from '../errors'

export interface Readable<T> {
  findMany: (model: Partial<T>) => Promise<T[]>
  findOne: (id: number | Partial<T>) => Promise<T>
}

export interface Writable<T> {
  create: (entity: Entity<T>, trx: Knex.Transaction) => Promise<T>
  update: (id: number, item: Partial<T>, trx: Knex.Transaction) => Promise<T>
  delete: (id: number, trx: Knex.Transaction) => Promise<boolean>
}

type Model<T> = Readable<T> & Writable<T>

type BaseFields = 'id' | 'created_at' | 'updated_at'

type Entity<T> = Omit<T, BaseFields>

export abstract class BaseRepository<T> implements Model<T> {
  constructor(private readonly tableName: string) {}

  public get qb(): Knex.QueryBuilder {
    return db(this.tableName)
  }

  protected get returningColumns(): string[] {
    return ['*']
  }

  findMany(entity: Partial<T>): Promise<T[]> {
    return this.qb.select(this.returningColumns).where(entity)
  }

  findOne(id: number | Partial<T>): Promise<T> {
    return this.qb.select(this.returningColumns).where('id', id).first()
  }

  async create(entity: Entity<T>, trx: Knex.Transaction): Promise<T> {
    const [output] = await this.qb
      .transacting(trx)
      .insert<T>(entity)
      .returning(this.returningColumns)
    return output as Promise<T>
  }

  async update(
    id: number,
    entity: Partial<Entity<T>>,
    trx: Knex.Transaction
  ): Promise<T> {
    const [output] = await this.qb
      .transacting(trx)
      .where(id)
      .update(entity)
      .returning(this.returningColumns)
    return output as Promise<T>
  }

  async delete(id: number, trx: Knex.Transaction): Promise<boolean> {
    return this.qb.transacting(trx).where('id', id).del()
  }
}

// Method to execute a transaction
export const executeTxAsync = async <T>(
  operation: (trx: Knex.Transaction) => Promise<T>
): Promise<T> => {
  return db.transaction(async trx => {
    try {
      return await operation(trx)
    } catch (error) {
      throw new InternalServerError(error)
    }
  })
}

import { Knex } from 'knex'
import db from '../../db'
import { InternalServerError } from '../errors'
import { isString } from 'lodash'

// CRUD operations
interface Readable<T> {
  findMany: <U extends keyof T = keyof T>(
    model: Partial<T>,
    fieldsToExclude?: U[]
  ) => Promise<Array<Omit<T, U>>>
  findOne: <U extends keyof T = keyof T>(
    id: number | Partial<T>,
    fieldsToExclude?: U[]
  ) => Promise<Omit<T, U>>
}

interface Writable<T> {
  create: (entity: Entity<T>, trx: Knex.Transaction) => Promise<T>
  update: (id: number, item: Partial<T>, trx: Knex.Transaction) => Promise<T>
  delete: (id: number, trx: Knex.Transaction) => Promise<boolean>
}

type Model<T> = Readable<T> & Writable<T>

type BaseFields = 'id' | 'created_at' | 'updated_at'

type Entity<T> = Omit<T, BaseFields>

/**
 * Base repository class that implements the Model interface
 * @param tableName Name of the table in the database
 * @param COLUMNS Array of columns that are present in the table
 * @param returningColumns Array of columns that should be returned when a query is executed
 */
export abstract class BaseRepository<T> implements Model<T> {
  protected readonly COLUMNS: string[] = ['*']

  constructor(private readonly tableName: string) {}

  private get qb(): Knex.QueryBuilder {
    return db(this.tableName)
  }

  protected get returningColumns(): string[] {
    return this.COLUMNS
  }

  public findMany<U extends keyof T = keyof T>(
    entity: Partial<T>,
    fieldsToExclude?: U[]
  ): Promise<T[]> {
    const columnsToSelect = fieldsToExclude
      ? this.returningColumns.filter(col => !fieldsToExclude.includes(col as U))
      : this.returningColumns

    return this.qb.select(columnsToSelect).where(this.clean(entity))
  }

  public findOne<U extends keyof T = keyof T>(
    id: number | Partial<T>,
    fieldsToExclude?: U[]
  ): Promise<T> {
    const columnsToSelect = fieldsToExclude
      ? this.returningColumns.filter(
          column => !fieldsToExclude.includes(column as U)
        )
      : this.returningColumns

    if (!isString(id)) {
      return this.qb.select(columnsToSelect).where('id', id).first()
    } else {
      return this.qb.select(columnsToSelect).where(id).first()
    }
  }

  public async create(entity: Entity<T>, trx: Knex.Transaction): Promise<T> {
    const [output] = await this.qb
      .transacting(trx)
      .insert<T>(entity)
      .returning(this.returningColumns)

    return output as Promise<T>
  }

  public async update(
    id: number,
    entity: Partial<Entity<T>>,
    trx: Knex.Transaction
  ): Promise<T> {
    const [output] = await this.qb
      .transacting(trx)
      .where('id', id)
      .update<T>(entity)
      .returning(this.returningColumns)

    return output as Promise<T>
  }

  async delete(id: number, trx: Knex.Transaction): Promise<boolean> {
    return this.qb.transacting(trx).where('id', id).del()
  }

  /**
   * Function to clean the entity object and return only the columns that are present in the COLUMNS array
   */
  private clean<T>(entity: Partial<T>): Partial<T> {
    const entityKeys = Object.keys(entity)
    const result: Partial<T> = {}
    entityKeys.forEach(key => {
      if (this.COLUMNS.includes(key)) {
        result[key as keyof T] = entity[key as keyof T]
      }
    })
    return result
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

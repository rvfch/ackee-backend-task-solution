import db from '../db'

export default async () => {
  // TBA: Add teardown tasks, close db conn etc.
  await db.destroy()
}

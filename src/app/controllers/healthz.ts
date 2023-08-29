import { expressMiddleware } from 'node-healthz'
import db from '../../db'

export default expressMiddleware({
  database: {
    crucial: true,
    check: () =>
      db.raw('select 1 as result').then(() => {
        return true
      }),
  },
})

<div align="center">

# Ackee Backend Task Solution


Assignment can be found here [here](https://github.com/AckeeCZ/cookbook-api-task)

</div>

## 🚀 Quick-start

- `npm i -g knex`
- `npm install`
- `npm run migrate` (after successful migration optionally `npm run seed`)
- `npm run build:docs`
- `npm run build`
- `npm test` to ensure, that all tests are passing
- `npm run start` or `npm run start-lr` for live reload
- Swagger API documentation can be found here: [`http://localhost:3000/api/v1`](http://localhost:3000/)
- Health check route: [`/healthz`](http://localhost:3000/healthz)
- Use postman (or any other client app) to use API
- Use Basic Auth to authenticate
## ✨ Used technologies
- Node.js with Express (Unicore) onboard
- SQLite3 for storing data
- Knex (for SQL queries)
- Piscina (for multi-threading)
- Zod (for validations)
- OpenAPI & Swagger (for API documentation)
- Jest for testing

## ⚖️ License
Created using [Ackee node-template](https://github.com/AckeeCZ/node-template/tree/master/src)

This project is published under [MIT license](./LICENSE).

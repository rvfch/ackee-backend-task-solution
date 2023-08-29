import { Request, Response } from 'express'
import * as lodash from 'lodash'
import { E_CODE, NotAuthenticated } from '../errors'

export interface AppMessage {
  user: Credentials
  locale: string
  param: {
    [key: string]: string
  }
  requestBody: any
}

export interface Credentials {
  username: string
  password: string
}

const getBasicAuth = (authorizationHeader?: string) => {
  const [basic, credentials] = (authorizationHeader ?? '').split(' ')
  if (!basic || basic.toLowerCase() !== 'basic') {
    return
  }
  const [username, password] = Buffer.from(credentials, 'base64')
    .toString()
    .split(':')
  return { username, password }
}

const authenticate = async (credentials?: Credentials) => {
  // Credentials are provided
  if (credentials?.username && credentials?.password) {
    // Handle user validations...
    return Promise.resolve(credentials)
  }
  throw new NotAuthenticated(E_CODE.NOT_AUTHENTICATED)
}

// const getBearerToken = (authorizationHeader?: string) => {
//   const [bearer, accessToken] = (authorizationHeader ?? '').split(' ')
//   if (!bearer || bearer.toLowerCase() !== 'bearer') {
//     return
//   }
//   return accessToken
// }

// const authenticateAccessToken = (accessToken?: string) => {
//   // Direct bearer auth support
//   if ((accessToken ?? '').startsWith('U_')) {
//     // TODO Replace with your implementation, return user with this ID
//     // const [, userId] = accessToken!.split('_')
//   }
//   // TODO Replace with your implementation, return the token user
//   // Return user or undefined/null
//   return undefined
// }

export const createFromHttpRequest = async (httpContext: {
  req: Request
  res: Response
}): Promise<AppMessage> => {
  const { req } = httpContext
  // Auth for all requests
  const user = req.headers.authorization
    ? await authenticate(getBasicAuth(req.headers.authorization))
    : undefined

  if (!user) throw new NotAuthenticated(E_CODE.NOT_AUTHENTICATED)

  return {
    user,
    locale: 'en', // Install i18n to getLocale() from HTTP Request,
    param: lodash.defaults({}, req.headers, req.params, req.query),
    requestBody: req.body,
  }
}

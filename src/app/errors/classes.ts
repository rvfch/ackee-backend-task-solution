/* tslint:disable:max-classes-per-file */

import { HttpStatus } from '../constants/http-status-code'
import logger from '../logger'

/**
 * Standard json error with possibility to add response code
 * @property {string} name Name of it
 * @extends Error
 */
export class HttpJsonError extends Error {
  /**
   * @param message Error message
   * @param status Status code for http response
   * @param errorCode Custom error code for i.e. mobile app error handling (like email is already taken)
   */
  constructor(
    public readonly status: number,
    public readonly message: string,
    public readonly errorCode: string = '',
    public readonly errorData?: object
  ) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)
    this.name = this.constructor.name
    logger.error(message)
  }

  public toJSON() {
    return {
      message: this.message,
      status: this.status,
      errorCode: this.errorCode,
      errorData: this.errorData,
      errorClass: this.constructor.name,
      stack: this.stack,
    }
  }
}

interface ErrorData {
  message?: string
  code?: string
}

export class BadRequest extends HttpJsonError {
  constructor(data: ErrorData = {}, errorData?: any) {
    super(
      HttpStatus.BAD_REQUEST,
      data.message ?? 'Client error',
      data.code ?? '?',
      errorData
    )
  }
}

export class InternalServerError extends HttpJsonError {
  constructor(data: ErrorData = {}, errorData?: any) {
    super(
      500,
      data.message ?? 'Internal server error',
      data.code ?? '?',
      errorData
    )
  }
}

export class NotAuthorized extends HttpJsonError {
  constructor(data: ErrorData = {}, errorData?: any) {
    super(
      HttpStatus.UNAUTHORIZED,
      data.message ?? 'Insufficient aceess',
      data.code ?? '?',
      errorData
    )
  }
}

export class ValidationError extends HttpJsonError {
  constructor(data: ErrorData = {}, errorData?: any) {
    super(
      HttpStatus.UNPROCESSABLE_ENTITY,
      data.message ?? 'Invalid data',
      data.code ?? '?',
      errorData
    )
  }
}

export class TokenizationError extends HttpJsonError {
  constructor(data: ErrorData = {}, errorData?: any) {
    super(
      HttpStatus.INTERNAL_SERVER_ERROR,
      data.message ?? 'Tokenization error',
      data.code ?? '?',
      errorData
    )
  }
}

export class ParseError extends HttpJsonError {
  constructor(data: ErrorData = {}, errorData?: any) {
    super(
      HttpStatus.INTERNAL_SERVER_ERROR,
      data.message ?? 'Parse error',
      data.code ?? '?',
      errorData
    )
  }
}

export class EvaluateError extends HttpJsonError {
  constructor(data: ErrorData = {}, errorData?: any) {
    super(
      HttpStatus.INTERNAL_SERVER_ERROR,
      data.message ?? 'Evaluate error',
      data.code ?? '?',
      errorData
    )
  }
}

export class NotAuthenticated extends HttpJsonError {
  constructor(data: ErrorData = {}, errorData?: any) {
    super(
      HttpStatus.UNAUTHORIZED,
      data.message ?? 'Requires authentication',
      data.code ?? '?',
      errorData
    )
  }
}

export class NotFound extends HttpJsonError {
  constructor(data: ErrorData = {}, errorData?: any) {
    super(
      HttpStatus.NOT_FOUND,
      data.message ?? 'Resource not found',
      data.code ?? '?',
      errorData
    )
  }
}

export class ServerError extends HttpJsonError {
  constructor(data: ErrorData = {}, errorData?: any) {
    super(
      HttpStatus.INTERNAL_SERVER_ERROR,
      data.message ?? 'Server error',
      data.code ?? '?',
      errorData
    )
  }
}

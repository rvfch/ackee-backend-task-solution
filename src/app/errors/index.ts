export * from './classes'

// Assure code is same as key in the object
const checkErrors = <
  T extends { [X in keyof T]: { code: X; message: string } },
>(
  errors: T
) => errors

export const E_CODE = checkErrors({
  BAD_REQUEST: { code: 'BAD_REQUEST', message: 'Client error' },
  INTERNAL_SERVER_ERROR: {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Internal server error',
  },
  NOT_AUTHORIZED: { code: 'NOT_AUTHORIZED', message: 'Insufficient access' },
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', message: 'Invalid data' },
  TOKENIZATION_ERROR: {
    code: 'TOKENIZATION_ERROR',
    message: 'Tokenization error',
  },
  PARSE_ERROR: { code: 'PARSE_ERROR', message: 'Parse error' },
  EVALUATE_ERROR: { code: 'EVALUATE_ERROR', message: 'Evaluate error' },
  NOT_AUTHENTICATED: {
    code: 'NOT_AUTHENTICATED',
    message: 'Requires authentication',
  },
  NOT_FOUND: { code: 'NOT_FOUND', message: 'Resource not found' },
  SERVER_ERROR: { code: 'SERVER_ERROR', message: 'Server error' },
  PROBLEM_NOT_FOUND: {
    code: 'PROBLEM_NOT_FOUND',
    message: ' Problem not found',
  },
  INVALID_EXPRESSION: {
    code: 'INVALID_EXPRESSION',
    message: 'Invalid expression',
  },
  UNKNOWN: { code: 'UNKNOWN', message: 'Unknown error' },
} as const)

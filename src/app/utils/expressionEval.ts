import { E_CODE, EvaluateError, ParseError, TokenizationError } from '../errors'

import { performance } from 'node:perf_hooks'
import logger from '../logger'
import config from '../../config'

// Enums representing different token types, operators, and parentheses types.
export enum TokenType {
  NUM = 'NUMBER',
  OP = 'OPERATOR',
  PAREN = 'PARENTHESIS',
}

export enum Operators {
  ADD = '+',
  SUBTRACT = '-',
  MULTIPLY = '*',
  DIVIDE = '/',
}

export enum Parens {
  OPEN = '(',
  CLOSE = ')',
}

// Interfaces to represent the structure of tokens and AST nodes.
// More info about Abstract Syntax Tree is here:
// https://en.wikipedia.org/wiki/Abstract_syntax_tree

export interface Token {
  type: TokenType
  value: string
}

export type Node = BinaryExpressionNode | PrefixExpressionNode | LiteralNode

export type PrefixParseFunction = () => Node
export type InfixParseFunction = (leftExpression: Node) => Node

export interface BinaryExpressionNode {
  type: 'BinaryExpression'
  left: Node
  op: Operators
  right: Node
}

export interface PrefixExpressionNode {
  type: 'PrefixExpression'
  op: Operators
  right: Node
}

export interface LiteralNode {
  type: 'Literal'
  value: number
}

/**
 * Tokenizer class responsible for breaking down the expression into meaningful tokens.
 */
export class Tokenizer {
  private readonly expression: string
  private pos = 0
  private readonly operators = Object.values(Operators)
  private readonly parens = Object.values(Parens)

  constructor(expression: string) {
    this.expression = expression.trim()
  }

  // Current char
  private peek(): string {
    return this.expression[this.pos]
  }

  // Next char
  private consume(): string {
    return this.expression[this.pos++]
  }

  private matchNumber(): string | null {
    const start = this.pos
    while (this.peek() && this.isDigit(this.peek())) {
      this.consume()
    }
    return start !== this.pos ? this.expression.slice(start, this.pos) : null
  }

  private isDigit(char: string): boolean {
    return /\d/.test(char)
  }

  private isOperator(char: string): boolean {
    return this.operators.includes(char as Operators)
  }

  private isParenthesis(char: string): boolean {
    return this.parens.includes(char as Parens)
  }

  public tokenize(): Token[] {
    const tokens: Token[] = []
    while (this.pos < this.expression.length) {
      const num = this.matchNumber()
      if (num) {
        tokens.push({ type: TokenType.NUM, value: num })
        continue
      }

      const char = this.peek()
      if (this.isOperator(char)) {
        tokens.push({ type: TokenType.OP, value: this.consume() })
        continue
      }

      if (this.isParenthesis(char)) {
        tokens.push({ type: TokenType.PAREN, value: this.consume() })
        continue
      }

      throw new TokenizationError({
        message: 'Tokenization error: ' + char,
        code: E_CODE.TOKENIZATION_ERROR.code,
      })
    }
    return tokens
  }
}

/**
 * Parser class responsible for building the AST from the tokens.
 * Implemented inspired by Pratt Parser
 * More info can be found here:
 * https://abarker.github.io/typped/pratt_parsing_intro.html
 */

export class Parser {
  private readonly tokens: Token[]
  private pos = 0
  private readonly prefixParseFns: Record<string, PrefixParseFunction> = {}
  private readonly infixParseFns: Record<string, InfixParseFunction> = {}
  private readonly precedences: Record<Operators | string, number> = {
    [Operators.ADD]: 1,
    [Operators.SUBTRACT]: 1,
    [Operators.MULTIPLY]: 2,
    [Operators.DIVIDE]: 2,
    PREFIX: 3,
  }

  constructor(tokens: Token[]) {
    this.tokens = tokens
    this.init()
  }

  // Initialize prefix and infix parse functions
  private init(): void {
    this.prefixParseFns[TokenType.NUM] = this.parseNumberLiteral.bind(this)
    this.prefixParseFns[Operators.SUBTRACT] =
      this.parsePrefixExpression.bind(this)

    for (const op of Object.values(Operators)) {
      this.infixParseFns[op] = this.parseInfixExpression.bind(this)
    }

    this.prefixParseFns[Parens.OPEN] = this.parseGroupedExpression.bind(this)
  }

  // Current char
  private peek(): Token {
    return this.tokens[this.pos]
  }

  // Next char
  private consume(): Token {
    return this.tokens[this.pos++]
  }

  // Parse number
  private parseNumberLiteral(): LiteralNode {
    return { type: 'Literal', value: Number(this.consume().value) }
  }

  // Prase prefix
  private parsePrefixExpression(): PrefixExpressionNode {
    const token = this.consume()
    const rightExpression = this.parseExpression(this.precedences.PREFIX) // Use the higher precedence
    return {
      type: 'PrefixExpression',
      op: token.value as Operators,
      right: rightExpression,
    }
  }

  // Parse an infix expression
  private parseInfixExpression(left: Node): BinaryExpressionNode {
    const token = this.consume()
    const precedence = this.precedences[token.value as Operators]
    return {
      type: 'BinaryExpression',
      left,
      op: token.value as Operators,
      right: this.parseExpression(precedence),
    }
  }

  // Main function to parse an expression into its AST representation
  public parseExpression(precedence = 0): Node {
    const prefixFn =
      this.prefixParseFns[
        this.peek().type === TokenType.OP ||
        this.peek().type === TokenType.PAREN
          ? this.peek().value
          : this.peek().type
      ]
    if (!prefixFn) {
      throw new ParseError({
        message: `No prefix parse function for ${this.peek().type}`,
        code: E_CODE.PARSE_ERROR.code,
      })
    }
    let left = prefixFn()

    while (
      this.pos < this.tokens.length &&
      this.peek().type === TokenType.OP &&
      this.precedences[this.peek().value as Operators] > precedence
    ) {
      left = this.infixParseFns[this.peek().value as Operators](left)
    }

    return left
  }

  // Parse an expression enclosed in parentheses
  private parseGroupedExpression(): Node {
    this.consume() // consume the opening parenthesis
    const expression = this.parseExpression()
    if (!this.peek() || (this.peek() && this.peek().value !== Parens.CLOSE)) {
      throw new ParseError({
        message: 'Expected closing parenthesis',
        code: E_CODE.PARSE_ERROR.code,
      })
    }
    this.consume() // consume the closing parenthesis
    return expression
  }
}

/**
 * Evaluator class to evaluate the AST and return the result.
 */
export class Evaluator {
  // Evaluate a node based on its type
  public evaluate(node: Node): number {
    switch (node.type) {
      case 'BinaryExpression':
        return this.evaluateBinaryExpression(node)
      case 'PrefixExpression':
        return this.evaluatePrefixExpression(node)
      case 'Literal':
        return node.value
      default:
        throw new EvaluateError({
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          message: `Unknown object: ${node}`,
          code: E_CODE.EVALUATE_ERROR.code,
        })
    }
  }

  // Evaluate a binary expression (addition, subtraction, etc.)
  private evaluateBinaryExpression(node: BinaryExpressionNode): number {
    const leftValue = this.evaluate(node.left)
    const rightValue = this.evaluate(node.right)
    switch (node.op) {
      case Operators.ADD:
        return leftValue + rightValue
      case Operators.SUBTRACT:
        return leftValue - rightValue
      case Operators.MULTIPLY:
        return leftValue * rightValue
      case Operators.DIVIDE:
        if (rightValue === 0) {
          throw new EvaluateError({
            message: `Division by zero: ${node.type}`,
            code: E_CODE.EVALUATE_ERROR.code,
          })
        }
        return leftValue / rightValue
      default:
        throw new EvaluateError({
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          message: `Unknown operator: ${node.op}`,
          code: E_CODE.EVALUATE_ERROR.code,
        })
    }
  }

  // Evaluate a prefix expression (negative numbers)
  private evaluatePrefixExpression(node: PrefixExpressionNode): number {
    const rightValue = this.evaluate(node.right)
    if (node.op === Operators.SUBTRACT) {
      return -rightValue
    }
    throw new EvaluateError({
      message: `Unknown prefix operator: ${node.op}`,
      code: E_CODE.EVALUATE_ERROR.code,
    })
  }
}

/**
 * Main evaluation function.
 * Takes an expression string, tokenizes it, parses it into an AST, evaluates it, and returns the result.
 */
export const evaluate = (expression: string): number => {
  expression = expression.trim().replace(/\s/g, '')

  const isDev = config.node.env === 'development'

  let startTime = performance.now()
  const tokens = new Tokenizer(expression).tokenize()
  let endTime = performance.now()
  if (isDev) logger.info(`Tokenize took ${endTime - startTime} ms.`)

  startTime = performance.now()
  const ast = new Parser(tokens).parseExpression()
  endTime = performance.now()
  if (isDev) logger.info(`ParseExpression took ${endTime - startTime} ms.`)

  startTime = performance.now()
  const result = new Evaluator().evaluate(ast)
  endTime = performance.now()
  if (isDev) logger.info(`Evaluate took ${endTime - startTime} ms.`)

  return result
}

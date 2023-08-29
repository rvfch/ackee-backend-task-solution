import { EvaluateError, ParseError, TokenizationError } from '../../app/errors'
import {
  BinaryExpressionNode,
  Evaluator,
  LiteralNode,
  Operators,
  Parens,
  Parser,
  PrefixExpressionNode,
  Token,
  TokenType,
  Tokenizer,
  evaluate,
} from '../../app/utils/expressionEval'

describe('Expression evaluator test', () => {
  describe('Tokenizer', () => {
    it('should tokenize numbers correctly', () => {
      const tokenizer = new Tokenizer('123')
      const tokens = tokenizer.tokenize()
      expect(tokens).toEqual([{ type: TokenType.NUM, value: '123' }])
    })

    it('should tokenize operators correctly', () => {
      const tokenizer = new Tokenizer('+')
      const tokens = tokenizer.tokenize()
      expect(tokens).toEqual([{ type: TokenType.OP, value: Operators.ADD }])
    })

    it('should tokenize parentheses correctly', () => {
      const tokenizer = new Tokenizer('()')
      const tokens = tokenizer.tokenize()
      expect(tokens).toEqual([
        { type: TokenType.PAREN, value: Parens.OPEN },
        { type: TokenType.PAREN, value: Parens.CLOSE },
      ])
    })

    it('should throw TokenizationError for invalid input', () => {
      const tokenizer = new Tokenizer('@')
      expect(() => tokenizer.tokenize()).toThrow(TokenizationError)
    })
  })

  describe('Parser', () => {
    it('should parse literals correctly', () => {
      const tokens: Token[] = [{ type: TokenType.NUM, value: '123' }]
      const parser = new Parser(tokens)
      const ast = parser.parseExpression()
      expect(ast).toEqual({ type: 'Literal', value: 123 })
    })

    it('should parse prefix expressions correctly', () => {
      const tokens: Token[] = [
        { type: TokenType.OP, value: Operators.SUBTRACT },
        { type: TokenType.NUM, value: '123' },
      ]
      const parser = new Parser(tokens)
      const ast = parser.parseExpression()
      expect(ast).toEqual({
        type: 'PrefixExpression',
        op: Operators.SUBTRACT,
        right: { type: 'Literal', value: 123 },
      })
    })

    it('should parse infix expressions correctly', () => {
      const tokens: Token[] = [
        { type: TokenType.NUM, value: '2' },
        { type: TokenType.OP, value: Operators.ADD },
        { type: TokenType.NUM, value: '3' },
      ]
      const parser = new Parser(tokens)
      const ast = parser.parseExpression()
      expect(ast).toEqual({
        type: 'BinaryExpression',
        left: { type: 'Literal', value: 2 },
        op: Operators.ADD,
        right: { type: 'Literal', value: 3 },
      })
    })

    it('should parse grouped expressions correctly', () => {
      const tokens: Token[] = [
        { type: TokenType.PAREN, value: Parens.OPEN },
        { type: TokenType.NUM, value: '2' },
        { type: TokenType.PAREN, value: Parens.CLOSE },
      ]
      const parser = new Parser(tokens)
      const ast = parser.parseExpression()
      expect(ast).toEqual({ type: 'Literal', value: 2 })
    })

    it('should throw ParseError for unhandled parenthesis', () => {
      const tokens: Token[] = [{ type: TokenType.PAREN, value: Parens.CLOSE }]
      const parser = new Parser(tokens)
      expect(() => parser.parseExpression()).toThrow(ParseError)
    })

    it('should throw ParseError for missing closing parenthesis', () => {
      const tokens: Token[] = [
        { type: TokenType.PAREN, value: Parens.OPEN },
        { type: TokenType.NUM, value: '2' },
      ]
      const parser = new Parser(tokens)
      expect(() => parser.parseExpression()).toThrow(ParseError)
    })

    it('should throw ParseError for unknown prefix function', () => {
      const tokens: Token[] = [{ type: TokenType.OP, value: Operators.ADD }]
      const parser = new Parser(tokens)
      expect(() => parser.parseExpression()).toThrow(ParseError)
    })

    // eslint-disable-next-line sonarjs/no-duplicate-string
    it('should handle complex expressions', () => {
      const tokens: Token[] = [
        { type: TokenType.NUM, value: '2' },
        { type: TokenType.OP, value: Operators.ADD },
        { type: TokenType.PAREN, value: Parens.OPEN },
        { type: TokenType.NUM, value: '3' },
        { type: TokenType.OP, value: Operators.MULTIPLY },
        { type: TokenType.NUM, value: '4' },
        { type: TokenType.PAREN, value: Parens.CLOSE },
      ]
      const parser = new Parser(tokens)
      const ast = parser.parseExpression()
      expect(ast).toEqual({
        type: 'BinaryExpression',
        left: { type: 'Literal', value: 2 },
        op: Operators.ADD,
        right: {
          type: 'BinaryExpression',
          left: { type: 'Literal', value: 3 },
          op: Operators.MULTIPLY,
          right: { type: 'Literal', value: 4 },
        },
      })
    })
  })

  describe('Evaluator', () => {
    let evaluator: Evaluator

    beforeEach(() => {
      evaluator = new Evaluator()
    })

    it('should evaluate literals correctly', () => {
      const node: LiteralNode = { type: 'Literal', value: 123 }
      const result = evaluator.evaluate(node)
      expect(result).toBe(123)
    })

    it('should evaluate prefix expressions correctly', () => {
      const node: PrefixExpressionNode = {
        type: 'PrefixExpression',
        op: Operators.SUBTRACT,
        right: { type: 'Literal', value: 123 },
      }
      const result = evaluator.evaluate(node)
      expect(result).toBe(-123)
    })

    it('should evaluate binary expressions correctly', () => {
      const node: BinaryExpressionNode = {
        type: 'BinaryExpression',
        left: { type: 'Literal', value: 2 },
        op: Operators.ADD,
        right: { type: 'Literal', value: 3 },
      }
      const result = evaluator.evaluate(node)
      expect(result).toBe(5)
    })

    it('should handle complex expressions', () => {
      const node: BinaryExpressionNode = {
        type: 'BinaryExpression',
        left: { type: 'Literal', value: 2 },
        op: Operators.ADD,
        right: {
          type: 'BinaryExpression',
          left: { type: 'Literal', value: 3 },
          op: Operators.MULTIPLY,
          right: { type: 'Literal', value: 4 },
        },
      }
      const result = evaluator.evaluate(node)
      expect(result).toBe(14)
    })

    it('should throw EvaluateError for division by zero', () => {
      const node: BinaryExpressionNode = {
        type: 'BinaryExpression',
        left: { type: 'Literal', value: 2 },
        op: Operators.DIVIDE,
        right: { type: 'Literal', value: 0 },
      }
      expect(() => evaluator.evaluate(node)).toThrow(EvaluateError)
    })

    it('should throw EvaluateError for unknown operators', () => {
      const node: BinaryExpressionNode = {
        type: 'BinaryExpression',
        left: { type: 'Literal', value: 2 },
        // Casting to any type to simulate an unknown operator in the test
        op: 'UNKNOWN' as any,
        right: { type: 'Literal', value: 3 },
      }
      expect(() => evaluator.evaluate(node)).toThrow(EvaluateError)
    })

    it('should throw EvaluateError for unknown prefix operators', () => {
      const node: PrefixExpressionNode = {
        type: 'PrefixExpression',
        // Casting to any type to simulate an unknown prefix operator in the test
        op: 'UNKNOWN' as any,
        right: { type: 'Literal', value: 123 },
      }
      expect(() => evaluator.evaluate(node)).toThrow(EvaluateError)
    })

    it('should throw EvaluateError for unknown node types', () => {
      const node = {
        type: 'UnknownNodeType',
        value: 42,
      }
      expect(() => evaluator.evaluate(node as any)).toThrow(EvaluateError)
    })
  })

  describe('evaluate E2E tests', () => {
    it('should evaluate simple arithmetic expressions', () => {
      expect(evaluate('2 + 3')).toBe(5)
      expect(evaluate('4 * 5')).toBe(20)
      expect(evaluate('6 - 2')).toBe(4)
      expect(evaluate('8 / 2')).toBe(4)
    })

    it('should handle order of operations correctly', () => {
      expect(evaluate('2 + 3 * 4')).toBe(14)
      expect(evaluate('8 - 6 / 2')).toBe(5)
      expect(evaluate('4 + 2 * 3 - 6 / 2')).toBe(7)
    })

    it('should handle parenthesis correctly', () => {
      expect(evaluate('(2 + 3) * 4')).toBe(20)
      expect(evaluate('8 - (6 / 2)')).toBe(5)
      expect(evaluate('(4 + 2) * (3 - 6 / 2)')).toBe(0)
    })

    it('should handle negative numbers correctly', () => {
      expect(evaluate('-5')).toBe(-5)
      expect(evaluate('2 * -3')).toBe(-6)
      expect(evaluate('-2 + 3')).toBe(1)
    })

    it('should throw error for invalid expressions', () => {
      expect(() => evaluate('2 +')).toThrow()
      expect(() => evaluate('4 * ')).toThrow()
      expect(() => evaluate('abc')).toThrow()
    })

    it('should throw error for division by zero', () => {
      expect(() => evaluate('5 / 0')).toThrow()
    })

    it('should handle complex expressions', () => {
      expect(evaluate('(4 + 8) * (6 - 5) / ((3 - 2) * (2 + 2))')).toBe(3)
      expect(evaluate('-2 + (3 * 4)')).toBe(10)
      expect(evaluate('(2 + 2) * (2 + 2) - 2')).toBe(14)
    })
  })
})

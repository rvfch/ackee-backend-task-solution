import { E_CODE, EvaluateError, ParseError, TokenizationError } from '../errors'

enum TokenType {
  NUM = 'NUMBER',
  OP = 'OPERATOR',
  PAREN = 'PARENTHESIS',
}

enum Operators {
  ADD = '+',
  SUBTRACT = '-',
  MULTIPLY = '*',
  DIVIDE = '/',
}

enum Parens {
  OPEN = '(',
  CLOSE = ')',
}

interface Token {
  type: TokenType
  value: string
}

type Node = BinaryExpressionNode | PrefixExpressionNode | LiteralNode

type PrefixParseFunction = () => Node
type InfixParseFunction = (leftExpression: Node) => Node

interface BinaryExpressionNode {
  type: 'BinaryExpression'
  left: Node
  op: Operators
  right: Node
}

interface PrefixExpressionNode {
  type: 'PrefixExpression'
  op: Operators
  right: Node
}

interface LiteralNode {
  type: 'Literal'
  value: number
}

class Tokenizer {
  private readonly expression: string
  private pos = 0
  private readonly operators = Object.values(Operators)
  private readonly parens = Object.values(Parens)

  constructor(expression: string) {
    this.expression = expression.trim()
  }

  private peek(): string {
    return this.expression[this.pos]
  }

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
        message: 'Tokenization error: ' + this.expression,
        code: E_CODE.TOKENIZATION_ERROR.code,
      })
    }
    return tokens
  }
}

class Parser {
  private readonly tokens: Token[]
  private pos = 0
  private readonly prefixParseFns: Record<string, PrefixParseFunction> = {}
  private readonly infixParseFns: Record<string, InfixParseFunction> = {}
  private readonly precedences: Record<Operators, number> = {
    [Operators.ADD]: 1,
    [Operators.SUBTRACT]: 1,
    [Operators.MULTIPLY]: 2,
    [Operators.DIVIDE]: 2,
  }

  constructor(tokens: Token[]) {
    this.tokens = tokens
    this.init()
  }

  private init(): void {
    this.prefixParseFns[TokenType.NUM] = this.parseNumberLiteral.bind(this)
    this.prefixParseFns[Operators.SUBTRACT] =
      this.parsePrefixExpression.bind(this)

    for (const op of Object.values(Operators)) {
      this.infixParseFns[op] = this.parseInfixExpression.bind(this)
    }

    this.prefixParseFns[Parens.OPEN] = this.parseGroupedExpression.bind(this)
    this.prefixParseFns[TokenType.PAREN] = this.parseParenthesis.bind(this)
  }

  private peek(): Token {
    return this.tokens[this.pos]
  }

  private consume(): Token {
    return this.tokens[this.pos++]
  }

  private parseNumberLiteral(): LiteralNode {
    return { type: 'Literal', value: Number(this.consume().value) }
  }

  private parsePrefixExpression(): PrefixExpressionNode {
    const token = this.consume()
    return {
      type: 'PrefixExpression',
      op: token.value as Operators,
      right: this.parseExpression(),
    }
  }

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

  public parseExpression(precedence = 0): Node {
    const prefixFn = this.prefixParseFns[this.peek().type]
    if (!prefixFn) {
      throw new ParseError({
        message: `No prefix parse function for ${this.peek().type}`,
        code: E_CODE.PARSE_ERROR.code,
      })
    }
    let left = prefixFn()

    while (
      this.pos < this.tokens.length &&
      ((this.peek().type === TokenType.OP &&
        this.precedences[this.peek().value as Operators] > precedence) ||
        (this.peek().type === TokenType.PAREN &&
          this.peek().value === Parens.OPEN))
    ) {
      if (
        !this.infixParseFns[this.peek().value] &&
        this.peek().value !== Parens.OPEN
      ) {
        throw new ParseError({
          message: `No infix parse function for ${this.peek().value}`,
          code: E_CODE.PARSE_ERROR.code,
        })
      }

      if (this.peek().value === Parens.OPEN) {
        left = this.prefixParseFns[this.peek().type]()
      } else {
        left = this.infixParseFns[this.peek().value as Operators](left)
      }
    }

    return left
  }

  private parseParenthesis(): Node {
    const token = this.peek()

    if (token.value === Parens.OPEN) {
      return this.parseGroupedExpression()
    }

    throw new ParseError({
      message: `Unhandled parenthesis: ${token.value}`,
      code: E_CODE.PARSE_ERROR.code,
    })
  }

  private parseGroupedExpression(): Node {
    this.consume() // consume the opening parenthesis
    const expression = this.parseExpression()
    if (this.peek().value !== Parens.CLOSE) {
      throw new ParseError({
        message: 'Expected closing parenthesis',
        code: E_CODE.PARSE_ERROR.code,
      })
    }
    this.consume() // consume the closing parenthesis
    return expression
  }
}

class Evaluator {
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

export const evaluate = (expression: string): number => {
  const tokens = new Tokenizer(expression).tokenize()
  const ast = new Parser(tokens).parseExpression()
  return new Evaluator().evaluate(ast)
}

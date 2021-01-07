import Node, {
  AssignmentNode,
  BinaryOpNode,
  IdentifierNode,
  NumberNode,
  UnaryOpNode,
} from './nodes.ts';
import Token, { UnaryOp } from './token.ts';

export default class Parser {
  tokens: IterableIterator<Token>;
  token!: Token;

  constructor(tokens: Token[]) {
    this.tokens = tokens[Symbol.iterator]();
    this.advance();
  }

  error(message?: string): never {
    throw `Syntax Error${message ? `: ${message}` : ''}`;
  }

  advance() {
    this.token = this.tokens.next().value;
  }

  eof() {
    return this.token.type === 'eof';
  }

  parse() {
    if (this.eof()) return;

    const result = this.expr();

    if (!this.eof()) this.error();

    return result;
  }

  expr(): Node {
    if (this.token.is('keyword', 'let' as const)) {
      this.advance();
      if (!(this.token as Token).is('identifier'))
        return this.error('Expected identifier');
      const identifier = this.token.value as string;

      this.advance();
      if (!(this.token as Token).is('operator', '=' as const))
        return this.error("Expected '='");

      this.advance();
      const node = this.expr();

      return new AssignmentNode(identifier, node);
    }

    let result = this.term();

    while (
      !this.eof() &&
      ['+', '-'].includes((this.token as Token<'operator'>).value)
    ) {
      const { token } = this;
      this.advance();
      result = new BinaryOpNode(
        result,
        (token as Token<'operator'>).value,
        this.term()
      );
    }

    return result;
  }

  term(): Node {
    let result = this.factor();

    while (
      !this.eof() &&
      ['*', '/'].includes((this.token as Token<'operator'>).value)
    ) {
      const { token } = this;
      this.advance();
      result = new BinaryOpNode(
        result,
        (token as Token<'operator'>).value,
        this.factor()
      );
    }

    return result;
  }

  factor(): Node {
    const { token } = this;

    if (
      token.type === 'operator' &&
      ['+', '-'].includes((token as Token<'operator'>).value)
    ) {
      this.advance();
      return new UnaryOpNode(
        this.factor(),
        (token as Token<'operator', UnaryOp>).value
      );
    }

    return this.power();
  }

  power(): Node {
    let result = this.atom();

    while (!this.eof() && (this.token as Token<'operator'>).value === '^') {
      const { token } = this;
      this.advance();
      result = new BinaryOpNode(
        result,
        (token as Token<'operator'>).value,
        this.atom()
      );
    }

    return result;
  }

  atom(): Node {
    const { token } = this;

    if (token.value === '(') {
      this.advance();
      const result = this.expr();

      if (this.token?.value !== ')') this.error();

      this.advance();
      return result;
    }
    if (token.type === 'number') {
      this.advance();
      return new NumberNode((token as Token<'number'>).value);
    }
    if (token.type === 'identifier') {
      this.advance();
      return new IdentifierNode((token as Token<'identifier'>).value);
    }

    this.error();
  }
}

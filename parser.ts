import Node, { BinaryOpNode, NumberNode, UnaryOpNode } from './nodes.ts';
import Token, { UnaryOp } from './token.ts';

export default class Parser {
  tokens: IterableIterator<Token>;
  token!: Token;

  constructor(tokens: Token[]) {
    this.tokens = tokens[Symbol.iterator]();
    this.advance();
  }

  error(): never {
    throw 'Invalid syntax';
  }

  eof() {
    return this.token.type === 'eof';
  }

  advance() {
    this.token = this.tokens.next().value;
  }

  parse() {
    if (this.eof()) return;

    const result = this.expr();

    if (!this.eof()) this.error();

    return result;
  }

  expr() {
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

  term() {
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

    this.error();
  }
}

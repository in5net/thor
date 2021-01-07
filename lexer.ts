import Token, { Keyword } from './token.ts';

const WHITESPACE = ' \n\r\t';
const DIGITS = '0123456789';
const LETTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
const KEYWORDS: Keyword[] = ['let'];

export default class Lexer {
  text: IterableIterator<string>;
  char!: string;

  constructor(text: string) {
    this.text = text[Symbol.iterator]();
    this.advance();
  }

  lex(): Token[] {
    const tokens = [...this.generateTokens()];
    return tokens;
  }

  eof(): boolean {
    return this.char === '';
  }

  advance(): void {
    this.char = this.text.next().value || '';
  }

  *generateTokens(): Generator<Token> {
    while (!this.eof()) {
      const { char } = this;
      if (WHITESPACE.includes(char)) this.advance();
      else if ((DIGITS + '.').includes(char)) yield this.number();
      else if (LETTERS.includes(char)) yield this.identifier();
      else
        switch (char) {
          case '+':
          case '-':
          case '*':
          case '/':
          case '^':
          case '=':
            this.advance();
            yield new Token('operator', char);
            continue;
          case '(':
          case ')':
            this.advance();
            yield new Token('parenthesis', char);
            continue;
          default:
            throw `Illegal character '${char}'`;
        }
    }
    yield new Token('eof', undefined);
  }

  number(): Token<'number'> {
    let str = this.char;
    let decimals = 0;
    this.advance();

    while (!this.eof() && (DIGITS + '.').includes(this.char)) {
      if (this.char === '.' && ++decimals > 1) break;

      str += this.char;
      this.advance();
    }

    return new Token('number', parseFloat(str));
  }

  identifier(): Token<'identifier' | 'keyword'> {
    let str = this.char;
    this.advance();

    while (!this.eof() && (LETTERS + DIGITS).includes(this.char)) {
      str += this.char;
      this.advance();
    }

    if (isKeyword(str)) return new Token('keyword', str);
    return new Token('identifier', str);
  }
}

function isKeyword(str: string): str is Keyword {
  return KEYWORDS.includes(str as Keyword);
}

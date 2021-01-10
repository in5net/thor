import Token, { Boolean, Keyword } from './token.ts';

const WHITESPACE = ' \t\r';
const DIGITS = '0123456789';
const LETTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
const KEYWORDS: Keyword[] = ['let', 'if', 'else', 'fn', 'return'];
const BOOLEANS: Boolean[] = ['true', 'false'];

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
          case '\n':
            this.advance();
            yield new Token('newline', undefined);
            continue;
          case '+':
          case '-':
          case '*':
          case '/':
          case '^':
          case '=':
          case ',':
          case ':':
            this.advance();
            yield new Token('operator', char);
            continue;
          case '(':
          case ')':
          case '{':
          case '}':
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

  identifier(): Token<'identifier' | 'keyword' | 'boolean'> {
    let str = this.char;
    this.advance();

    while (!this.eof() && (LETTERS + DIGITS).includes(this.char)) {
      str += this.char;
      this.advance();
    }

    if (isKeyword(str)) return new Token('keyword', str);
    if (isBoolean(str)) return new Token('boolean', str === 'true');
    return new Token('identifier', str);
  }
}

function isKeyword(str: string): str is Keyword {
  return KEYWORDS.includes(str as Keyword);
}

function isBoolean(str: string): str is Boolean {
  return BOOLEANS.includes(str as Boolean);
}

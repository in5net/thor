import Token, { BinaryOp, Boolean, CompareOp, Keyword } from './token.ts';

const WHITESPACE = ' \t\r';
const DIGITS = '0123456789';
const LETTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
const ESCAPE_CHARS: Record<string, string | undefined> = {
  '\\': '\\',
  n: '\n',
  t: '\t',
};
const KEYWORDS: Keyword[] = ['let', 'if', 'else', 'fn', 'return'];
const BOOLEANS: Boolean[] = ['true', 'false'];
const COMPARE_OPS = ['=', '!', '<', '>'];
const COMPARE_KEYWORDS = ['not', 'and', 'or'];

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
      else if ('\n;'.includes(char)) {
        yield new Token('newline', undefined);
        this.advance();
      } else if ((DIGITS + '.').includes(char)) yield this.number();
      else if (LETTERS.includes(char)) yield this.identifier();
      else if (COMPARE_OPS.includes(char)) yield this.compare();
      else
        switch (char) {
          case '"':
            yield this.string();
            continue;
          case '+':
          case '-':
          case '*':
          case '/':
          case '^':
          case ',':
          case ':':
            yield new Token('operator', char);
            this.advance();
            continue;
          case '(':
          case ')':
          case '{':
          case '}':
          case '|':
            yield new Token('parenthesis', char);
            this.advance();
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

  string(): Token<'string'> {
    let str = '';
    let escapeCharacter = false;
    this.advance();

    while (!this.eof() && (this.char !== '"' || escapeCharacter)) {
      if (escapeCharacter) str += ESCAPE_CHARS[this.char] || this.char;
      else if (this.char === '\\') escapeCharacter = true;
      else str += this.char;

      this.advance();
      escapeCharacter = false;
    }

    this.advance();
    return new Token('string', str);
  }

  identifier(): Token<'identifier' | 'keyword' | 'operator' | 'boolean'> {
    let str = this.char;
    this.advance();

    while (!this.eof() && (LETTERS + DIGITS).includes(this.char)) {
      str += this.char;
      this.advance();
    }

    if (isKeyword(str)) return new Token('keyword', str);
    if (isBoolean(str)) return new Token('boolean', str === 'true');
    if (COMPARE_KEYWORDS.includes(str))
      return new Token('operator', str as BinaryOp);
    return new Token('identifier', str);
  }

  compare(): Token<'operator'> {
    let str = this.char;
    this.advance();

    if (this.char === '=') {
      str += this.char;
      this.advance();
    }

    return new Token('operator', str as BinaryOp);
  }
}

function isKeyword(str: string): str is Keyword {
  return KEYWORDS.includes(str as Keyword);
}

function isBoolean(str: string): str is Boolean {
  return BOOLEANS.includes(str as Boolean);
}

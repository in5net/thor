import Token, {
  BinaryOp,
  Boolean,
  booleans,
  Grouping,
  groupings,
  Keyword,
  keywords,
  Operator,
  operators
} from './token.ts';

const WHITESPACE = ' \t\r';
const DIGITS = '0123456789';
const LETTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
const ESCAPE_CHARS: Record<string, string | undefined> = {
  '\\': '\\',
  n: '\n',
  t: '\t'
};
const COMPARE_OPS = ['=', '!', '<', '>'];

const EOF = '<eof>';

export default class Lexer {
  index = -1;
  char!: string;

  constructor(private text: string) {
    this.advance();
  }

  lex(): Token[] {
    const tokens: Token[] = [];
    let token = this.nextToken();
    while (!token.is('eof')) {
      tokens.push(token);
      token = this.nextToken();
    }
    tokens.push(token);
    return tokens;
  }

  eof(): boolean {
    return this.char === EOF;
  }

  advance(): void {
    this.char = this.text[++this.index] || EOF;
  }

  nextToken(): Token {
    while (!this.eof()) {
      const { char } = this;
      if (WHITESPACE.includes(char)) this.advance();
      else if ('\n;'.includes(char)) {
        this.advance();
        return new Token('newline', undefined);
      } else if ((DIGITS + '.').includes(char)) return this.number();
      else if (char === '"') return this.string();
      else if (LETTERS.includes(char)) return this.word();
      else if (COMPARE_OPS.includes(char)) return this.compare();
      else if (char === '-') {
        this.advance();
        if (this.char === '>') {
          this.advance();
          return new Token('arrow', undefined);
        }
        return new Token('operator', '-');
      } else if (operators.includes(char as Operator)) {
        this.advance();
        return new Token('operator', char);
      } else if (
        Object.entries(groupings)
          .flat()
          .includes(char as Grouping)
      ) {
        this.advance();
        return new Token('grouping', char);
      } else throw `Illegal character '${char}'`;
    }
    return new Token('eof', undefined);
  }

  number(): Token<'number'> {
    let str = this.char;
    let decimals = 0;
    this.advance();

    while ((DIGITS + '.').includes(this.char)) {
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

  word(): Token<'keyword' | 'boolean' | 'operator' | 'identifier'> {
    let str = this.char;
    this.advance();

    while ((LETTERS + DIGITS).includes(this.char)) {
      str += this.char;
      this.advance();
    }

    if (keywords.includes(str as Keyword)) return new Token('keyword', str);
    if (booleans.includes(str as Boolean))
      return new Token('boolean', str === 'true');
    if (operators.includes(str as Operator))
      return new Token('operator', str as Operator);
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

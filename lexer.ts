import Token, {
  Boolean,
  booleans,
  Grouping,
  groupings,
  Keyword,
  keywords,
  Operator,
  operators,
  String
} from './token.ts';

const WHITESPACE = /[ \t\r]/;
const DIGITS = /[0-9]/;
// letters, underscore, & greek letters
const LETTERS = /[a-zA-Z_\u0391-\u03C9]/;
const ESCAPE_CHARS: Record<string, string | undefined> = {
  '\\': '\\',
  n: '\n',
  r: '\r',
  t: '\t'
};

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

  get nextChar(): string {
    return this.text[this.index + 1] || EOF;
  }

  nextToken(): Token {
    while (!this.eof()) {
      const { char } = this;
      if (WHITESPACE.test(char)) this.advance();
      else if (/[\n;]/.test(char)) {
        this.advance();
        return new Token('newline', undefined);
      } else if (DIGITS.test(char) || char === '.') return this.number();
      else if (char === '"') return this.string();
      else if (LETTERS.test(char)) return this.word();
      else if (char === '-' && this.nextChar === '>') {
        this.advance();
        this.advance();
        return new Token('arrow', undefined);
      } else if (operators.includes(char as Operator)) return this.operator();
      else if (
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

    while (DIGITS.test(this.char) || this.char === '.') {
      if (this.char === '.' && ++decimals > 1) break;

      str += this.char;
      this.advance();
    }

    return new Token('number', parseFloat(str));
  }

  string(): Token<'string'> {
    this.advance();
    let fragments: String = [];
    let str = '';
    let escapeCharacter = false;

    while (!this.eof() && (this.char !== '"' || escapeCharacter)) {
      if (escapeCharacter) {
        str += ESCAPE_CHARS[this.char] || this.char;
        escapeCharacter = false;
      } else if (this.char === '\\') escapeCharacter = true;
      else if (this.char === '{') {
        fragments.push(str);
        str = '';
        this.advance();

        const tokens: Token[] = [];
        let token = this.nextToken();
        while (!this.eof() && (this.char as string) !== '}') {
          tokens.push(token);
          token = this.nextToken();
        }
        tokens.push(token);
        if ((this.char as string) !== '}') throw "Expected '}' in string";
        fragments.push(tokens);
        console.log({ fragments });
      } else str += this.char;

      this.advance();
    }
    if (str) fragments.push(str);

    this.advance();
    return new Token('string', fragments);
  }

  word(): Token<'keyword' | 'boolean' | 'operator' | 'identifier'> {
    let str = this.char;
    this.advance();

    while ([LETTERS, DIGITS].some(regex => regex.test(this.char))) {
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

  operator(): Token<'operator'> {
    let str = this.char;
    this.advance();

    if (['=', '+', '-'].includes(this.char)) {
      str += this.char;
      this.advance();
    }

    return new Token('operator', str as Operator);
  }
}

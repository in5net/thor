import Token from './token.ts';

const WHITESPACE = ' \n\r\t';
const DIGITS = '0123456789';

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

  advance() {
    this.char = this.text.next().value || '';
  }

  *generateTokens() {
    while (this.char !== '') {
      const { char } = this;
      if (WHITESPACE.includes(char)) this.advance();
      else if ((DIGITS + '.').includes(char)) yield this.generateNumber();
      else
        switch (char) {
          case '+':
          case '-':
          case '*':
          case '/':
          case '^':
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

  generateNumber() {
    let str = this.char;
    let decimals = 0;
    this.advance();

    while (this.char !== '' && (DIGITS + '.').includes(this.char)) {
      if (this.char === '.' && ++decimals > 1) break;

      str += this.char;
      this.advance();
    }

    return new Token('number', parseFloat(str));
  }
}

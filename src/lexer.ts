import Position from './position';
import Token, {
  Boolean,
  booleans,
  groupings,
  Keyword,
  keywords,
  Operator,
  operators,
  String,
  TokenMap
} from './token';

const WHITESPACE = /[ \t\r]/;
const DIGITS = /[0-9]/;
// letters, underscore, & greek letters
const LETTERS = /[a-zA-Z_\u0391-\u03C9∞]/;
const ESCAPE_CHARS: Record<string, string | undefined> = {
  '\\': '\\',
  n: '\n',
  r: '\r',
  t: '\t'
};
const SUPERSCRIPT =
  'ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖʳˢᵗᵘᵛʷˣʸᶻᴬᴮᶜᴰᴱᶠᴳᴴᴵᴶᴷᴸᴹᴺᴼᴾᴿˢᵀᵁⱽᵂˣʸᶻ⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾';
const NORMALSCRIPT =
  'abcdefghijklmnoprstuvwxyzABCDEFGHIJKLMNOPRSTUVWXYZ0123456789+-=()';

const EOF = '\0';

export class Error {
  constructor(
    readonly message: string,
    readonly start: Position,
    readonly end: Position
  ) {}
}

export default class Lexer {
  index = 0;
  char: string;
  position: Position;

  constructor(private text: string) {
    this.char = text[0] || EOF;
    this.position = new Position(text);
  }

  error(message: string, start: Position): never {
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw new Error(message, start, this.position.copy());
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
    this.position.advance();
  }

  get nextChar(): string {
    return this.text[this.index + 1] || EOF;
  }

  nextToken(): Token {
    while (!this.eof()) {
      const { char } = this;
      if (WHITESPACE.test(char)) this.advance();
      else if (/[\n;]/.test(char)) {
        const start = this.position.copy();
        this.advance();
        return new Token('newline', undefined, start, this.position.copy());
      } else if (DIGITS.test(char) || char === '.') return this.number();
      else if (SUPERSCRIPT.includes(char)) return this.superscript();
      else if (char === '"') return this.string();
      else if (LETTERS.test(char)) return this.word();
      else if (char === '-' && this.nextChar === '>') {
        const start = this.position.copy();
        this.advance();
        this.advance();
        return new Token('arrow', undefined, start, this.position.copy());
      } else if (operators.includes(char as Operator)) return this.operator();
      else if (Object.entries(groupings).flat().includes(char)) {
        const start = this.position.copy();
        this.advance();
        return new Token('grouping', char, start, this.position.copy());
      } else this.error(`Illegal character '${char}'`, this.position.copy());
    }
    return Token.EOF;
  }

  superscript(): Token<'superscript'> {
    const start = this.position.copy();
    let str = '';

    let index = SUPERSCRIPT.indexOf(this.char);
    while (index >= 0) {
      const normalChar = NORMALSCRIPT[index];
      str += normalChar;
      this.advance();
      index = SUPERSCRIPT.indexOf(this.char);
    }

    const lexer = new Lexer(str);
    const tokens = lexer.lex() as Token<
      Exclude<keyof TokenMap, 'superscript'>
    >[];
    tokens.pop();

    return new Token('superscript', tokens, start, this.position.copy());
  }

  number(): Token<'number'> {
    const start = this.position.copy();

    let str = this.char;
    let decimals = 0;
    this.advance();

    while (DIGITS.test(this.char) || ['.', '_'].includes(this.char)) {
      // eslint-disable-next-line no-continue
      if (this.char === '_') continue;
      if (this.char === '.' && ++decimals > 1) break;

      str += this.char;
      this.advance();
    }

    return new Token('number', parseFloat(str), start, this.position.copy());
  }

  string(): Token<'string'> {
    const start = this.position.copy();
    this.advance();

    const fragments: String = [];
    let str = '';
    let escapeCharacter = false;

    let fragmentStart = this.position.copy();
    while (!this.eof() && (this.char !== '"' || escapeCharacter)) {
      if (escapeCharacter) {
        str += ESCAPE_CHARS[this.char] || this.char;
        escapeCharacter = false;
      } else if (this.char === '\\') escapeCharacter = true;
      else if (this.char === '{') {
        fragments.push(
          new Token('string', str, fragmentStart, this.position.copy())
        );
        str = '';
        this.advance();
        fragmentStart = this.position.copy();

        const tokens: Token[] = [];
        let token = this.nextToken();
        while (!this.eof() && !['}', '"'].includes(this.char as string)) {
          tokens.push(token);
          token = this.nextToken();
        }
        tokens.push(token);
        if ((this.char as string) !== '}')
          this.error(
            "When putting expressions in strings, you must wrap the expression in curly braces '{}'. It seems like you forgot the ending '}",
            start
          );
        fragments.push(tokens);
      } else str += this.char;

      this.advance();
    }
    if (str)
      fragments.push(
        new Token('string', str, fragmentStart, this.position.copy())
      );

    if (this.char !== '"')
      this.error(
        `Strings must start and end with '"'. It seems like you forgot the ending '"'.`,
        start
      );
    this.advance();
    return new Token('string', fragments, start, this.position.copy());
  }

  word(): Token<'keyword' | 'boolean' | 'operator' | 'identifier'> {
    const start = this.position.copy();

    let str = this.char;
    this.advance();

    while ([LETTERS, DIGITS].some(regex => regex.test(this.char))) {
      str += this.char;
      this.advance();
    }

    const end = this.position.copy();
    if (keywords.includes(str as Keyword))
      return new Token('keyword', str, start, end);
    if (booleans.includes(str as Boolean))
      return new Token('boolean', str === 'true', start, end);
    if (operators.includes(str as Operator))
      return new Token('operator', str as Operator, start, end);
    return new Token('identifier', str, start, end);
  }

  operator(): Token<'operator'> {
    const start = this.position.copy();

    let str = this.char;
    this.advance();

    if (['=', '+', '-'].includes(this.char)) {
      str += this.char;
      this.advance();
    }

    return new Token('operator', str as Operator, start, this.position.copy());
  }
}

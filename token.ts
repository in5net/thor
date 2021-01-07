export type UnaryOp = '+' | '-';
export type BinaryOp = UnaryOp | '*' | '/' | '^' | '=';
export type Parenthesis = '(' | ')';
export type Keyword = 'let';

interface TokenMap {
  number: number;
  identifier: string;
  operator: UnaryOp | BinaryOp;
  parenthesis: Parenthesis;
  keyword: Keyword;
  eof: undefined;
}

enum TokenName {
  number = 'number',
  identifier = 'identifier',
  operator = 'operator',
  parenthesis = 'parenthesis',
  keyword = 'keyword',
  eof = '<eof>',
}

export default class Token<
  T extends keyof TokenMap = keyof TokenMap,
  V = TokenMap[T]
> {
  constructor(public type: T, public value: V) {}

  is<T_ extends keyof TokenMap, V_ = TokenMap[T_]>(
    this: Token,
    type: T_,
    value?: V_
  ): this is Token<T_, V_> {
    if (this.type !== type) return false;
    if (value === undefined) return true;
    // @ts-ignore
    return this.value === value;
  }

  toString() {
    const { type, value } = this;
    return `${TokenName[type]}${value ? `: ${value}` : ''}`;
  }
}

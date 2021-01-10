export type Boolean = 'true' | 'false';
export type UnaryOp = '+' | '-' | 'not';
export type CompareOp = '==' | '!=' | '>' | '>=' | '<' | '<=' | 'and' | 'or';
export type BinaryOp =
  | CompareOp
  | '+'
  | '-'
  | '*'
  | '/'
  | '^'
  | '='
  | ','
  | ':';
export type Operator = UnaryOp | BinaryOp;
export type Parenthesis = '(' | ')' | '{' | '}';
export type Keyword = 'let' | 'if' | 'else' | 'or' | 'fn' | 'return';

interface TokenMap {
  number: number;
  boolean: boolean;
  identifier: string;
  operator: Operator;
  parenthesis: Parenthesis;
  keyword: Keyword;
  newline: undefined;
  eof: undefined;
}

enum TokenName {
  number = 'number',
  boolean = 'boolean',
  identifier = 'identifier',
  operator = 'operator',
  parenthesis = 'parenthesis',
  keyword = 'keyword',
  newline = 'newline',
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
    return `${TokenName[type]}${value ? `: '${value}'` : ''}`;
  }
}

export type Boolean = 'true' | 'false';
export type UnaryOp = '+' | '-' | 'not';
export type CompareOp = '==' | '!=' | '>' | '>=' | '<' | '<=' | 'and' | 'or';
export type BinaryOp =
  | CompareOp
  | '+'
  | '-'
  | '*'
  | '/'
  | '%'
  | '^'
  | '='
  | ','
  | ':';
export type Operator = UnaryOp | BinaryOp;
export type Parenthesis = '(' | ')' | '[' | ']' | '{' | '}' | '|';
export type Keyword =
  | 'let'
  | 'if'
  | 'else'
  | 'for'
  | 'while'
  | 'in'
  | 'fn'
  | 'return';

interface TokenMap {
  number: number;
  boolean: boolean;
  string: string;
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
  string = 'string',
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

  toString() {
    const { type, value } = this;
    return `${TokenName[type]}${value ? `: '${value}'` : ''}`;
  }

  is<Type extends keyof TokenMap, Value = TokenMap[Type]>(
    type: Type,
    value?: Value
  ): this is Token<Type, NonNullable<Value>> {
    // @ts-ignore
    if (this.type !== type) return false;
    if (value === undefined) return true;
    // @ts-ignore
    return this.value === value;
  }
}

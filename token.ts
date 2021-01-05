export type UnaryOp = '+' | '-';
export type BinaryOp = UnaryOp | '*' | '/' | '^';
export type Parenthesis = '(' | ')';

interface TokenMap {
  number: number;
  operator: UnaryOp | BinaryOp;
  parenthesis: Parenthesis;
  eof: undefined;
}

enum TokenName {
  number = 'number',
  operator = 'operator',
  parenthesis = 'parenthesis',
  eof = '<eof>',
}

export default class Token<
  T extends keyof TokenMap = keyof TokenMap,
  V = TokenMap[T]
> {
  constructor(public type: T, public value: V) {}

  toString() {
    const { type, value } = this;
    return `${TokenName[type]}${value ? `: ${value}` : ''}`;
  }
}

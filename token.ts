export const booleans = ['true', 'false'] as const;
export const unaryOps = ['+', '-', '√', '∛', '∜', '!', 'not'] as const;
export const compareOps = [
  '==',
  '!=',
  '<',
  '<=',
  '>',
  '>=',
  'and',
  'or'
] as const;
export const binaryOps = [
  '+',
  '-',
  '*',
  '/',
  '%',
  '^',
  '=',
  ',',
  ':',
  ...compareOps
] as const;
export const operators = [...unaryOps, ...binaryOps] as const;
export const groupings = {
  '(': ')',
  '[': ']',
  '{': '}',
  '|': '|',
  '⌊': '⌋',
  '⌈': '⌉'
} as const;
export const keywords = [
  'let',
  'if',
  'else',
  'for',
  'while',
  'in',
  'fn',
  'return'
] as const;

export type Boolean = typeof booleans[number];
export type UnaryOp = typeof unaryOps[number];
export type CompareOp = typeof compareOps[number];
export type BinaryOp = typeof binaryOps[number];
export type Operator = typeof operators[number];
export type LeftGrouping = keyof typeof groupings;
export type RightGrouping = typeof groupings[LeftGrouping];
export type Grouping = LeftGrouping | RightGrouping;
export type GroupingOp = '()' | '[]' | '{}' | '||' | '⌊⌋' | '⌈⌉';
export type Keyword = typeof keywords[number];

interface TokenMap {
  number: number;
  boolean: boolean;
  string: string;
  identifier: string;
  operator: Operator;
  grouping: Grouping;
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
  grouping = 'grouping',
  keyword = 'keyword',
  newline = 'newline',
  eof = '<eof>'
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

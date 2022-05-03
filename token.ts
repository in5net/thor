import { green } from 'fmt/colors.ts';

import Position from './position.ts';

export const booleans = ['true', 'false'] as const;
export const prefixUnaryOps = [
  '+',
  '-',
  '±',
  '∓',
  '√',
  '∛',
  '∜',
  '∑',
  '∏',
  'not'
] as const;
export const postfixUnaryOps = ['!', '°'] as const;
export const unaryOps = [...prefixUnaryOps, ...postfixUnaryOps] as const;
export const numberCompareOps = ['==', '!=', '<', '<=', '>', '>='] as const;
export const boolCompareOps = [
  'and',
  'or',
  'xor',
  'nand',
  'nor',
  'in'
] as const;
export const compareOps = [...boolCompareOps, ...numberCompareOps] as const;
export const identifierOps = [
  '=',
  '+=',
  '-=',
  '++',
  '--',
  '*=',
  '/=',
  '%=',
  '^='
] as const;
export const binaryOps = [
  '+',
  '-',
  '±',
  '∓',
  '*',
  '∙',
  '×',
  '/',
  '%',
  '^',
  ',',
  ':',
  '.',
  ...compareOps,
  ...identifierOps
] as const;
export const operators = [...unaryOps, ...binaryOps] as const;
export const groupings = {
  '(': ')',
  '[': ']',
  '{': '}',
  '|': '|',
  '⌊': '⌋',
  '⌈': '⌉',
  '⟨': '⟩'
} as const;
export const groupingChars = Object.entries(groupings).flat();
export const keywords = [
  'let',
  'if',
  'else',
  'for',
  'while',
  'loop',
  'fn',
  'return',
  'await',
  'import',
  'from'
] as const;

export type Boolean = typeof booleans[number];
export type String =
  | Token<'string', string>
  | (Token<'string', string> | Token[])[];
export type PrefixUnaryOp = typeof prefixUnaryOps[number];
export type PostfixUnaryOp = typeof postfixUnaryOps[number];
export type UnaryOp = typeof unaryOps[number];
export type CompareOp = typeof compareOps[number];
export type IdentifierOp = typeof identifierOps[number];
export type BinaryOp = typeof binaryOps[number];
export type Operator = typeof operators[number];
export type LeftGrouping = keyof typeof groupings;
export type RightGrouping = typeof groupings[LeftGrouping];
export type Grouping = LeftGrouping | RightGrouping;
export type GroupingOp = '()' | '[]' | '{}' | '||' | '⌊⌋' | '⌈⌉';
export type Keyword = typeof keywords[number];

export interface TokenMap {
  number: number;
  superscript: Token<Exclude<keyof TokenMap, 'superscript'>>[];
  boolean: boolean;
  string: String;
  identifier: string;
  operator: Operator;
  arrow: undefined;
  grouping: Grouping;
  keyword: Keyword;
  newline: undefined;
  eof: undefined;
}

enum TokenName {
  number = 'number',
  superscript = 'superscript',
  boolean = 'boolean',
  string = 'string',
  identifier = 'identifier',
  operator = 'operator',
  arrow = 'arrow',
  grouping = 'grouping',
  keyword = 'keyword',
  newline = 'newline',
  eof = '<eof>'
}

export default class Token<
  T extends keyof TokenMap = keyof TokenMap,
  V = TokenMap[T]
> {
  constructor(
    public type: T,
    public value: V,
    public start: Position,
    public end: Position
  ) {}

  static EOF = new Token('eof', undefined, Position.EOF, Position.EOF);

  toString(): string {
    const { type, value } = this;
    return `${TokenName[type]}${
      value !== undefined ? `: ${green(`${value}`)}` : ''
    }`;
  }
  toPrint(): string {
    const { start, end } = this;
    return `${this.toString()} pos: ${Position.textBetween(start, end)}`;
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

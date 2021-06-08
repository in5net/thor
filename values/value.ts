import Scope from '../scope.ts';
import { BinaryOp, GroupingOp, UnaryOp } from '../token.ts';

type UnaryOpIndex = {
  [index in UnaryOp | Exclude<GroupingOp, '[]'>]: () => Value | void;
};
type BinaryOpIndex = {
  [index in BinaryOp | '[]']: (other: Value) => Value | void;
};

export default abstract class Value implements UnaryOpIndex, BinaryOpIndex {
  scope?: Scope;

  abstract toString(): string;
  toPrint(): string {
    return this.toString();
  }

  setScope(scope: Scope) {
    this.scope = scope;
    return this;
  }

  static illegalUnaryOp(value: Value, operator: UnaryOp | GroupingOp): never {
    throw `Illegal operation: ${operator}${value.constructor.name}`;
  }

  static illegalBinaryOp(left: Value, operator: BinaryOp, right: Value): never {
    throw `Illegal operation: ${left.constructor.name} ${operator} ${right.constructor.name}`;
  }

  '+'(other?: Value) {}
  '-'(other?: Value) {}
  '±'(other?: Value) {}
  '∓'(other?: Value) {}
  '√'() {}
  '∛'() {}
  '∜'() {}
  '!'() {}
  '∑'() {}
  '∏'() {}
  '°'() {}
  not() {}

  '⁰'() {}
  '¹'() {}
  '²'() {}
  '³'() {}
  '⁴'() {}
  '⁵'() {}
  '⁶'() {}
  '⁷'() {}
  '⁸'() {}
  '⁹'() {}

  '()'() {}
  '[]'(other: Value) {}
  '{}'() {}
  '||'() {}
  '⌊⌋'() {}
  '⌈⌉'() {}

  '*'(other: Value) {}
  '∙'(other: Value) {}
  '×'(other: Value) {}
  '/'(other: Value) {}
  '%'(other: Value) {}
  '^'(other: Value) {}
  ','(other: Value) {}
  ':'(other: Value) {}

  '='(other: Value) {}
  '+='(other: Value) {}
  '-='(other: Value) {}
  '++'(other: Value) {}
  '--'(other: Value) {}
  '*='(other: Value) {}
  '/='(other: Value) {}
  '%='(other: Value) {}
  '^='(other: Value) {}

  '=='(other: Value) {}
  '!='(other: Value) {}
  '<'(other: Value) {}
  '<='(other: Value) {}
  '>'(other: Value) {}
  '>='(other: Value) {}
  and(other: Value) {}
  or(other: Value) {}
  in(other: Value) {}
}

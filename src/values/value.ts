import type Scope from '../scope';
import type { BinaryOp, GroupingOp, UnaryOp } from '../token';

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

  setScope(scope: Scope): this {
    this.scope = scope;
    return this;
  }

  static illegalUnaryOp(value: Value, operator: UnaryOp | GroupingOp): never {
    throw new Error(`Illegal operation: ${operator}${value.constructor.name}`);
  }

  static illegalBinaryOp(left: Value, operator: BinaryOp, right: Value): never {
    throw new Error(
      `Illegal operation: ${left.constructor.name} ${operator} ${right.constructor.name}`
    );
  }

  '+'(_other?: Value) {}
  '-'(_other?: Value) {}
  '±'(_other?: Value) {}
  '∓'(_other?: Value) {}
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
  '[]'(_other: Value) {}
  '{}'() {}
  '||'() {}
  '⌊⌋'() {}
  '⌈⌉'() {}

  '*'(_other: Value) {}
  '∙'(_other: Value) {}
  '×'(_other: Value) {}
  '/'(_other: Value) {}
  '%'(_other: Value) {}
  '^'(_other: Value) {}
  ','(_other: Value) {}
  ':'(_other: Value) {}

  '='(_other: Value) {}
  '+='(_other: Value) {}
  '-='(_other: Value) {}
  '++'(_other: Value) {}
  '--'(_other: Value) {}
  '*='(_other: Value) {}
  '/='(_other: Value) {}
  '%='(_other: Value) {}
  '^='(_other: Value) {}

  '=='(_other: Value) {}
  '!='(_other: Value) {}
  '<'(_other: Value) {}
  '<='(_other: Value) {}
  '>'(_other: Value) {}
  '>='(_other: Value) {}
  and(_other: Value) {}
  or(_other: Value) {}
  in(_other: Value) {}
}

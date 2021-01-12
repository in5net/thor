import Scope from '../scope.ts';
import { Operator } from '../token.ts';

export default class Value {
  scope?: Scope;

  setScope(scope: Scope) {
    this.scope = scope;
  }

  static illegalUnaryOp(value: Value, operator: Operator): never {
    throw `Illegal operation: ${operator}${value.constructor.name}`;
  }

  static illegalBinaryOp(left: Value, operator: Operator, right: Value): never {
    throw `Illegal operation: ${left.constructor.name} ${operator} ${right.constructor.name}`;
  }
}

import Interpreter from './interpreter.ts';
import { StatementsNode } from './nodes.ts';
import Scope from './scope.ts';
import { BinaryOp, Operator, UnaryOp } from './token.ts';

type Temp = Record<Operator, string>;

export default class Value {
  scope?: Scope;

  setScope(scope: Scope) {
    this.scope = scope;
  }

  static illegalOperation(operator: Operator, other?: Value): never {
    throw `Illegal operation: ${this.constructor.name} ${operator}${
      other ? ` ${other.constructor.name}` : ''
    }`;
  }
}

([
  '+',
  '-',
  '*',
  '/',
  '^',
  '==',
  '!=',
  '>',
  '>=',
  '<',
  '<=',
  'not',
  'and',
  'or',
] as Operator[]).forEach(
  op =>
    // @ts-ignore
    (Value.prototype[op] = Value.illegalOperation)
);

export class Number extends Value {
  constructor(public value: number) {
    super();
  }

  toString() {
    return this.value.toString();
  }

  '+'(other: Value) {
    if (other instanceof Number) return new Number(this.value + other.value);
    if (!other) return this;
    Value.illegalOperation('+', other);
  }

  '-'(other: Value) {
    if (other instanceof Number) return new Number(this.value - other.value);
    if (!other) return new Number(-this.value);
    Value.illegalOperation('-', other);
  }

  '*'(other: Value) {
    if (other instanceof Number) return new Number(this.value * other.value);
    Value.illegalOperation('*', other);
  }

  '/'(other: Value) {
    if (other instanceof Number) return new Number(this.value / other.value);
    Value.illegalOperation('/', other);
  }

  '^'(other: Value) {
    if (other instanceof Number) return new Number(this.value ** other.value);
    Value.illegalOperation('^', other);
  }

  '=='(other: Value) {
    if (other instanceof Number) return new Boolean(this.value === other.value);
    Value.illegalOperation('==', other);
  }

  '!='(other: Value) {
    if (other instanceof Number) return new Boolean(this.value !== other.value);
    Value.illegalOperation('!=', other);
  }

  '>'(other: Value) {
    if (other instanceof Number) return new Boolean(this.value > other.value);
    Value.illegalOperation('>', other);
  }

  '>='(other: Value) {
    if (other instanceof Number) return new Boolean(this.value >= other.value);
    Value.illegalOperation('>=', other);
  }

  '<'(other: Value) {
    if (other instanceof Number) return new Boolean(this.value < other.value);
    Value.illegalOperation('<', other);
  }

  '<='(other: Value) {
    if (other instanceof Number) return new Boolean(this.value <= other.value);
    Value.illegalOperation('<=', other);
  }

  not() {
    return new Boolean(!this.value);
  }

  and(other: Value) {
    if (other instanceof Number)
      return new Boolean(!!this.value && !!other.value);
    Value.illegalOperation('and', other);
  }

  or(other: Value) {
    if (other instanceof Number)
      return new Boolean(!!this.value || !!other.value);
    Value.illegalOperation('or', other);
  }
}

export class Boolean extends Value {
  constructor(public value: boolean) {
    super();
  }

  toString() {
    return this.value.toString();
  }

  '=='(other: Value) {
    if (other instanceof Boolean)
      return new Boolean(this.value === other.value);
    Value.illegalOperation('==', other);
  }

  '!='(other: Value) {
    if (other instanceof Boolean)
      return new Boolean(this.value !== other.value);
    Value.illegalOperation('!=', other);
  }

  not() {
    return new Boolean(!this.value);
  }

  and(other: Value) {
    if (other instanceof Boolean)
      return new Boolean(!!this.value && !!other.value);
    Value.illegalOperation('and', other);
  }

  or(other: Value) {
    if (other instanceof Boolean)
      return new Boolean(!!this.value || !!other.value);
    Value.illegalOperation('or', other);
  }
}

export class String extends Value {
  constructor(public value: string) {
    super();
  }

  toString() {
    return this.value.toString();
  }

  '+'(other: Value) {
    if (other instanceof String) return new String(this.value + other.value);
    if (!other) return new Number(+this.value);
    Value.illegalOperation('+', other);
  }

  '*'(other: Value) {
    if (other instanceof Number)
      return new String(this.value.repeat(other.value));
    Value.illegalOperation('*', other);
  }

  '=='(other: Value) {
    if (other instanceof String) return new Boolean(this.value === other.value);
    Value.illegalOperation('==', other);
  }

  '!='(other: Value) {
    if (other instanceof String) return new Boolean(this.value !== other.value);
    Value.illegalOperation('!=', other);
  }

  '>'(other: Value) {
    if (other instanceof String)
      return new Boolean(this.value.length > other.value.length);
    if (other instanceof Number)
      return new Boolean(this.value.length > other.value);
    Value.illegalOperation('>', other);
  }

  '>='(other: Value) {
    if (other instanceof String)
      return new Boolean(this.value.length >= other.value.length);
    if (other instanceof Number)
      return new Boolean(this.value.length >= other.value);
    Value.illegalOperation('>=', other);
  }

  '<'(other: Value) {
    if (other instanceof String)
      return new Boolean(this.value.length < other.value.length);
    if (other instanceof Number)
      return new Boolean(this.value.length < other.value);
    Value.illegalOperation('<', other);
  }

  '<='(other: Value) {
    if (other instanceof String)
      return new Boolean(this.value.length <= other.value.length);
    if (other instanceof Number)
      return new Boolean(this.value.length <= other.value);
    Value.illegalOperation('<=', other);
  }

  not() {
    return new Boolean(!this.value);
  }

  and(other: Value) {
    if (other instanceof String)
      return new Boolean(!!this.value && !!other.value);
    Value.illegalOperation('and', other);
  }

  or(other: Value) {
    if (other instanceof String)
      return new Boolean(!!this.value || !!other.value);
    Value.illegalOperation('or', other);
  }
}

export class BaseFunction extends Value {
  constructor(public name = '<anonymous>') {
    super();
  }

  toString() {
    return `<${this instanceof BuiltInFunction ? 'built-in ' : ''}function ${
      this.name
    }>`;
  }

  generateScope(): Scope {
    return new Scope(this.name, this.scope);
  }

  populateArgs(argNames: string[], args: Value[], scope: Scope): void {
    for (let i = 0, { length } = argNames; i < length; i++) {
      const argName = argNames[i];
      const argValue = args[i];
      argValue.setScope(scope);
      scope.symbolTable.set(argName, argValue);
    }
  }
}

export class Function extends BaseFunction {
  constructor(
    name: string,
    public argNames: string[],
    public body: StatementsNode
  ) {
    super(name);
  }

  execute(args: Value[]): Value {
    const interpreter = new Interpreter();
    const scope = this.generateScope();

    this.populateArgs(this.argNames, args, scope);

    const value = interpreter.visit(this.body, scope);
    return value;
  }
}

export class BuiltInFunction extends BaseFunction {
  constructor(name: string) {
    super(name);
  }

  execute(args: Value[]): Value {
    const methodName = `execute_${this.name}`;
    // @ts-ignore
    const method = (this[methodName] || this.noMethod) as {
      (scope: Scope): Value;
      argNames: string[];
    };
    // @ts-ignore
    const argNames = this[`${this.name}_argNames`] as string[];

    const scope = this.generateScope();
    this.populateArgs(argNames, args, scope);

    return method.call(this, scope);
  }

  noMethod(): never {
    throw `Error: Function ${this.name} is not defined`;
  }

  execute_print({ symbolTable }: Scope) {
    const value = symbolTable.get('value');
    console.log(`${value}`);
    return new Number(0);
  }
  print_argNames = ['value'];
}

import Interpreter from '../interpreter.ts';
import Node from '../nodes.ts';
import Scope, { SymbolTable } from '../scope.ts';
import Complex from './complex.ts';
import List from './list.ts';
import Number from './number.ts';
import Value from './value.ts';

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
  constructor(name: string, public argNames: string[], public body: Node) {
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

type BuiltInFunctionName = 'print' | 'len';
type BuiltInFunctionIndex = `execute_${BuiltInFunctionName}`;
type ExecuteIndex = {
  [index in BuiltInFunctionIndex]: (args: Value[]) => Value;
};

export class BuiltInFunction extends BaseFunction implements ExecuteIndex {
  constructor(name: BuiltInFunctionName) {
    super(name);
  }

  execute(args: Value[]): Value {
    const methodName = `execute_${this.name}` as BuiltInFunctionIndex;
    const method = this[methodName];
    return method.call(this, args);
  }

  static setupGlobalSymbolTable(symbolTable: SymbolTable) {
    symbolTable.set('PI', new Number(Math.PI));
    symbolTable.set('TAU', new Number(Math.PI * 2));
    symbolTable.set('i', new Complex(0, 1));

    symbolTable.set('print', new BuiltInFunction('print'));
    symbolTable.set('len', new BuiltInFunction('len'));
  }

  noMethod(): never {
    throw `Error: Built-in function '${this.name}' is not defined`;
  }

  execute_print(messages: Value[]) {
    console.log(messages.join(' '));
    return new Number(0);
  }

  execute_len([value]: Value[]) {
    if (value instanceof List) return new Number(value.items.length);
    if (value instanceof Complex)
      return new Number(Math.hypot(value.r, value.i));
    throw 'Error: len() must receive a list or complex number';
  }
}

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
type ExecuteIndex = {
  [index in BuiltInFunctionName]: (args: Value[]) => Value;
};

export class BuiltInFunction extends BaseFunction implements ExecuteIndex {
  constructor(public name: BuiltInFunctionName) {
    super(name);
  }

  static setupGlobalSymbolTable(symbolTable: SymbolTable) {
    const set = symbolTable.set.bind(symbolTable);

    set('PI', new Number(Math.PI));
    set('π', new Number(Math.PI));
    set('TAU', new Number(Math.PI * 2));
    set('τ', new Number(Math.PI * 2));
    set('e', new Number(Math.E));
    set('∞', new Number(Infinity));
    set('i', new Complex(0, 1));

    set('print', new BuiltInFunction('print'));
    set('len', new BuiltInFunction('len'));
  }

  execute(args: Value[]): Value {
    const method = this[this.name];
    if (!method) throw `Built-in function ${this.name} is not defined`;
    return method(args);
  }

  print(messages: Value[]) {
    console.log(messages.join(' '));
    return new Number(0);
  }

  len([value]: Value[]) {
    if (value instanceof List) return new Number(value.items.length);
    if (value instanceof Complex)
      return new Number(Math.hypot(value.r, value.i));
    throw 'Error: len() must receive a list or complex number';
  }
}

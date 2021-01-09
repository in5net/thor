import Interpreter from './interpreter.ts';
import { StatementsNode } from './nodes.ts';
import Scope from './scope.ts';

export default class Value {
  scope?: Scope;

  setScope(scope: Scope) {
    this.scope = scope;
  }
}

export class Number extends Value {
  constructor(public value: number) {
    super();
  }

  toString() {
    return this.value.toString();
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

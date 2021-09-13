import Interpreter from '../interpreter.ts';
import Node from '../nodes.ts';
import Scope from '../scope.ts';
import Value from './value.ts';

export class BaseFunction extends Value {
  constructor(public name = '<anonymous>') {
    super();
  }

  toString() {
    return `<function ${this.name}>`;
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
  constructor(public argNames: string[], public body: Node, name?: string) {
    super(name);
  }

  async execute(args: Value[]): Promise<Value> {
    const interpreter = new Interpreter();
    const scope = this.generateScope();

    this.populateArgs(this.argNames, args, scope);

    const value = await interpreter.visit(this.body, scope);
    return value;
  }
}

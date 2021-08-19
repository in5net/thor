import Interpreter from '../interpreter';
import Scope from '../scope';
import Value from './value';
import type Node from '../nodes';

export class BaseFunction extends Value {
  constructor(public name = '<anonymous>') {
    super();
  }

  override toString(): string {
    return `<function ${this.name}>`;
  }

  generateScope(): Scope {
    return new Scope(this.name, this.scope);
  }

  populateArgs(argNames: string[], args: Value[], scope: Scope): void {
    for (let i = 0, { length } = argNames; i < length; i++) {
      const argName = argNames[i]!;
      const argValue = args[i]!;
      argValue.setScope(scope);
      scope.symbolTable.set(argName, argValue);
    }
  }
}

export class Function extends BaseFunction {
  constructor(name: string, public argNames: string[], public body: Node) {
    super(name);
  }

  async execute(args: Value[], safe = false): Promise<Value> {
    const interpreter = new Interpreter(safe);
    const scope = this.generateScope();

    this.populateArgs(this.argNames, args, scope);

    const value = await interpreter.visit(this.body, scope);
    return value;
  }
}

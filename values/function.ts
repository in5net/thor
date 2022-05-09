import Interpreter from '../interpreter.ts';
import Node, { Arg } from '../nodes.ts';
import Scope from '../scope.ts';
import Type from '../type.ts';
import Value from './value.ts';
import Number from './number.ts';
import Boolean from './boolean.ts';
import String from './string.ts';

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
      scope.set(argName, argValue);
    }
  }
}

export class Function extends BaseFunction {
  constructor(public args: Arg[], public body: Node, name?: string) {
    super(name);
  }

  copy(): Function {
    return new Function(this.args, this.body, this.name);
  }

  validate(args: Value[]): void | never {
    const { name } = this;
    for (let i = 0, { length } = this.args; i < length; i++) {
      const type = this.args[i][1]?.value;
      const arg = args[i];
      switch (type) {
        case Type.number:
          if (!(arg instanceof Number))
            throw new Error(`Argument #${i} of ${name}() must be a number`);
        case Type.bool:
          if (!(arg instanceof Boolean))
            throw new Error(`Argument #${i} of ${name}() must be a boolean`);
        case Type.str:
          if (!(arg instanceof String))
            throw new Error(`Argument #${i} of ${name}() must be a string`);
        default:
      }
    }
  }

  async execute(args: Value[]): Promise<Value> {
    const interpreter = new Interpreter();
    const scope = this.generateScope();

    this.validate(args);
    this.populateArgs(
      this.args.map(([name]) => name.value),
      args,
      scope
    );

    const value = await interpreter.visit(this.body, scope);
    return value;
  }
}

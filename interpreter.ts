import Node, {
  AssignmentNode,
  AwaitNode,
  BinaryOpNode,
  BooleanNode,
  DeclarationNode,
  ForNode,
  FuncCallNode,
  FuncDefNode,
  GroupingNode,
  IdentifierNode,
  IfNode,
  ImportNode,
  ListNode,
  LoopNode,
  MatNode,
  NumberNode,
  PropAccessNode,
  ReturnNode,
  StringNode,
  UnaryOpNode,
  VecNode,
  WhileNode
} from './nodes.ts';
import Scope from './scope.ts';
import Token, { GroupingOp } from './token.ts';
import Value, {
  Boolean,
  Function,
  Future,
  List,
  Matrix,
  None,
  Number,
  Range,
  String,
  Vector
} from './values/mod.ts';

import Position from './position.ts';

type NodeName =
  | 'AssignmentNode'
  | 'BinaryOpNode'
  | 'BooleanNode'
  | 'DeclarationNode'
  | 'ForNode'
  | 'FuncCallNode'
  | 'FuncDefNode'
  | 'GroupingNode'
  | 'IdentifierNode'
  | 'IfNode'
  | 'ListNode'
  | 'VecNode'
  | 'MatNode'
  | 'NumberNode'
  | 'ReturnNode'
  | 'AwaitNode'
  | 'StringNode'
  | 'UnaryOpNode'
  | 'WhileNode'
  | 'LoopNode'
  | 'PropAccessNode'
  | 'ImportNode';
type NodeIndex = `visit${NodeName}`;
type VisitFunc = (node: any, scope: Scope) => Promise<Value>;
type ExecuteIndex = {
  [index in NodeIndex]: VisitFunc;
};

export default class Interpreter implements ExecuteIndex {
  returnValue: Value | undefined;

  visit(node: Node, scope: Scope): Promise<Value> {
    const methodName = `visit${node.constructor.name}`;
    // @ts-ignore
    const method = this[methodName] as VisitFunc;
    return method.call(this, node, scope);
  }

  error(message: string, start: Position, end: Position): never {
    throw new Error(message, start, end);
  }

  async visitNumberNode(
    { token: { value } }: NumberNode,
    scope: Scope
  ): Promise<Number> {
    return new Number(value);
  }

  async visitBooleanNode(
    { token: { value } }: BooleanNode,
    scope: Scope
  ): Promise<Boolean> {
    return new Boolean(value);
  }

  async visitStringNode(
    { fragments }: StringNode,
    scope: Scope
  ): Promise<String> {
    return new String(
      fragments instanceof Token
        ? fragments.value
        : (
            await Promise.all(
              fragments.map(async fragment =>
                fragment instanceof Token
                  ? fragment.value
                  : await this.visit(fragment, scope)
              )
            )
          ).join('')
    );
  }

  async visitListNode({ nodes }: ListNode, scope: Scope): Promise<Value> {
    const items = [];
    for (const node of nodes) {
      let value = await this.visit(node, scope);
      if (this.returnValue) return this.returnValue;
      items.push(value);
    }
    return new List(items);
  }

  async visitVecNode({ nodes }: VecNode, scope: Scope): Promise<Vector> {
    const components: number[] = [];
    for (const node of nodes) {
      let value = await this.visit(node, scope);
      if (!(value instanceof Number)) throw `Vectors can only take numbers`;
      components.push(value.value);
    }
    return new Vector(components);
  }

  async visitMatNode({ nodes }: MatNode, scope: Scope): Promise<Matrix> {
    const data: number[][] = [];
    for (const nodeRow of nodes) {
      const row: number[] = [];
      for (const node of nodeRow) {
        const value = await this.visit(node, scope);
        if (!(value instanceof Number)) throw `Matrices can only take numbers`;
        row.push(value.value);
      }
      data.push(row);
    }
    return new Matrix(data);
  }

  async visitIdentifierNode(
    { token: { value: name, start, end } }: IdentifierNode,
    scope: Scope
  ): Promise<Value> {
    const value = scope.symbolTable.get(name);
    if (!value) this.error(`'${name}' is not defined`, start, end);
    return value;
  }

  async visitDeclarationNode(
    { identifier: { value: identifier }, node }: DeclarationNode,
    scope: Scope
  ): Promise<Value> {
    const value = await this.visit(node, scope);
    scope.symbolTable.add(identifier, value);
    return value;
  }

  async visitAssignmentNode(
    { identifier, operator: { value: operator }, node }: AssignmentNode,
    scope: Scope
  ): Promise<Value> {
    let returnValue: Value | undefined;
    const right = node ? await this.visit(node, scope) : undefined;
    if (operator === '=') {
      scope.symbolTable.set(identifier.value, right!);
      return right!;
    }

    const left = await this.visit(new IdentifierNode(identifier), scope);

    switch (operator) {
      case '+=': {
        const value = left['+'](right as unknown as Value) as unknown as Value;
        scope.symbolTable.set(identifier.value, value);
        break;
      }
      case '-=': {
        const value = left['-'](right as unknown as Value) as unknown as Value;
        scope.symbolTable.set(identifier.value, value);
        break;
      }
      case '++': {
        const value = left['+'](new Number(1)) as unknown as Value;
        scope.symbolTable.set(identifier.value, value);
        returnValue = left;
        break;
      }
      case '--': {
        const value = left['-'](new Number(1)) as unknown as Value;
        scope.symbolTable.set(identifier.value, value);
        returnValue = left;
        break;
      }
      case '*=': {
        const value = left['*'](right as unknown as Value) as unknown as Value;
        scope.symbolTable.set(identifier.value, value);
        break;
      }
      case '/=': {
        const value = left['/'](right as unknown as Value) as unknown as Value;
        scope.symbolTable.set(identifier.value, value);
        break;
      }
      case '%=': {
        const value = left['%'](right as unknown as Value) as unknown as Value;
        scope.symbolTable.set(identifier.value, value);
        break;
      }
      case '^=': {
        const value = left['^'](right as unknown as Value) as unknown as Value;
        scope.symbolTable.set(identifier.value, value);
      }
    }
    return (right || returnValue) as Value;
  }

  async visitUnaryOpNode(
    { node, operator: { value: operator } }: UnaryOpNode,
    scope: Scope
  ): Promise<Value> {
    const value = await this.visit(node, scope);

    const func = value[operator];
    if (!func) Value.illegalUnaryOp(value, operator);
    const returnValue = func.call(value) as Value | undefined;
    if (!returnValue) Value.illegalUnaryOp(value, operator);
    return returnValue;
  }

  async visitBinaryOpNode(
    { left, operator, right }: BinaryOpNode,
    scope: Scope
  ): Promise<Value> {
    const leftValue = await this.visit(left, scope);
    const rightValue = await this.visit(right, scope);

    const func = leftValue[operator];
    if (!func) Value.illegalBinaryOp(leftValue, operator, rightValue);
    const value = func.call(leftValue, rightValue) as Value | undefined;
    if (!value) Value.illegalBinaryOp(leftValue, operator, rightValue);
    return value;
  }

  async visitIfNode(
    { condition, body, elseCase }: IfNode,
    scope: Scope
  ): Promise<Value> {
    // @ts-ignore
    if (((await this.visit(condition, scope)) as Number | Boolean).value)
      return this.visit(body, scope);
    else if (elseCase) return this.visit(elseCase, scope);
    return new None();
  }

  async visitForNode(
    { identifier, iterable, body }: ForNode,
    scope: Scope
  ): Promise<None> {
    const iterableValue = await this.visit(iterable, scope);
    if (iterableValue instanceof List) {
      for (const item of iterableValue.items) {
        scope.symbolTable.set(identifier.value, item);
        await this.visit(body, scope);
        if (this.returnValue) break;
      }
    } else if (iterableValue instanceof Range) {
      const { from, to, step } = iterableValue;
      for (let i = from; i < to; i += step) {
        scope.symbolTable.set(identifier.value, new Number(i));
        await this.visit(body, scope);
        if (this.returnValue) break;
      }
    } else if (iterableValue instanceof Number) {
      for (let i = 0; i < iterableValue.value; i++) {
        scope.symbolTable.set(identifier.value, new Number(i));
        await this.visit(body, scope);
        if (this.returnValue) break;
      }
    }
    return new None();
  }

  async visitWhileNode(
    { condition, body }: WhileNode,
    scope: Scope
  ): Promise<None> {
    // @ts-ignore
    while (((await this.visit(condition, scope)) as Number | Boolean).value) {
      await this.visit(body, scope);
      if (this.returnValue) break;
    }

    return new None();
  }

  async visitLoopNode({ body }: LoopNode, scope: Scope): Promise<None> {
    while (1) {
      await this.visit(body, scope);
      if (this.returnValue) break;
    }
    return new None();
  }

  async visitFuncDefNode(
    { name: { value: name }, argNames, body }: FuncDefNode,
    scope: Scope
  ): Promise<Function> {
    const value = new Function(
      name,
      argNames.map(arg => arg.value),
      body
    ).setScope(scope);
    scope.symbolTable.set(name, value);
    return value;
  }

  async visitFuncCallNode(
    { name: { value: name, start, end }, args }: FuncCallNode,
    scope: Scope
  ): Promise<Value> {
    const func = scope.symbolTable.get(name) as
      | Function
      | ((...values: Value[]) => Value)
      | undefined;
    if (!func) this.error(`${name} is not a function`, start, end);
    const argValues = await Promise.all(
      args.map(arg => this.visit(arg, scope))
    );
    const value =
      func instanceof Function
        ? await func.execute(argValues)
        : func(...argValues);
    return value;
  }

  async visitReturnNode({ node }: ReturnNode, scope: Scope): Promise<Value> {
    const value = await this.visit(node, scope);
    this.returnValue = value;
    return value || new None();
  }

  async visitAwaitNode(
    { node, start, end }: AwaitNode,
    scope: Scope
  ): Promise<Value> {
    const future = await this.visit(node, scope);
    if (!(future instanceof Future))
      this.error('You can only await futures', start, end);
    const value: Value = await future.promise;
    return value;
  }

  async visitGroupingNode(
    { node, groupings: [left, right] }: GroupingNode,
    scope: Scope
  ): Promise<Value> {
    const value = await this.visit(node, scope);
    const operator = (left.value + right.value) as Exclude<GroupingOp, '[]'>;

    const func = value[operator];
    if (!func) Value.illegalUnaryOp(value, operator);
    const returnValue = func.call(value) as Value | undefined;
    if (!returnValue) Value.illegalUnaryOp(value, operator);
    return returnValue;
  }

  async visitPropAccessNode(
    { node, prop }: PropAccessNode,
    scope: Scope
  ): Promise<Value> {
    const value = await this.visit(node, scope);
    const propValue = await this.visit(prop, scope);
    return value['[]'](propValue) as unknown as Value;
  }

  async visitImportNode(
    { identifier: { value, start, end } }: ImportNode,
    scope: Scope
  ): Promise<Value> {
    try {
      const relUrl = `./modules/${value}/mod.ts`;
      const path = new URL(relUrl, import.meta.url).href;
      const mod = await import(path);
      Object.entries(mod).forEach(([name, value]) => {
        if (name === 'default')
          Object.entries(mod.default).forEach(([dname, dvalue]) =>
            scope.symbolTable.set(dname, dvalue as Value)
          );
        scope.symbolTable.set(name, value as Value);
      });
      return new Number(0);
    } catch {
      this.error(`Module ${value} doesn't exist`, start, end);
    }
  }
}

export class Error {
  constructor(
    readonly message: string,
    readonly start: Position,
    readonly end: Position
  ) {}
}

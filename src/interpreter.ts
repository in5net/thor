/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable @typescript-eslint/no-throw-literal */
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
} from './nodes';
import Token, { GroupingOp } from './token';
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
} from './values';
import { std, physics, fs } from './modules';

import type Scope from './scope';
import type Position from './position';

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

export class Error {
  constructor(
    readonly message: string,
    readonly start: Position,
    readonly end: Position
  ) {}
}

export default class Interpreter implements ExecuteIndex {
  returnValue?: Value;

  constructor(readonly stdout?: Buffer, readonly safe = false) {}

  visit(node: Node, scope: Scope): Promise<Value> {
    if (node instanceof NumberNode) return this.visitNumberNode(node, scope);
    if (node instanceof BooleanNode) return this.visitBooleanNode(node, scope);
    if (node instanceof StringNode) return this.visitStringNode(node, scope);
    if (node instanceof ListNode) return this.visitListNode(node, scope);
    if (node instanceof VecNode) return this.visitVecNode(node, scope);
    if (node instanceof MatNode) return this.visitMatNode(node, scope);
    if (node instanceof IdentifierNode)
      return this.visitIdentifierNode(node, scope);
    if (node instanceof DeclarationNode)
      return this.visitDeclarationNode(node, scope);
    if (node instanceof AssignmentNode)
      return this.visitAssignmentNode(node, scope);
    if (node instanceof UnaryOpNode) return this.visitUnaryOpNode(node, scope);
    if (node instanceof BinaryOpNode)
      return this.visitBinaryOpNode(node, scope);
    if (node instanceof IfNode) return this.visitIfNode(node, scope);
    if (node instanceof ForNode) return this.visitForNode(node, scope);
    if (node instanceof LoopNode) return this.visitLoopNode(node, scope);
    if (node instanceof WhileNode) return this.visitWhileNode(node, scope);
    if (node instanceof FuncDefNode) return this.visitFuncDefNode(node, scope);
    if (node instanceof FuncCallNode)
      return this.visitFuncCallNode(node, scope);
    if (node instanceof ReturnNode) return this.visitReturnNode(node, scope);
    if (node instanceof AwaitNode) return this.visitAwaitNode(node, scope);
    if (node instanceof GroupingNode)
      return this.visitGroupingNode(node, scope);
    if (node instanceof PropAccessNode)
      return this.visitPropAccessNode(node, scope);
    if (node instanceof ImportNode) return this.visitImportNode(node, scope);
    this.error(
      `Unknown node type: ${node.constructor.name}`,
      node.start,
      node.end
    );
  }

  error(message: string, start: Position, end: Position): never {
    throw new Error(message, start, end);
  }

  async visitNumberNode(
    { token: { value } }: NumberNode,
    _scope: Scope
  ): Promise<Number> {
    return new Number(value);
  }

  async visitBooleanNode(
    { token: { value } }: BooleanNode,
    _scope: Scope
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
                  : this.visit(fragment, scope)
              )
            )
          ).join('')
    );
  }

  async visitListNode({ nodes }: ListNode, scope: Scope): Promise<Value> {
    const items = [];
    for (const node of nodes) {
      const value = await this.visit(node, scope);
      if (this.returnValue) return this.returnValue;
      items.push(value);
    }
    return new List(items);
  }

  async visitVecNode({ nodes }: VecNode, scope: Scope): Promise<Vector> {
    const components: number[] = [];
    for (const node of nodes) {
      const value = await this.visit(node, scope);
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
        break;
      }
      default: {
        throw new Error(
          `Unknown operator ${operator}`,
          identifier.start,
          node!.end
        );
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
    if (elseCase) return this.visit(elseCase, scope);
    return None;
  }

  async visitForNode(
    { identifier, iterable, body }: ForNode,
    scope: Scope
  ): Promise<typeof None> {
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
    return None;
  }

  async visitWhileNode(
    { condition, body }: WhileNode,
    scope: Scope
  ): Promise<typeof None> {
    // @ts-ignore
    while (((await this.visit(condition, scope)) as Number | Boolean).value) {
      await this.visit(body, scope);
      if (this.returnValue) break;
    }

    return None;
  }

  async visitLoopNode({ body }: LoopNode, scope: Scope): Promise<typeof None> {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      await this.visit(body, scope);
      if (this.returnValue) break;
    }
    return None;
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
    const argValues = await Promise.all(
      args.map(arg => this.visit(arg, scope))
    );
    if (name === 'print') {
      const msg = `${argValues.map(value => value.toPrint()).join(' ')}\n`;
      if (this.stdout) this.stdout.write(msg);
      else console.log(msg);
      return None;
    }

    const func = scope.symbolTable.get(name) as
      | Function
      | ((...values: Value[]) => Value)
      | undefined;
    if (!func) this.error(`${name} is not a function`, start, end);

    const value =
      func instanceof Function
        ? await func.execute(argValues, this.safe)
        : func(...argValues);
    return value;
  }

  async visitReturnNode({ node }: ReturnNode, scope: Scope): Promise<Value> {
    const value = await this.visit(node, scope);
    this.returnValue = value;
    return value || None;
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
    let mod: any;
    switch (value) {
      case 'std':
        mod = std;
        break;
      case 'physics':
        mod = physics;
        break;
      case 'fs':
        if (this.safe)
          throw new Error(`Cannot import fs module in safe mode`, start, end);
        mod = fs;
        break;
      default:
        throw new Error(`Unknown module: ${value}`, start, end);
    }
    Object.entries(mod).forEach(([name, value]) => {
      if (name === 'default')
        Object.entries(mod.default).forEach(([dname, dvalue]) =>
          scope.symbolTable.set(dname, dvalue as Value)
        );
      scope.symbolTable.set(name, value as Value);
    });
    return None;
  }
}

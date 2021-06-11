import Node, {
  AssignmentNode,
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
import { GroupingOp } from './token.ts';
import Value, {
  Boolean,
  Function,
  List,
  Matrix,
  Number,
  Range,
  String,
  Vector
} from './values/mod.ts';

import * as std from './modules/std/mod.ts';
import * as physics from './modules/physics/mod.ts';

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
  | 'StringNode'
  | 'UnaryOpNode'
  | 'WhileNode'
  | 'LoopNode'
  | 'PropAccessNode'
  | 'ImportNode';
type NodeIndex = `visit${NodeName}`;
type ExecuteIndex = {
  [index in NodeIndex]: (node: any, scope: Scope) => Value | void;
};

export default class Interpreter implements ExecuteIndex {
  returnValue: Value | undefined;

  visit(node: Node, scope: Scope): Value {
    const methodName = `visit${node.constructor.name}`;
    // @ts-ignore
    const method = this[methodName] as (node: Node, scope: Scope) => Value;
    return method.call(this, node, scope);
  }

  error(message: string): never {
    throw `Error: ${message}`;
  }

  visitNumberNode({ value }: NumberNode, scope: Scope): Number {
    return new Number(value);
  }

  visitBooleanNode({ value }: BooleanNode, scope: Scope): Boolean {
    return new Boolean(value);
  }

  visitStringNode({ fragments }: StringNode, scope: Scope): String {
    return new String(
      fragments
        .map(x => (typeof x === 'string' ? x : this.visit(x, scope)))
        .join('')
    );
  }

  visitListNode({ nodes }: ListNode, scope: Scope): Value {
    const items = [];
    for (const node of nodes) {
      let value = this.visit(node, scope);
      if (this.returnValue) return this.returnValue;
      items.push(value);
    }
    return new List(items);
  }

  visitVecNode({ nodes }: VecNode, scope: Scope): Vector {
    const components: number[] = [];
    for (const node of nodes) {
      let value = this.visit(node, scope);
      if (!(value instanceof Number)) throw `Vectors can only take numbers`;
      components.push(value.value);
    }
    return new Vector(components);
  }

  visitMatNode({ nodes }: MatNode, scope: Scope): Matrix {
    const data: number[][] = [];
    for (const nodeRow of nodes) {
      const row: number[] = [];
      for (const node of nodeRow) {
        let value = this.visit(node, scope);
        if (!(value instanceof Number)) throw `Matrices can only take numbers`;
        row.push(value.value);
      }
      data.push(row);
    }
    return new Matrix(data);
  }

  visitIdentifierNode({ name }: IdentifierNode, scope: Scope): Value {
    const value = scope.symbolTable.get(name);
    if (!value) this.error(`'${name}' is not defined`);
    return value;
  }

  visitDeclarationNode(
    { identifier, node }: DeclarationNode,
    scope: Scope
  ): Value {
    const value = this.visit(node, scope);
    scope.symbolTable.add(identifier, value);
    return value;
  }

  visitAssignmentNode(
    { identifier, operator, node }: AssignmentNode,
    scope: Scope
  ): Value {
    let returnValue: Value | undefined;
    const right = node ? this.visit(node, scope) : undefined;
    if (operator === '=') {
      scope.symbolTable.set(identifier, right!);
      return right!;
    }

    const left = this.visit(new IdentifierNode(identifier), scope);

    switch (operator) {
      case '+=': {
        const value = left['+'](right as unknown as Value) as unknown as Value;
        scope.symbolTable.set(identifier, value);
        break;
      }
      case '-=': {
        const value = left['-'](right as unknown as Value) as unknown as Value;
        scope.symbolTable.set(identifier, value);
        break;
      }
      case '++': {
        const value = left['+'](new Number(1)) as unknown as Value;
        scope.symbolTable.set(identifier, value);
        returnValue = left;
        break;
      }
      case '--': {
        const value = left['-'](new Number(1)) as unknown as Value;
        scope.symbolTable.set(identifier, value);
        returnValue = left;
        break;
      }
      case '*=': {
        const value = left['*'](right as unknown as Value) as unknown as Value;
        scope.symbolTable.set(identifier, value);
        break;
      }
      case '/=': {
        const value = left['/'](right as unknown as Value) as unknown as Value;
        scope.symbolTable.set(identifier, value);
        break;
      }
      case '%=': {
        const value = left['%'](right as unknown as Value) as unknown as Value;
        scope.symbolTable.set(identifier, value);
        break;
      }
      case '^=': {
        const value = left['^'](right as unknown as Value) as unknown as Value;
        scope.symbolTable.set(identifier, value);
      }
    }
    return (right || returnValue) as Value;
  }

  visitUnaryOpNode({ node, operator }: UnaryOpNode, scope: Scope): Value {
    const value = this.visit(node, scope);

    const func = value[operator];
    if (!func) Value.illegalUnaryOp(value, operator);
    const returnValue = func.call(value) as Value | undefined;
    if (!returnValue) Value.illegalUnaryOp(value, operator);
    return returnValue;
  }

  visitBinaryOpNode(
    { left, operator, right }: BinaryOpNode,
    scope: Scope
  ): Value {
    const leftValue = this.visit(left, scope);
    const rightValue = this.visit(right, scope);

    const func = leftValue[operator];
    if (!func) Value.illegalBinaryOp(leftValue, operator, rightValue);
    const value = func.call(leftValue, rightValue) as Value | undefined;
    if (!value) Value.illegalBinaryOp(leftValue, operator, rightValue);
    return value;
  }

  visitIfNode({ condition, body, elseCase }: IfNode, scope: Scope) {
    // @ts-ignore
    if ((this.visit(condition, scope) as Number | Boolean).value)
      this.visit(body, scope);
    else if (elseCase) this.visit(elseCase, scope);
  }

  visitForNode({ identifier, iterable, body }: ForNode, scope: Scope) {
    const iterableValue = this.visit(iterable, scope);
    if (iterableValue instanceof List) {
      for (const item of iterableValue.items) {
        scope.symbolTable.set(identifier, item);
        this.visit(body, scope);
      }
    } else if (iterableValue instanceof Range) {
      const { from, to, step } = iterableValue;
      for (let i = from; i < to; i += step) {
        scope.symbolTable.set(identifier, new Number(i));
        this.visit(body, scope);
      }
    }
  }

  visitWhileNode({ condition, body }: WhileNode, scope: Scope) {
    // @ts-ignore
    while ((this.visit(condition, scope) as Number | Boolean).value)
      this.visit(body, scope);
  }

  visitLoopNode({ body }: LoopNode, scope: Scope) {
    while (1) this.visit(body, scope);
  }

  visitFuncDefNode(
    { name, argNames, body }: FuncDefNode,
    scope: Scope
  ): Function {
    const value = new Function(name, argNames, body).setScope(scope);
    scope.symbolTable.set(name, value);
    return value;
  }

  visitFuncCallNode({ name, args }: FuncCallNode, scope: Scope): Value {
    const func = scope.symbolTable.get(name) as
      | Function
      | ((...values: Value[]) => Value);
    const argValues = args.map(arg => this.visit(arg, scope));
    const value =
      func instanceof Function ? func.execute(argValues) : func(...argValues);
    return value;
  }

  visitReturnNode({ node }: ReturnNode, scope: Scope): Value {
    const value = this.visit(node, scope);
    this.returnValue = value;
    return value ?? new Number(0);
  }

  visitGroupingNode(
    { node, groupings: [left, right] }: GroupingNode,
    scope: Scope
  ): Value {
    const value = this.visit(node, scope);
    const operator = (left + right) as Exclude<GroupingOp, '[]'>;

    const func = value[operator];
    if (!func) Value.illegalUnaryOp(value, operator);
    const returnValue = func.call(value) as Value | undefined;
    if (!returnValue) Value.illegalUnaryOp(value, operator);
    return returnValue;
  }

  visitPropAccessNode({ node, prop }: PropAccessNode, scope: Scope): Value {
    const value = this.visit(node, scope);
    const propValue = this.visit(prop, scope);
    return value['[]'](propValue) as unknown as Value;
  }

  visitImportNode({ identifier }: ImportNode, scope: Scope): Value {
    let mod: any;
    switch (identifier) {
      case 'std':
        mod = std;
        break;
      case 'physics':
        mod = physics;
        break;
    }
    Object.entries(mod).forEach(([name, value]) => {
      if (name === 'default')
        Object.entries(mod.default).forEach(([dname, dvalue]) =>
          scope.symbolTable.set(dname, dvalue as Value)
        );
      scope.symbolTable.set(name, value as Value);
    });
    return new Number(0);
  }
}

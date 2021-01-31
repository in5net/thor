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
  NumberNode,
  ReturnNode,
  StringNode,
  UnaryOpNode,
  WhileNode
} from './nodes.ts';
import Scope from './scope.ts';
import { GroupingOp } from './token.ts';
import Value, {
  Boolean,
  Function,
  List,
  Number,
  Range,
  String
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
  | 'NumberNode'
  | 'ReturnNode'
  | 'StringNode'
  | 'UnaryOpNode'
  | 'WhileNode'
  | 'ImportNode';
type NodeIndex = `visit_${NodeName}`;
type ExecuteIndex = {
  [index in NodeIndex]: (node: any, scope: Scope) => Value | void;
};

export default class Interpreter implements ExecuteIndex {
  visit(node: Node, scope: Scope): Value {
    const methodName = `visit_${node.constructor.name}`;
    // @ts-ignore
    const method = this[methodName] as (node: Node, scope: Scope) => Value;
    return method.call(this, node, scope);
  }

  error(message: string): never {
    throw `Error: ${message}`;
  }

  visit_NumberNode({ value }: NumberNode, scope: Scope): Number {
    return new Number(value);
  }

  visit_BooleanNode({ value }: BooleanNode, scope: Scope): Boolean {
    return new Boolean(value);
  }

  visit_StringNode({ fragments }: StringNode, scope: Scope): String {
    return new String(
      fragments
        .map(x => (typeof x === 'string' ? x : this.visit(x, scope)))
        .join('')
    );
  }

  visit_ListNode({ nodes }: ListNode, scope: Scope): Value {
    const items = [];
    for (const node of nodes) {
      let value = this.visit(node, scope);
      if (node instanceof ReturnNode) return value;
      items.push(value);
    }
    return new List(items);
  }

  visit_IdentifierNode({ name }: IdentifierNode, scope: Scope): Value {
    const value = scope.symbolTable.get(name);
    if (!value) this.error(`'${name}' is not defined`);
    return value;
  }

  visit_DeclarationNode(
    { identifier, node }: DeclarationNode,
    scope: Scope
  ): Value {
    const value = this.visit(node, scope);
    scope.symbolTable.add(identifier.value, value);
    return value;
  }

  visit_AssignmentNode(
    { identifier, operator, node }: AssignmentNode,
    scope: Scope
  ): Value {
    let returnValue: Value | undefined;
    const right = node ? this.visit(node, scope) : undefined;
    if (operator === '=') {
      scope.symbolTable.set(identifier.value, right!);
      return right!;
    }

    const left = this.visit(new IdentifierNode(identifier.value), scope);

    switch (operator) {
      case '+=': {
        const value = (left['+'](
          (right as unknown) as Value
        ) as unknown) as Value;
        scope.symbolTable.set(identifier.value, value);
        break;
      }
      case '-=': {
        const value = (left['-'](
          (right as unknown) as Value
        ) as unknown) as Value;
        scope.symbolTable.set(identifier.value, value);
        break;
      }
      case '++': {
        const value = (left['+'](new Number(1)) as unknown) as Value;
        scope.symbolTable.set(identifier.value, value);
        returnValue = left;
        break;
      }
      case '--': {
        const value = (left['-'](new Number(1)) as unknown) as Value;
        scope.symbolTable.set(identifier.value, value);
        returnValue = left;
        break;
      }
      case '*=': {
        const value = (left['*'](
          (right as unknown) as Value
        ) as unknown) as Value;
        scope.symbolTable.set(identifier.value, value);
        break;
      }
      case '/=': {
        const value = (left['/'](
          (right as unknown) as Value
        ) as unknown) as Value;
        scope.symbolTable.set(identifier.value, value);
        break;
      }
      case '%=': {
        const value = (left['%'](
          (right as unknown) as Value
        ) as unknown) as Value;
        scope.symbolTable.set(identifier.value, value);
        break;
      }
      case '^=': {
        const value = (left['^'](
          (right as unknown) as Value
        ) as unknown) as Value;
        scope.symbolTable.set(identifier.value, value);
      }
    }
    return (right || returnValue) as Value;
  }

  visit_UnaryOpNode({ node, operator }: UnaryOpNode, scope: Scope): Value {
    const value = this.visit(node, scope);

    const func = value[operator];
    if (!func) Value.illegalUnaryOp(value, operator);
    const returnValue = func.call(value) as Value | undefined;
    if (!returnValue) Value.illegalUnaryOp(value, operator);
    return returnValue;
  }

  visit_BinaryOpNode(
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

  visit_IfNode({ condition, body, elseCase }: IfNode, scope: Scope) {
    // @ts-ignore
    if ((this.visit(condition, scope) as Number | Boolean).value)
      this.visit(body, scope);
    else if (elseCase) this.visit(elseCase, scope);
  }

  visit_ForNode({ identifier, iterable, body }: ForNode, scope: Scope) {
    const iterableValue = this.visit(iterable, scope);
    if (iterableValue instanceof List) {
      for (const item of iterableValue.items) {
        scope.symbolTable.set(identifier.value, item);
        this.visit(body, scope);
      }
    } else if (iterableValue instanceof Range) {
      const { from, to, step } = iterableValue;
      for (let i = from; i < to; i += step) {
        scope.symbolTable.set(identifier.value, new Number(i));
        this.visit(body, scope);
      }
    }
  }

  visit_WhileNode({ condition, body }: WhileNode, scope: Scope) {
    // @ts-ignore
    while ((this.visit(condition, scope) as Number | Boolean).value)
      this.visit(body, scope);
  }

  visit_FuncDefNode(
    { name, argNames, body }: FuncDefNode,
    scope: Scope
  ): Function {
    const value = new Function(name, argNames, body).setScope(scope);
    scope.symbolTable.set(name, value);
    return value;
  }

  visit_FuncCallNode({ name, args }: FuncCallNode, scope: Scope): Value {
    const func = scope.symbolTable.get(name) as
      | Function
      | ((values: Value[]) => Value);
    const argValues = args.map(arg => this.visit(arg, scope));
    const value =
      func instanceof Function ? func.execute(argValues) : func(argValues);
    return value;
  }

  visit_ReturnNode({ node }: ReturnNode, scope: Scope): Value {
    const value = this.visit(node, scope);
    return value ?? new Number(0);
  }

  visit_GroupingNode(
    { node, groupings: [left, right] }: GroupingNode,
    scope: Scope
  ): Value {
    const value = this.visit(node, scope);
    const operator = (left + right) as GroupingOp;

    const func = value[operator];
    if (!func) Value.illegalUnaryOp(value, operator);
    const returnValue = func.call(value) as Value | undefined;
    if (!returnValue) Value.illegalUnaryOp(value, operator);
    return returnValue;
  }

  visit_ImportNode({ identifier: { value } }: ImportNode, scope: Scope): Value {
    let mod: any;
    switch (value) {
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

import Node, {
  AbsNode,
  AssignmentNode,
  BinaryOpNode,
  BooleanNode,
  FuncCallNode,
  FuncDefNode,
  IdentifierNode,
  IfNode,
  NumberNode,
  ReturnNode,
  StatementsNode,
  StringNode,
  UnaryOpNode,
} from './nodes.ts';
import Value, {
  Boolean,
  BuiltInFunction,
  Function,
  Number,
  String,
} from './values.ts';
import Scope from './scope.ts';

export default class Interpreter {
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

  visit_StringNode({ value }: StringNode, scope: Scope): String {
    return new String(value);
  }

  visit_StatementsNode({ nodes }: StatementsNode, scope: Scope): Value {
    for (const node of nodes) {
      const value = this.visit(node, scope);
      if (node instanceof ReturnNode) return value;
    }
    return new Number(0);
  }

  visit_IdentifierNode({ name }: IdentifierNode, scope: Scope): Value {
    const value = scope.symbolTable.get(name);
    if (!value) this.error(`${name} is not defined`);
    return value;
  }

  visit_AssignmentNode(
    { identifier, node }: AssignmentNode,
    scope: Scope
  ): Value {
    const value = this.visit(node, scope);
    scope.symbolTable.set(identifier, value);
    return value;
  }

  visit_UnaryOpNode({ node, operator }: UnaryOpNode, scope: Scope): Value {
    let value = this.visit(node, scope);
    // @ts-ignore
    return value[operator]();
  }

  visit_BinaryOpNode(
    { left, operator, right }: BinaryOpNode,
    scope: Scope
  ): Value {
    const leftValue = this.visit(left, scope);
    const rightValue = this.visit(right, scope);
    // @ts-ignore
    return leftValue[operator](rightValue);
  }

  visit_AbsNode({ node }: AbsNode, scope: Scope): Value {
    const value = this.visit(node, scope);
    // @ts-ignore
    return value['||']();
  }

  visit_IfNode({ condition, body, elseCase }: IfNode, scope: Scope) {
    // @ts-ignore
    if ((this.visit(condition, scope) as NumberNode | BooleanNode).value)
      this.visit(body, scope);
    else if (elseCase) this.visit(elseCase, scope);
  }

  visit_FuncDefNode(
    { name, argNames, body }: FuncDefNode,
    scope: Scope
  ): Function {
    const value = new Function(name, argNames, body);
    scope.symbolTable.set(name, value);
    return value;
  }

  visit_FuncCallNode({ name, args }: FuncCallNode, scope: Scope): Value {
    const func = scope.symbolTable.get(name) as Function | BuiltInFunction;
    const argValues = args.map(arg => this.visit(arg, scope));
    const value = func.execute(argValues);
    return value;
  }

  visit_ReturnNode({ node }: ReturnNode, scope: Scope): Value {
    const value = this.visit(node, scope);
    return value ?? new Number(0);
  }
}

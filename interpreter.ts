import Node, { BinaryOpNode, NumberNode, UnaryOpNode } from './nodes.ts';
import { Number } from './values.ts';

export default class Interpreter {
  visit(node: Node): Number {
    const methodName = `visit_${node.constructor.name}`;
    // @ts-ignore
    const method = this[methodName] as (node: Node) => NumberNode;
    return method.call(this, node);
  }

  visit_NumberNode({ value }: NumberNode) {
    return new Number(value);
  }

  visit_UnaryOpNode({ node, operator }: UnaryOpNode) {
    let value = this.visit(node).value;
    if (operator === '-') value *= -1;
    return new Number(value);
  }

  visit_BinaryOpNode({ left, operator, right }: BinaryOpNode) {
    const leftValue = this.visit(left).value;
    const rightValue = this.visit(right).value;
    let value: number;
    switch (operator) {
      case '+':
        value = leftValue + rightValue;
        break;
      case '-':
        value = leftValue - rightValue;
        break;
      case '*':
        value = leftValue * rightValue;
        break;
      case '/':
        value = leftValue / rightValue;
        break;
      case '^':
        value = leftValue ** rightValue;
    }
    return new Number(value);
  }
}

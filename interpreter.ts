import Node, {
  AssignmentNode,
  BinaryOpNode,
  IdentifierNode,
  NumberNode,
  UnaryOpNode,
} from './nodes.ts';
import { Number } from './values.ts';

const identifiers = new Map<string, number>();

export default class Interpreter {
  visit(node: Node): Number {
    const methodName = `visit_${node.constructor.name}`;
    // @ts-ignore
    const method = this[methodName] as (node: Node) => NumberNode;
    return method.call(this, node);
  }

  visit_NumberNode({ value }: NumberNode): Number {
    return new Number(value);
  }

  visit_IdentifierNode({ name }: IdentifierNode): Number {
    const value = identifiers.get(name);
    return new Number(value !== undefined ? value : NaN);
  }

  visit_AssignmentNode({ identifier, node }: AssignmentNode): Number {
    const { value } = this.visit(node);
    identifiers.set(identifier, value);
    return new Number(value);
  }

  visit_UnaryOpNode({ node, operator }: UnaryOpNode): Number {
    let value = this.visit(node).value;
    if (operator === '-') value *= -1;
    return new Number(value);
  }

  visit_BinaryOpNode({ left, operator, right }: BinaryOpNode): Number {
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
        break;
      default:
        value = 0;
    }
    return new Number(value);
  }
}

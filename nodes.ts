import Token, {
  BinaryOp,
  LeftGrouping,
  RightGrouping,
  UnaryOp
} from './token.ts';

export default abstract class Node {
  abstract toString(): string;
}

export class NumberNode implements Node {
  constructor(public value: number) {}

  toString() {
    return this.value.toString();
  }
}

export class BooleanNode implements Node {
  constructor(public value: boolean) {}

  toString() {
    return this.value.toString();
  }
}

export class StringNode implements Node {
  constructor(public value: string) {}

  toString() {
    return `"${this.value}"`;
  }
}

export class ListNode implements Node {
  constructor(public nodes: Node[]) {}

  toString() {
    return `[
  ${this.nodes.join(',\n  ')}
]`;
  }
}

// TODO: make an IdentifierOpNode for 'let', '=', '+=', '-=', '++', ...
export class IdentifierNode implements Node {
  constructor(public name: string) {}

  toString() {
    return this.name;
  }
}

export class DeclarationNode implements Node {
  constructor(public identifier: Token<'identifier'>, public node: Node) {}

  toString() {
    return `(let ${this.identifier.value} = ${this.node})`;
  }
}

export class AssignmentNode implements Node {
  constructor(public identifier: Token<'identifier'>, public node: Node) {}

  toString() {
    return `(${this.identifier.value} = ${this.node})`;
  }
}

export class UnaryOpNode implements Node {
  constructor(public node: Node, public operator: UnaryOp) {}

  toString() {
    return `(${this.operator}${this.node})`;
  }
}

export class BinaryOpNode implements Node {
  constructor(
    public left: Node,
    public operator: BinaryOp,
    public right: Node
  ) {}

  toString() {
    return `(${this.left} ${this.operator} ${this.right})`;
  }
}

export class IfNode implements Node {
  constructor(
    public condition: Node,
    public body: Node,
    public elseCase?: Node
  ) {}

  toString() {
    return `(if ${this.condition}: ${this.body}${
      this.elseCase
        ? `
else: ${this.elseCase}`
        : ''
    })`;
  }
}

export class ForNode implements Node {
  constructor(
    public identifier: Token<'identifier'>,
    public iterable: Node,
    public body: Node
  ) {}

  toString() {
    return `(for ${this.identifier.value} in ${this.iterable}: ${this.body})`;
  }
}

export class WhileNode implements Node {
  constructor(public condition: Node, public body: Node) {}

  toString() {
    return `(while ${this.condition}: ${this.body})`;
  }
}

export class FuncDefNode implements Node {
  constructor(
    public name: string,
    public argNames: string[],
    public body: Node,
    public arrow = false
  ) {}

  toString() {
    return `(fn ${this.name}(${this.argNames.join(', ')})${
      this.arrow ? ' ->' : ':'
    } ${this.body})`;
  }
}

export class FuncCallNode implements Node {
  constructor(public name: string, public args: Node[]) {}

  toString() {
    return `(${this.name}(${this.args.join(', ')}))`;
  }
}

export class ReturnNode implements Node {
  constructor(public node: Node) {}

  toString() {
    return `(return ${this.node})`;
  }
}

export class GroupingNode implements Node {
  constructor(
    public node: Node,
    public groupings: [LeftGrouping, RightGrouping]
  ) {}

  toString() {
    const [l, r] = this.groupings;
    return `${l}${this.node}${r}`;
  }
}

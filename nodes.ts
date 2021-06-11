import {
  cyan,
  green,
  magenta,
  rgb24,
  white,
  yellow
} from 'https://deno.land/std@0.83.0/fmt/colors.ts';
import {
  BinaryOp,
  IdentifierOp,
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
    return rgb24(this.value.toString(), 0xffa01c);
  }
}

export class BooleanNode implements Node {
  constructor(public value: boolean) {}

  toString() {
    return this.value.toString();
  }
}

export class StringNode implements Node {
  constructor(public fragments: (string | Node)[]) {}

  toString() {
    return green(
      `"${this.fragments
        .map(x => (typeof x === 'string' ? x : white(`{${x}}`)))
        .join('')}"`
    );
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

export class VecNode implements Node {
  constructor(public nodes: Node[]) {}

  toString() {
    return `⟨${this.nodes.join(', ')}⟩`;
  }
}

export class MatNode implements Node {
  constructor(public nodes: Node[][]) {}

  toString() {
    return `mat`;
  }
}

export class IdentifierNode implements Node {
  constructor(public name: string) {}

  toString() {
    return magenta(this.name);
  }
}

export class DeclarationNode implements Node {
  constructor(public identifier: string, public node: Node) {}

  toString() {
    return `(${yellow('let')} ${magenta(this.identifier)} = ${this.node})`;
  }
}

export class AssignmentNode implements Node {
  constructor(
    public identifier: string,
    public operator: IdentifierOp,
    public node?: Node
  ) {}

  toString() {
    if (this.node)
      return `(${magenta(this.identifier)} ${this.operator} ${this.node})`;
    return `(${magenta(this.identifier)}${this.operator})`;
  }
}

export class UnaryOpNode implements Node {
  constructor(
    public node: Node,
    public operator: UnaryOp,
    public postfix = false
  ) {}

  toString() {
    const operatorStr = yellow(this.operator);
    if (this.postfix) return `(${this.node}${operatorStr})`;
    return `(${operatorStr}${this.node})`;
  }
}

export class BinaryOpNode implements Node {
  constructor(
    public left: Node,
    public operator: BinaryOp,
    public right: Node
  ) {}

  toString() {
    return `(${this.left} ${yellow(this.operator)} ${this.right})`;
  }
}

export class IfNode implements Node {
  constructor(
    public condition: Node,
    public body: Node,
    public elseCase?: Node
  ) {}

  toString() {
    return `(${yellow('if')} ${this.condition}: ${this.body}${
      this.elseCase
        ? `
${yellow('else')}: ${this.elseCase}`
        : ''
    })`;
  }
}

export class ForNode implements Node {
  constructor(
    public identifier: string,
    public iterable: Node,
    public body: Node
  ) {}

  toString() {
    return `(${yellow('for')} ${magenta(this.identifier)} ${yellow('in')} ${
      this.iterable
    }: ${this.body})`;
  }
}

export class WhileNode implements Node {
  constructor(public condition: Node, public body: Node) {}

  toString() {
    return `(${yellow('while')} ${this.condition}: ${this.body})`;
  }
}

export class LoopNode implements Node {
  constructor(public body: Node) {}

  toString() {
    return `(${yellow('loop')}: ${this.body})`;
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
    return `(${yellow('fn')} ${cyan(this.name)}(${this.argNames
      .map(magenta)
      .join(', ')})${this.arrow ? ' ->' : ':'} ${this.body})`;
  }
}

export class FuncCallNode implements Node {
  constructor(public name: string, public args: Node[]) {}

  toString() {
    return `(${cyan(this.name)}(${this.args.join(', ')}))`;
  }
}

export class ReturnNode implements Node {
  constructor(public node: Node) {}

  toString() {
    return `(${yellow('return')} ${this.node})`;
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

export class PropAccessNode implements Node {
  constructor(public node: Node, public prop: Node) {}

  toString() {
    return `${this.node}[${this.prop}]`;
  }
}

export class ImportNode implements Node {
  constructor(public identifier: string) {}

  toString() {
    return `(${yellow('import')} ${this.identifier})`;
  }
}

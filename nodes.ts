import {
  cyan,
  green,
  magenta,
  rgb24,
  white,
  yellow
} from 'https://deno.land/std@0.106.0/fmt/colors.ts';
import Position from './position.ts';
import Token, {
  BinaryOp,
  IdentifierOp,
  LeftGrouping,
  RightGrouping,
  UnaryOp
} from './token.ts';

export default abstract class Node {
  constructor(readonly start: Position, readonly end: Position) {}

  abstract toString(): string;
}

export class NumberNode extends Node {
  constructor(readonly token: Token<'number'>) {
    super(token.start, token.end);
  }

  toString() {
    return rgb24(this.token.value.toString(), 0xffa01c);
  }
}

export class BooleanNode extends Node {
  constructor(readonly token: Token<'boolean'>) {
    super(token.start, token.end);
  }

  toString() {
    return rgb24(this.token.value.toString(), 0xffff00);
  }
}

export class StringNode extends Node {
  constructor(
    readonly fragments:
      | Token<'string', string>
      | (Token<'string', string> | Node)[]
  ) {
    super(
      (fragments instanceof Token ? fragments : fragments[0]).start,
      (fragments instanceof Token ? fragments : fragments[fragments.length - 1])
        .end
    );
  }

  toString() {
    const { fragments } = this;
    return green(
      `"${
        fragments instanceof Token
          ? fragments.value
          : fragments
              .map(fragment =>
                fragment instanceof Token
                  ? fragment.value
                  : white(`{${fragment}}`)
              )
              .join('')
      }"`
    );
  }
}

export class MapNode extends Node {
  constructor(
    readonly fields: [Token<'identifier'>, Node][],
    start: Position,
    end: Position
  ) {
    super(start, end);
  }

  toString() {
    return white(`{
  ${this.fields.map(([key, value]) => `${key.value}: ${value}`).join(`,
  `)}
}`);
  }
}

export class AwaitNode extends Node {
  constructor(readonly node: Node, start: Position) {
    super(start, node.end);
  }

  toString() {
    return `(await ${this.node})`;
  }
}

export class ListNode extends Node {
  constructor(readonly nodes: Node[], start: Position, end: Position) {
    super(start, end);
  }

  toString() {
    return `[
  ${this.nodes.join(',\n  ')}
]`;
  }
}

export class VecNode extends Node {
  constructor(readonly nodes: Node[], start: Position, end: Position) {
    super(start, end);
  }

  toString() {
    return `⟨${this.nodes.join(', ')}⟩`;
  }
}

export class MatNode extends Node {
  constructor(readonly nodes: Node[][], start: Position, end: Position) {
    super(start, end);
  }

  toString() {
    return `mat`;
  }
}

export class IdentifierNode extends Node {
  constructor(readonly token: Token<'identifier'>) {
    super(token.start, token.end);
  }

  toString() {
    return magenta(this.token.value);
  }
}

export class DeclarationNode extends Node {
  constructor(
    readonly identifier: Token<'identifier'>,
    readonly node: Node,
    start: Position
  ) {
    super(start, node.end);
  }

  toString() {
    return `(${yellow('let')} ${magenta(this.identifier.value)} = ${
      this.node
    })`;
  }
}

export class AssignmentNode extends Node {
  constructor(
    readonly identifier: Token<'identifier'>,
    readonly operator: Token<'operator', IdentifierOp>,
    readonly node?: Node
  ) {
    super(identifier.start, node?.end || operator.end);
  }

  toString() {
    if (this.node)
      return `(${magenta(this.identifier.value)} ${this.operator.value} ${
        this.node
      })`;
    return `(${magenta(this.identifier.value)}${this.operator.value})`;
  }
}

export class UnaryOpNode extends Node {
  constructor(
    readonly node: Node,
    readonly operator: Token<'operator', UnaryOp>,
    readonly postfix = false
  ) {
    super(node.start, operator.end);
  }

  toString() {
    const operatorStr = yellow(this.operator.value);
    if (this.postfix) return `(${this.node}${operatorStr})`;
    return `(${operatorStr}${this.node})`;
  }
}

export class BinaryOpNode extends Node {
  constructor(
    readonly left: Node,
    readonly operator: BinaryOp,
    readonly right: Node
  ) {
    super(left.start, right.end);
  }

  toString() {
    return `(${this.left} ${yellow(this.operator)} ${this.right})`;
  }
}

export class IfNode extends Node {
  constructor(
    readonly condition: Node,
    readonly body: Node,
    start: Position,
    readonly elseCase?: Node
  ) {
    super(start, body.end);
  }

  toString() {
    return `(${yellow('if')} ${this.condition}: ${this.body}${
      this.elseCase
        ? `
${yellow('else')}: ${this.elseCase}`
        : ''
    })`;
  }
}

export class ForNode extends Node {
  constructor(
    readonly identifier: Token<'identifier'>,
    readonly iterable: Node,
    readonly body: Node,
    start: Position
  ) {
    super(start, body.end);
  }

  toString() {
    return `(${yellow('for')} ${magenta(this.identifier.value)} ${yellow(
      'in'
    )} ${this.iterable}: ${this.body})`;
  }
}

export class WhileNode extends Node {
  constructor(readonly condition: Node, readonly body: Node, start: Position) {
    super(start, body.end);
  }

  toString() {
    return `(${yellow('while')} ${this.condition}: ${this.body})`;
  }
}

export class LoopNode extends Node {
  constructor(readonly body: Node, start: Position) {
    super(start, body.end);
  }

  toString() {
    return `(${yellow('loop')}: ${this.body})`;
  }
}

export class FuncDefNode extends Node {
  constructor(
    readonly argNames: Token<'identifier'>[],
    readonly body: Node,
    start: Position,
    readonly name?: Token<'identifier'>,
    readonly arrow = false
  ) {
    super(start, body.end);
  }

  toString() {
    return `(${yellow('fn')} ${
      this.name ? cyan(this.name.value) : ''
    }(${this.argNames.map(node => magenta(node.value)).join(', ')})${
      this.arrow ? ' ->' : ':'
    } ${this.body})`;
  }
}

export class FuncCallNode extends Node {
  constructor(
    readonly name: Token<'identifier'>,
    readonly args: Node[],
    end: Position
  ) {
    super(name.start, end);
  }

  toString() {
    return `(${cyan(this.name.value)}(${this.args.join(', ')}))`;
  }
}

export class ReturnNode extends Node {
  constructor(readonly node: Node, start: Position) {
    super(start, node.end);
  }

  toString() {
    return `(${yellow('return')} ${this.node})`;
  }
}

export class GroupingNode extends Node {
  constructor(
    readonly node: Node,
    readonly groupings: [
      Token<'grouping', LeftGrouping>,
      Token<'grouping', RightGrouping>
    ]
  ) {
    super(groupings[0].start, groupings[1].end);
  }

  toString() {
    const [l, r] = this.groupings;
    return `${l}${this.node}${r}`;
  }
}

export class PropAccessNode extends Node {
  constructor(readonly node: Node, readonly prop: Node, end: Position) {
    super(node.start, end);
  }

  toString() {
    return `(${this.node}[${this.prop}])`;
  }
}

export class ImportNode extends Node {
  constructor(readonly identifier: Token<'identifier'>, start: Position) {
    super(start, identifier.end);
  }

  toString() {
    return `(${yellow('import')} ${this.identifier.value})`;
  }
}

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
  ListNode,
  NumberNode,
  ReturnNode,
  StringNode,
  UnaryOpNode,
  WhileNode
} from './nodes.ts';
import Token, {
  BinaryOp,
  compareOps,
  groupings,
  LeftGrouping,
  UnaryOp,
  unaryOps
} from './token.ts';

const SYMBOL_COMPARE_OPS = compareOps.filter(op => !['and', 'or'].includes(op));
const WORD_COMPARE_OPS = compareOps.filter(op => ['and', 'or'].includes(op));

export default class Parser {
  index = -1;
  token!: Token;

  constructor(private tokens: Token[]) {
    this.advance();
  }

  error(message?: string): never {
    throw `Syntax Error${message ? `: ${message}` : ''}`;
  }

  expect(strs: string | string[]): never {
    let message: string;
    if (typeof strs === 'string') message = strs;
    else
      switch (strs.length) {
        case 1:
          message = strs[0];
          break;
        case 2:
          message = `${strs[0]} or ${strs[1]}`;
          break;
        default:
          const begin = strs.slice(0, -2);
          return this.error(
            `Expected ${begin.join(', ')}, or ${strs[strs.length - 1]}`
          );
      }
    this.error(`Expected ${message}`);
  }

  advance() {
    this.token = this.tokens[++this.index];
  }

  skipNewlines() {
    let newlines = 0;
    while (this.token.is('newline')) {
      this.advance();
      newlines++;
    }
    return newlines;
  }

  eof() {
    return this.token.type === 'eof';
  }

  parse(): ListNode {
    if (this.eof()) return new ListNode([]);

    const result = this.statements();

    if (!this.eof()) this.expect('<eof>');

    return result;
  }

  statements(): ListNode {
    // '\n'* statement ('\n'+ statement)* '\n'*
    const statements: Node[] = [];

    this.skipNewlines();

    statements.push(this.statement());

    let moreStatements = true;

    while (true) {
      let newlines = this.skipNewlines();
      if (newlines === 0) moreStatements = false;

      if (!moreStatements || this.token.is('grouping', '}')) break;

      const statement = this.statement();
      if (!statement) {
        moreStatements = false;
        continue;
      }
      statements.push(statement);
    }

    return new ListNode(statements);
  }

  statement(): Node {
    // expr | 'return' expr?
    if (this.token.is('keyword', 'return' as const)) {
      this.advance();
      const node = this.expr();

      return new ReturnNode(node);
    }

    return this.expr();
  }

  expr(): Node {
    // 'let'? IDENTIFIER '=' expr
    const declaration = this.token.is('keyword', 'let');
    if (declaration) this.advance();

    if (declaration || this.tokens[this.index + 1].is('operator', '=')) {
      if (!(this.token as Token).is('identifier'))
        return this.expect('identifier');
      const identifier = (this.token as unknown) as Token<'identifier'>;
      this.advance();

      if (!(this.token as Token).is('operator', '=')) return this.expect("'='");
      this.advance();

      const expr = this.expr();

      if (declaration) return new DeclarationNode(identifier, expr);
      return new AssignmentNode(identifier, expr);
    }

    // comp_expr (('and' | 'or' | ':') comp_expr)*
    return this.binaryOp(this.compExpr, [...WORD_COMPARE_OPS, ':']);
  }

  compExpr(): Node {
    // 'not' comp_expr
    if (this.token.is('operator', 'not')) {
      this.advance();
      return new UnaryOpNode(this.compExpr(), 'not');
    }

    // arith_expr (('==' | '!=' | '<' | '<=' | '>' | '>=') arith_expr)*
    return this.binaryOp(this.arithExpr, SYMBOL_COMPARE_OPS);
  }

  arithExpr(): Node {
    // term (('+' | '-') term)*
    return this.binaryOp(this.term, ['+', '-']);
  }

  term(): Node {
    // factor (('*' | '/' | '%') factor)* | NUMBER IDENTIFIER
    if (
      this.token.is('number') &&
      this.tokens[this.index + 1].is('identifier')
    ) {
      const number = this.token;
      this.advance();

      const identifier = (this.token as unknown) as Token<'identifier'>;
      this.advance();

      return new BinaryOpNode(
        new NumberNode(number.value),
        '*',
        new IdentifierNode(identifier.value)
      );
    }
    return this.binaryOp(this.factor, ['*', '/', '%']);
  }

  factor(): Node {
    // ('+' | '-') factor | power
    const { token } = this;

    if (
      token.type === 'operator' &&
      unaryOps
        .filter(op => op !== 'not')
        .includes((token as Token<'operator', UnaryOp>).value)
    ) {
      this.advance();
      return new UnaryOpNode(
        this.factor(),
        (token as Token<'operator', UnaryOp>).value
      );
    }

    return this.power();
  }

  power(): Node {
    // call ('^' factor)*
    return this.binaryOp(this.call, ['^'], this.factor);
  }

  call(): Node {
    // atom ('(' (expr (',' expr)*)? ')')?
    const atom = this.atom();

    if (this.token.is('grouping', '(')) {
      this.advance();
      const args: Node[] = [];

      if (this.token.is('grouping', ')')) this.advance();
      else {
        args.push(this.expr());

        while ((this.token as Token).is('operator', ',')) {
          this.advance();
          args.push(this.expr());
        }

        if (!(this.token as Token).is('grouping', ')'))
          return this.expect(["','", "')'"]);
        this.advance();
      }

      return new FuncCallNode((atom as IdentifierNode).name, args);
    }

    return atom;
  }

  atom(): Node {
    // (NUMBER | BOOLEAN | STRING | IDENTIFIER) | '(' expr ')' | '|' expr '|' | list_expr | if_expr | func_def
    const { token } = this;

    if (token.is('number')) {
      this.advance();
      return new NumberNode(token.value);
    }
    if (token.is('boolean')) {
      this.advance();
      return new BooleanNode(token.value);
    }
    if (token.is('string')) {
      this.advance();
      return new StringNode(token.value);
    }
    if (token.is('identifier')) {
      this.advance();
      return new IdentifierNode(token.value);
    }
    if (token.is('grouping', '(')) {
      this.advance();

      const expr = this.expr();

      if (!this.token.is('grouping', ')')) return this.expect("')'");
      this.advance();

      return expr;
    }
    if (token.is('keyword', 'if')) return this.ifExpr();
    if (token.is('keyword', 'for')) return this.forExpr();
    if (token.is('keyword', 'while')) return this.whileExpr();
    if (token.is('keyword', 'fn')) return this.funcDec();
    if (token.is('grouping', '[')) return this.listExpr();
    if (token.is('grouping')) {
      const leftGrouping = token.value as LeftGrouping;
      if (!leftGrouping)
        return this.expect(Object.keys(groupings).map(char => `'${char}'`));
      this.advance();

      const expr = this.expr();

      const rightGrouping = groupings[leftGrouping];
      if (!this.token.is('grouping', rightGrouping))
        return this.expect(`'${rightGrouping}'`);
      this.advance();

      return new GroupingNode(expr, [leftGrouping, rightGrouping]);
    }

    this.expect([
      'number',
      'identifier',
      "'if'",
      "'for'",
      "'while'",
      "'fn'",
      ...Object.keys(groupings).map(char => `'${char}'`)
    ]);
  }

  listExpr(): ListNode {
    // '[' (expr (',' expr)*)? ']'
    if (!this.token.is('grouping', '[')) return this.expect("'['");
    this.advance();

    const nodes: Node[] = [];

    if (!this.token.is('grouping', ']')) {
      nodes.push(this.expr());

      while ((this.token as Token).is('operator', ',')) {
        this.advance();
        nodes.push(this.expr());
      }
    }

    if (!this.token.is('grouping', ']')) this.expect(["','", "']'"]);
    this.advance();

    return new ListNode(nodes);
  }

  ifExpr(): IfNode {
    // 'if' expr ((':' statement) | ('{' statements '}')) else_expr?
    if (!this.token.is('keyword', 'if')) return this.expect("'if'");
    this.advance();

    const condition = this.expr();

    let body: Node;

    if (this.token.is('operator', ':')) {
      this.advance();
      body = this.statement();
    } else if (this.token.is('grouping', '{')) {
      this.advance();
      body = this.statements();
      if (!(this.token as Token).is('grouping', '}')) return this.expect("'}'");
      this.advance();
    } else return this.expect(["':'", "'{'"]);

    let elseCase: Node | undefined;

    this.skipNewlines();
    if ((this.token as Token).is('keyword', 'else')) elseCase = this.elseExpr();

    return new IfNode(condition, body, elseCase);
  }

  elseExpr(): Node {
    // 'else' ':'? (statement | ('{' statements '}') | if_expr)
    if (!this.token.is('keyword', 'else')) return this.expect("'else'");
    this.advance();

    if (this.token.is('operator', ':')) this.advance();

    let body: Node;

    if (this.token.is('grouping', '{')) {
      this.advance();
      body = this.statements();
      if (!(this.token as Token).is('grouping', '}')) return this.expect("'}'");
      this.advance();
    } else if (this.token.is('keyword', 'if')) body = this.ifExpr();
    else {
      body = this.statement();
    }

    return body;
  }

  forExpr(): ForNode {
    // 'for' IDENTIFIER 'in' expr ((':' statement) | ('{' statements '}'))
    if (!this.token.is('keyword', 'for')) return this.expect("'for'");
    this.advance();

    if (!this.token.is('identifier')) return this.expect('identifier');
    const identifier = this.token as Token<'identifier'>;
    this.advance();

    if (!(this.token as Token).is('keyword', 'in')) return this.expect("'in'");
    this.advance();

    const iterable = this.expr();

    let body: Node;

    if ((this.token as Token).is('operator', ':')) {
      this.advance();
      body = this.statement();
    } else if ((this.token as Token).is('grouping', '{')) {
      this.advance();
      body = this.statements();
      if (!(this.token as Token).is('grouping', '}')) return this.expect("'}'");
      this.advance();
    } else return this.expect(["':'", "'{'"]);

    return new ForNode(identifier, iterable, body);
  }

  whileExpr(): WhileNode {
    // 'while' expr ((':' statement) | ('{' statements '}'))
    if (!this.token.is('keyword', 'while')) return this.expect("'while'");
    this.advance();

    const condition = this.expr();

    let body: Node;

    if ((this.token as Token).is('operator', ':')) {
      this.advance();
      body = this.statement();
    } else if ((this.token as Token).is('grouping', '{')) {
      this.advance();
      body = this.statements();
      if (!(this.token as Token).is('grouping', '}')) return this.expect("'}'");
      this.advance();
    } else return this.expect(["':'", "'{'"]);

    return new WhileNode(condition, body);
  }

  funcDec(): FuncDefNode {
    // 'fn' IDENTIFIER '(' (IDENTIFIER (',' IDENTIFIER)* ')')? (('->' statement) | ('{' statements '}'))
    if (!this.token.is('keyword', 'fn')) return this.expect("'fn'");
    this.advance();

    if (!this.token.is('identifier')) return this.expect('identifier');
    const name = (this.token as Token<'identifier'>).value;
    this.advance();

    // @ts-ignore
    if (!this.token.is('grouping', '(')) return this.expect("'('");
    this.advance();

    const argNames: string[] = [];
    // @ts-ignore
    if (this.token.is('identifier')) {
      argNames.push((this.token as Token<'identifier'>).value);
      this.advance();
      // @ts-ignore
      while (this.token.is('operator', ',')) {
        this.advance();
        // @ts-ignore
        if (!this.token.is('identifier')) return this.expect('identifier');

        argNames.push((this.token as Token<'identifier'>).value);
        this.advance();
      }

      // @ts-ignore
      if (!this.token.is('grouping', ')')) return this.expect(["','", "')'"]);
    }
    this.advance();

    let body: Node;
    let arrow = false;

    if ((this.token as Token).is('arrow')) {
      arrow = true;
      this.advance();
      body = this.statement();
    } else if ((this.token as Token).is('grouping', '{')) {
      this.advance();
      body = this.statements();
      if (!(this.token as Token).is('grouping', '}')) return this.expect("'}'");
      this.advance();
    } else return this.expect(["'->'", "'{'"]);

    return new FuncDefNode(name, argNames, body, arrow);
  }

  binaryOp(left: () => Node, operators: BinaryOp[], right = left) {
    let result = left.call(this);

    while (
      operators.includes((this.token as Token<'operator', BinaryOp>).value)
    ) {
      const { token } = this;
      this.advance();
      result = new BinaryOpNode(
        result,
        (token as Token<'operator', BinaryOp>).value,
        right.call(this)
      );
    }

    return result;
  }
}

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
import Token, {
  BinaryOp,
  binaryOps,
  compareOps,
  groupings,
  IdentifierOp,
  identifierOps,
  LeftGrouping,
  PostfixUnaryOp,
  postfixUnaryOps,
  PrefixUnaryOp,
  prefixUnaryOps,
  RightGrouping,
  UnaryOp
} from './token.ts';

const SYMBOL_COMPARE_OPS = compareOps.filter(op => !/[a-z]/.test(op));
const WORD_COMPARE_OPS = compareOps.filter(op => /[a-z]/.test(op));

const EOF = new Token('eof', undefined);

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
    this.token = this.tokens[++this.index] || EOF;
  }

  get nextToken(): Token {
    return this.tokens[this.index + 1] || EOF;
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
    // 'return' expr?
    if (this.token.is('keyword', 'return')) {
      this.advance();
      const node = this.expr();

      return new ReturnNode(node);
    }

    // 'import' IDENTIFIER
    if (this.token.is('keyword', 'import')) {
      this.advance();

      if (!this.token.is('identifier')) this.expect('identifier');
      const identifier = this.token as Token<'identifier'>;
      this.advance();

      return new ImportNode(identifier);
    }

    // expr
    return this.expr();
  }

  expr(): Node {
    // 'let' IDENTIFIER '=' expr
    if (this.token.is('keyword', 'let')) {
      this.advance();
      if (!(this.token as Token).is('identifier'))
        return this.expect('identifier');
      const identifier = (this.token as unknown) as Token<'identifier'>;
      this.advance();

      if (!(this.token as Token).is('operator', '=')) return this.expect("'='");
      this.advance();

      const expr = this.expr();

      return new DeclarationNode(identifier, expr);
    }

    // IDENTIFIER ('=' | '+=' | '-=' | '*=' | '/=' | '%=' | '^=') expr
    if (
      this.token.is('identifier') &&
      (this.nextToken as Token).is('operator') &&
      identifierOps.includes(
        ((this.nextToken as unknown) as Token<'operator', IdentifierOp>).value
      )
    ) {
      const identifier = (this.token as unknown) as Token<'identifier'>;
      this.advance();

      const operator = (this.token as unknown) as Token<
        'operator',
        IdentifierOp
      >;
      this.advance();

      // IDENTIFIER ('++' | '--')
      let expr: Node | undefined;
      if (!['++', '--'].includes(operator.value)) expr = this.expr();

      return new AssignmentNode(identifier, operator.value, expr);
    }

    // comp_expr (('and' | 'or' | 'in') comp_expr)*
    return this.binaryOp(this.compExpr, WORD_COMPARE_OPS);
  }

  compExpr(): Node {
    // 'not' comp_expr
    if (this.token.is('operator', 'not')) {
      this.advance();
      return new UnaryOpNode(this.compExpr(), 'not');
    }

    // arith_expr (('==' | '!=' | '<' | '<=' | '>' | '>=' | ':') arith_expr)*
    return this.binaryOp(this.arithExpr, [...SYMBOL_COMPARE_OPS, ':']);
  }

  arithExpr(): Node {
    // term (('+' | '-') term)*
    return this.binaryOp(this.term, ['+', '-', '±', '∓']);
  }

  term(): Node {
    // factor (('*' | '∙' | '×' | '/' | '%') factor)* | NUMBER (!BINARY_OP)? term
    if (
      this.token.is('number') &&
      !['newline', 'eof'].includes(this.nextToken.type) &&
      (this.nextToken.is('operator')
        ? !binaryOps.includes(this.nextToken.value as BinaryOp)
        : true) &&
      !Object.values(groupings).includes(
        this.nextToken.value as RightGrouping
      ) &&
      !this.nextToken.is('grouping', '{')
    ) {
      const number = this.token;
      this.advance();

      const term = this.term();

      return new BinaryOpNode(new NumberNode(number.value), '*', term);
    }
    return this.binaryOp(this.factor, ['*', '∙', '×', '/', '%']);
  }

  factor(): Node {
    // ('+' | '-') factor | power
    const { token } = this;

    if (
      token.type === 'operator' &&
      prefixUnaryOps
        .filter(op => op !== 'not')
        .includes((token as Token<'operator', PrefixUnaryOp>).value)
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
    // postfix ('^' factor)*
    return this.binaryOp(this.postfix, ['^'], this.factor);
  }

  postfix(): Node {
    // call POSTFIX_UNARY_OP?
    const call = this.call();
    if (this.token.is('operator')) {
      const number = '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(this.token.value);
      if (number >= 0) {
        this.advance();
        return new BinaryOpNode(call, '^', new NumberNode(number));
      }
      if (postfixUnaryOps.includes(this.token.value as PostfixUnaryOp)) {
        const operator = this.token.value as PostfixUnaryOp;
        this.advance();
        return new UnaryOpNode(call, operator, true);
      }
    }
    return call;
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
      return new StringNode(
        token.value.map(x => {
          if (typeof x === 'string') return x;
          const parser = new Parser(x);
          return parser.expr();
        })
      );
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
      'boolean',
      'string',
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

    if (!(this.token as Token).is('operator', 'in')) return this.expect("'in'");
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

    if (!(this.token as Token).is('grouping', '(')) return this.expect("'('");
    this.advance();

    const argNames: string[] = [];
    if ((this.token as Token).is('identifier')) {
      argNames.push((this.token as Token<'identifier'>).value);
      this.advance();
      while ((this.token as Token).is('operator', ',')) {
        this.advance();
        if (!(this.token as Token).is('identifier'))
          return this.expect('identifier');

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

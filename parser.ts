import Node, {
  AssignmentNode,
  AwaitNode,
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
import Position from './position.ts';
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

const WORD_COMPARE_OPS = compareOps.filter(op => /[a-z]/.test(op));

export default class Parser {
  index = -1;
  token!: Token;

  constructor(private tokens: Token[]) {
    this.advance();
  }

  error(message: string, start: Position): never {
    throw new Error(message, start, this.token.end);
  }

  expect(strs: string | string[], start: Position): never {
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
          this.error(
            `Expected ${begin.join(', ')}, or ${strs[strs.length - 1]}`,
            start
          );
      }
    this.error(`Expected ${message}`, start);
  }

  advance() {
    this.token = this.tokens[++this.index] || Token.EOF;
  }

  back(amount = 1) {
    this.index -= amount + 1;
    this.advance();
  }

  get nextToken(): Token {
    return this.tokens[this.index + 1] || Token.EOF;
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
    if (this.eof()) return new ListNode([], Position.EOF, Position.EOF);

    return this.statements();
  }

  statements(): ListNode {
    // '\n'* statement ('\n'+ statement)* '\n'*
    const statements: Node[] = [];

    this.skipNewlines();

    const { start } = this.token;
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
    const { end } = this.token;

    return new ListNode(statements, start, end);
  }

  statement(): Node {
    const { start } = this.token;

    // 'return' expr?
    if (this.token.is('keyword', 'return')) {
      const { start } = this.token;
      this.advance();
      const node = this.expr();

      return new ReturnNode(node, start);
    }

    // 'import' IDENTIFIER
    if (this.token.is('keyword', 'import')) {
      const { start } = this.token;
      this.advance();

      if (!this.token.is('identifier')) this.expect('identifier', start);
      const identifier = this.token as Token<'identifier'>;
      this.advance();

      return new ImportNode(identifier, start);
    }

    // expr
    return this.expr();
  }

  expr(): Node {
    const { start } = this.token;

    // 'let' IDENTIFIER '=' expr
    if (this.token.is('keyword', 'let')) {
      const { start } = this.token;
      this.advance();
      if (!(this.token as Token).is('identifier'))
        this.expect('identifier', start);
      const identifier = this.token as unknown as Token<'identifier'>;
      this.advance();

      if (!(this.token as Token).is('operator', '=')) this.expect("'='", start);
      this.advance();

      const expr = this.expr();

      return new DeclarationNode(identifier, expr, start);
    }

    // IDENTIFIER ('=' | '+=' | '-=' | '*=' | '/=' | '%=' | '^=') expr
    if (
      this.token.is('identifier') &&
      (this.nextToken as Token).is('operator') &&
      identifierOps.includes(
        (this.nextToken as unknown as Token<'operator', IdentifierOp>).value
      )
    ) {
      const identifier = this.token as Token<'identifier'>;
      this.advance();

      const operator = this.token as unknown as Token<'operator', IdentifierOp>;
      this.advance();

      // IDENTIFIER ('++' | '--')
      let expr: Node | undefined;
      if (!['++', '--'].includes(operator.value)) expr = this.expr();

      return new AssignmentNode(identifier, operator, expr);
    }

    // comp_expr (('and' | 'or' | 'in') comp_expr)*
    return this.binaryOp(this.compExpr, WORD_COMPARE_OPS);
  }

  orExpr(): Node {
    return this.binaryOp(this.andExpr, ['or']);
  }

  andExpr(): Node {
    return this.binaryOp(this.notExpr, ['and']);
  }

  notExpr(): Node {
    const { token } = this;
    if (token.is('operator', 'not')) {
      this.advance();
      return new UnaryOpNode(
        this.notExpr(),
        token as Token<'operator', UnaryOp>
      );
    }
    return this.compExpr();
  }

  compExpr(): Node {
    // arith_expr (('==' | '!=' | '<' | '<=' | '>' | '>=' | ':') arith_expr)*
    return this.binaryOp(this.arithExpr, [
      '==',
      '!=',
      '<',
      '<=',
      '>',
      '>=',
      ':'
    ]);
  }

  arithExpr(): Node {
    // term (('+' | '-') term)*
    return this.binaryOp(this.term, ['+', '-', '±', '∓']);
  }

  term(): Node {
    // factor (('*' | '∙' | '×' | '/' | '%') factor)* | NUMBER (!BINARY_OP)? term
    if (
      this.token.is('number') &&
      !['number', 'superscript', 'newline', 'eof'].includes(
        this.nextToken.type
      ) &&
      !(
        this.nextToken.is('operator') &&
        binaryOps.includes(this.nextToken.value as BinaryOp)
      ) &&
      !(
        this.nextToken.is('grouping') &&
        Object.values(groupings).includes(this.nextToken.value as RightGrouping)
      )
    ) {
      const number = this.token;
      this.advance();

      const term = this.term();

      return new BinaryOpNode(new NumberNode(number), '*', term);
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
        token as Token<'operator', UnaryOp>
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
    if (
      this.token.is('operator') &&
      postfixUnaryOps.includes(this.token.value as PostfixUnaryOp)
    ) {
      const operator = this.token as Token<'operator', PostfixUnaryOp>;
      this.advance();
      return new UnaryOpNode(call, operator, true);
    }
    if (this.token.is('superscript')) {
      const tokens = (this.token as Token<'superscript'>).value;
      this.advance();

      const parser = new Parser(tokens);
      const node = parser.arithExpr();

      return new BinaryOpNode(call, '^', node);
    }
    return call;
  }

  call(): Node {
    const { start } = this.token;

    // atom ('(' (expr (',' expr)*)? ')')?
    const atom = this.atom();

    if (this.token.is('grouping', '(')) {
      if (!(atom instanceof IdentifierNode)) this.expect('identifier', start);

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
          this.expect(["','", "')'"], start);
        this.advance();
      }

      if (this.token.is('operator', '=')) {
        this.advance();

        const body = this.expr();

        return new FuncDefNode(
          atom.token,
          args.map(arg => {
            if (arg instanceof IdentifierNode) return arg.token;
            else this.expect('identifier', start);
          }),
          body,
          start,
          true
        );
      }

      return new FuncCallNode(atom.token, args, this.token.end);
    }

    return atom;
  }

  atom(): Node {
    // (NUMBER | BOOLEAN | STRING | IDENTIFIER) | '(' expr ')' | '|' expr '|' | list_expr | if_expr | func_def
    const { token } = this;
    let rtn: Node;

    if (token.is('number')) {
      this.advance();
      rtn = new NumberNode(token);
    } else if (token.is('boolean')) {
      this.advance();
      rtn = new BooleanNode(token);
    } else if (token.is('string')) {
      const { value } = token;
      this.advance();
      rtn = new StringNode(
        value instanceof Token
          ? value
          : value.map(fragment => {
              if (fragment instanceof Token) return fragment;
              const parser = new Parser(fragment);
              return parser.expr();
            })
      );
    } else if (token.is('identifier')) {
      this.advance();
      rtn = new IdentifierNode(token);
    } else if (token.is('grouping', '(')) {
      const { start } = this.token;
      this.advance();

      const expr = this.expr();

      if (!this.token.is('grouping', ')')) this.expect("')'", start);
      this.advance();

      rtn = expr;
    } else if (token.is('keyword', 'await')) rtn = this.awaitExpr();
    else if (token.is('keyword', 'if')) rtn = this.ifExpr();
    else if (token.is('keyword', 'for')) rtn = this.forExpr();
    else if (token.is('keyword', 'while')) rtn = this.whileExpr();
    else if (token.is('keyword', 'loop')) rtn = this.loopExpr();
    else if (token.is('keyword', 'fn')) rtn = this.funcDec();
    else if (token.is('grouping', '[')) rtn = this.listExpr();
    else if (token.is('grouping', '⟨')) rtn = this.vecExpr();
    else if (token.is('grouping')) {
      const { start } = this.token;
      const leftGroupingToken = token as Token<'grouping', LeftGrouping>;
      if (!leftGroupingToken)
        this.expect(
          Object.keys(groupings).map(char => `'${char}'`),
          start
        );
      this.advance();

      const expr = this.expr();

      const rightGrouping = groupings[leftGroupingToken.value];
      if (!this.token.is('grouping', rightGrouping))
        this.expect(`'${rightGrouping}'`, start);
      const rightGroupingToken = this.token as Token<'grouping', RightGrouping>;
      this.advance();

      rtn = new GroupingNode(expr, [leftGroupingToken, rightGroupingToken]);
    } else
      this.expect(
        [
          'number',
          'identifier',
          'boolean',
          'string',
          "'if'",
          "'for'",
          "'while'",
          "'loop'",
          "'fn'",
          ...Object.keys(groupings).map(char => `'${char}'`)
        ],
        this.token.start.copy()
      );

    if (this.token.is('grouping', '[')) {
      const { start } = this.token;
      this.advance();

      const expr = this.expr();

      if (!this.token.is('grouping', ']')) this.expect("']'", start);
      const { end } = this.token;
      this.advance();

      return new PropAccessNode(rtn, expr, end);
    }

    return rtn;
  }

  listExpr(): ListNode | MatNode {
    const { start } = this.token;

    // '[' (expr (',' expr)*)? ']'
    if (!this.token.is('grouping', '[')) this.expect("'['", start);
    this.advance();

    if (this.token.is('newline')) this.advance();

    const nodes: Node[][] = [];

    while (!this.token.is('grouping', ']')) {
      const row: Node[] = [];
      // @ts-ignore
      while (!this.token.is('newline')) {
        row.push(this.expr());
        // @ts-ignore
        if (this.token.is('operator', ',')) this.advance();
        // @ts-ignore
        if (this.token.is('grouping', ']')) break;
      }
      // @ts-ignore
      if (this.token.is('newline')) this.advance();

      nodes.push(row);
    }

    if (!this.token.is('grouping', ']')) this.expect("']'", start);
    const { end } = this.token;
    this.advance();

    if (nodes.length <= 1) return new ListNode(nodes[0], start, end);
    return new MatNode(nodes, start, end);
  }

  vecExpr(): ListNode {
    const { start } = this.token;

    if (!this.token.is('grouping', '⟨')) this.expect("'⟨'", start);
    this.advance();

    const nodes = this.list('⟩');

    return new VecNode(nodes, start, this.token.end);
  }

  awaitExpr(): AwaitNode {
    const { start } = this.token;

    if (!this.token.is('keyword', 'await')) this.expect("'await'", start);
    this.advance();

    const body = this.expr();

    return new AwaitNode(body, start);
  }

  ifExpr(): IfNode {
    const { start } = this.token;

    // 'if' expr ((':' statement) | ('{' statements '}')) else_expr?
    if (!this.token.is('keyword', 'if')) this.expect("'if'", start);
    this.advance();

    const condition = this.expr();

    let body: Node;

    if (this.token.is('operator', ':')) {
      this.advance();
      body = this.statement();
    } else if (this.token.is('grouping', '{')) body = this.block();
    else this.expect(["':'", "'{'"], start);

    let elseCase: Node | undefined;

    const newlines = this.skipNewlines();
    if ((this.token as Token).is('keyword', 'else')) elseCase = this.elseExpr();
    else if (newlines > 0) this.back();

    return new IfNode(condition, body, start, elseCase);
  }

  elseExpr(): Node {
    const { start } = this.token;

    // 'else' ':'? (statement | ('{' statements '}') | if_expr)
    if (!this.token.is('keyword', 'else')) this.expect("'else'", start);
    this.advance();

    if (this.token.is('operator', ':')) this.advance();

    let body: Node;

    if (this.token.is('grouping', '{')) body = this.block();
    else if (this.token.is('keyword', 'if')) body = this.ifExpr();
    else {
      body = this.statement();
    }

    return body;
  }

  forExpr(): ForNode {
    const { start } = this.token;

    // 'for' IDENTIFIER 'in' expr ((':' statement) | ('{' statements '}'))
    if (!this.token.is('keyword', 'for')) this.expect("'for'", start);
    this.advance();

    if (!this.token.is('identifier')) this.expect('identifier', start);
    const identifier = this.token as Token<'identifier'>;
    this.advance();

    if (!(this.token as Token).is('operator', 'in')) this.expect("'in'", start);
    this.advance();

    const iterable = this.expr();

    let body: Node;

    if ((this.token as Token).is('operator', ':')) {
      this.advance();
      body = this.statement();
    } else if ((this.token as Token).is('grouping', '{')) body = this.block();
    else this.expect(["':'", "'{'"], start);

    return new ForNode(identifier, iterable, body, start);
  }

  whileExpr(): WhileNode {
    const { start } = this.token;

    // 'while' expr ((':' statement) | ('{' statements '}'))
    if (!this.token.is('keyword', 'while')) this.expect("'while'", start);
    this.advance();

    const condition = this.expr();

    let body: Node;

    if ((this.token as Token).is('operator', ':')) {
      this.advance();
      body = this.statement();
    } else if ((this.token as Token).is('grouping', '{')) body = this.block();
    else this.expect(["':'", "'{'"], start);

    return new WhileNode(condition, body, start);
  }

  loopExpr(): LoopNode {
    const { start } = this.token;

    // 'loop' (':' statement | block)
    if (!this.token.is('keyword', 'loop')) this.expect("'loop'", start);
    this.advance();
    let body: Node;

    if ((this.token as Token).is('operator', ':')) {
      this.advance();
      body = this.statement();
    } else if ((this.token as Token).is('grouping', '{')) body = this.block();
    else this.expect(["':'", "'{'"], start);

    return new LoopNode(body, start);
  }

  funcDec(): FuncDefNode {
    const { start } = this.token;

    // 'fn' IDENTIFIER '(' (IDENTIFIER (',' IDENTIFIER)* ')')? (('->' statement) | ('{' statements '}'))
    if (!this.token.is('keyword', 'fn')) this.expect("'fn'", start);
    this.advance();

    if (!this.token.is('identifier')) this.expect('identifier', start);
    const name = this.token as Token<'identifier'>;
    this.advance();

    if (!(this.token as Token).is('grouping', '(')) this.expect("'('", start);
    this.advance();

    const argNames: Token<'identifier'>[] = [];
    if ((this.token as Token).is('identifier')) {
      argNames.push(this.token as Token<'identifier'>);
      this.advance();
      while ((this.token as Token).is('operator', ',')) {
        const start = (this.token as Token).start.copy();
        this.advance();
        if (!(this.token as Token).is('identifier'))
          this.expect('identifier', start);

        argNames.push(this.token as Token<'identifier'>);
        this.advance();
      }

      // @ts-ignore
      if (!this.token.is('grouping', ')')) this.expect(["','", "')'"]);
    }
    this.advance();

    let body: Node;
    let arrow = false;

    if ((this.token as Token).is('arrow')) {
      arrow = true;
      this.advance();
      body = this.statement();
    } else if ((this.token as Token).is('grouping', '{')) body = this.block();
    else this.expect(["'->'", "'{'"], start);

    return new FuncDefNode(name, argNames, body, start, arrow);
  }

  binaryOp(left: () => Node, operators: BinaryOp[], right = left) {
    let result = left.call(this);

    while (
      operators.includes((this.token as Token<'operator', BinaryOp>).value)
    ) {
      const { token } = this;
      if (token.is('operator', ':') && !this.nextToken.is('number')) break;
      this.advance();
      result = new BinaryOpNode(
        result,
        (token as Token<'operator', BinaryOp>).value,
        right.call(this)
      );
    }

    return result;
  }

  list(end: RightGrouping): Node[] {
    const { start } = this.token;
    const nodes: Node[] = [];

    while (!this.token.is('grouping', end)) {
      const { start } = this.token;
      nodes.push(this.expr());
      if (this.token.is('operator', ',')) this.advance();
      else if (this.token.is('grouping', end)) break;
      else this.expect(["','", `'${end}'`], start);
    }

    if (!this.token.is('grouping', end)) this.expect(`'${end}'`, start);
    this.advance();

    return nodes;
  }

  block(): ListNode {
    const { start } = this.token;
    if (!this.token.is('grouping', '{')) this.expect("'{'", start);
    this.advance();

    const statements = this.statements();

    if (!this.token.is('grouping', '}')) this.expect("'}'", start);
    this.advance();

    return statements;
  }
}

export class Error {
  constructor(
    readonly message: string,
    readonly start: Position,
    readonly end: Position
  ) {}
}

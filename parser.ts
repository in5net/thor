import Node, {
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
import Token, { BinaryOp, UnaryOp } from './token.ts';

export default class Parser {
  tokens: IterableIterator<Token>;
  token!: Token;

  constructor(tokens: Token[]) {
    this.tokens = tokens[Symbol.iterator]();
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
    this.token = this.tokens.next().value;
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

  parse() {
    if (this.eof()) return;

    const result = this.statements();

    if (!this.eof()) return this.expect('<eof>');

    return result;
  }

  statements(): StatementsNode {
    // '\n'* statement ('\n'+ statement)* '\n'*
    const statements: Node[] = [];

    this.skipNewlines();

    statements.push(this.statement());

    let moreStatements = true;

    while (true) {
      let newlines = this.skipNewlines();
      if (newlines === 0) moreStatements = false;

      if (!moreStatements || this.token.is('parenthesis', '}')) break;

      const statement = this.statement();
      if (!statement) {
        moreStatements = false;
        continue;
      }
      statements.push(statement);
    }

    return new StatementsNode(statements);
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
    // 'let' IDENTIFIER '=' expr
    if (this.token.is('keyword', 'let' as const)) {
      this.advance();
      if (!(this.token as Token).is('identifier'))
        return this.expect('identifier');
      const identifier = this.token.value as string;

      this.advance();
      if (!(this.token as Token).is('operator', '=' as const))
        return this.expect("'='");

      this.advance();
      const node = this.expr();

      return new AssignmentNode(identifier, node);
    }

    // comp_expr (('and' | 'or') comp_expr)*
    return this.binaryOp(this.compExpr, ['and', 'or']);
  }

  compExpr(): Node {
    // 'not' comp_expr
    if (this.token.is('operator', 'not')) {
      this.advance();
      return new UnaryOpNode(this.compExpr(), 'not');
    }

    // arith_expr (('==' | '<' | '<=' | '>' | '>=') arith_expr)*
    return this.binaryOp(this.arithExpr, ['==', '<', '<=', '>', '>=']);
  }

  arithExpr(): Node {
    // term (('+' | '-') term)*
    return this.binaryOp(this.term, ['+', '-']);
  }

  term(): Node {
    // factor (('*' | '/') factor)*
    return this.binaryOp(this.factor, ['*', '/']);
  }

  factor(): Node {
    // ('+' | '-') factor | power
    const { token } = this;

    if (
      token.type === 'operator' &&
      ['+', '-'].includes((token as Token<'operator'>).value)
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
    // call : atom ('(' (expr (',' expr)*)? ')')?
    const atom = this.atom();

    if (this.token.is('parenthesis', '(')) {
      this.advance();
      const args: Node[] = [];

      if (this.token.is('parenthesis', ')')) this.advance();
      else {
        args.push(this.expr());

        while ((this.token as Token).is('operator', ',')) {
          this.advance();
          args.push(this.expr());
        }

        if (!(this.token as Token).is('parenthesis', ')'))
          return this.expect(["','", "')'"]);
        this.advance();
      }

      return new FuncCallNode((atom as IdentifierNode).name, args);
    }

    return atom;
  }

  atom(): Node {
    // NUMBER | BOOLEAN | STRING | IDENTIFIER | '(' expr ')' | if_expr | func_def
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
    if (token.value === '(') {
      this.advance();
      const result = this.expr();

      if (this.token?.value !== ')') return this.expect("')'");

      this.advance();
      return result;
    }
    if (token.is('keyword', 'if')) return this.ifExpr();
    if (token.is('keyword', 'fn')) return this.funcDec();

    this.expect(['number', 'identifier', '(', "'if'", "'fn'"]);
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
    } else if (this.token.is('parenthesis', '{')) {
      this.advance();
      body = this.statements();
      if (!(this.token as Token).is('parenthesis', '}'))
        return this.expect("'}'");
      this.advance();
    } else return this.expect(["':'", "'{'"]);

    let elseCase: Node | undefined;

    this.skipNewlines();
    if ((this.token as Token).is('keyword', 'else')) elseCase = this.elseExpr();

    return new IfNode(condition, body, elseCase);
  }

  elseExpr(): Node {
    // 'else' (statement | ('{' statements '}'))
    if (!this.token.is('keyword', 'else')) return this.expect("'else'");
    this.advance();

    let body: Node;

    if (this.token.is('operator', ':')) {
      this.advance();
      body = this.statement();
    } else if (this.token.is('parenthesis', '{')) {
      this.advance();
      body = this.statements();
      if (!(this.token as Token).is('parenthesis', '}'))
        return this.expect("'}'");
      this.advance();
    } else return this.expect(["':'", "'{'"]);

    return body;
  }

  funcDec(): FuncDefNode {
    // 'fn' IDENTIFIER '(' (IDENTIFIER (',' IDENTIFIER)* ')')? '{' statements '}'
    if (!this.token.is('keyword', 'fn')) return this.expect("'fn'");
    this.advance();
    if (!this.token.is('identifier')) return this.expect('identifier');
    const name = (this.token as Token<'identifier'>).value;

    this.advance();
    // @ts-ignore
    if (!this.token.is('parenthesis', '(')) return this.expect("'('");

    const argNames: string[] = [];
    this.advance();
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
      if (!this.token.is('parenthesis', ')'))
        return this.expect(["','", "')'"]);
    }

    this.advance();
    // @ts-ignore
    if (!this.token.is('parenthesis', '{')) return this.expect("'{'");

    this.advance();
    const body = this.statements();

    // @ts-ignore
    if (!this.token.is('parenthesis', '}')) return this.expect("'}'");
    this.advance();

    return new FuncDefNode(name, argNames, body);
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

import { red } from 'fmt/colors.ts';

import Interpreter, { Error as RTError } from './interpreter.ts';
import Lexer, { Error as CharError } from './lexer.ts';
import { ImportNode } from './nodes.ts';
import Parser, { Error as SyntaxError } from './parser.ts';
import Position from './position.ts';
import Scope from './scope.ts';
import Token from './token.ts';
import Value from './values/mod.ts';

let log = false;

if (Deno.args[0] === 'help') console.log('Usage: thor [path?] [--log?]');
else if (Deno.args.length === 0) runPrompt();
else {
  if (Deno.args[1] === '--log') log = true;
  runFile(Deno.args[0]);
}

async function runFile(path: string): Promise<void> {
  const text = Deno.readTextFileSync(path);
  const start = performance.now();
  await run(text);
  const end = performance.now();
  const ms = end - start;
  const s = ms / 1000;
  console.log(`Ran in ${s.toFixed(3)}s`);
}

async function runPrompt(): Promise<void> {
  console.log('Thor 🐶');
  while (true) {
    const line = prompt('>');
    if (line === null) continue;
    const value = await run(line, true);
    if (!value) continue;
    console.log(value.toPrint());
  }
}

async function run(text: string, repl = false): Promise<Value | void> {
  try {
    const lexer = new Lexer(text);
    const tokens = lexer.lex();
    if (log)
      console.log(
        `TOKENS:
  ${tokens.map(token => token.toPrint()).join(',\n  ')}
`
      );

    const parser = new Parser(tokens);
    const ast = parser.parse();
    if (log) console.log('AST:', ast.toString(), '\n');

    const interpreter = new Interpreter();
    const globalScope = new Scope('<program>');
    await interpreter.visitImportNode(
      new ImportNode(
        new Token('identifier', 'std', Position.EOF, Position.EOF),
        Position.EOF,
        Position.EOF
      ),
      globalScope
    );
    const value = await interpreter.visit(
      repl ? ast.nodes[0] : ast,
      globalScope
    );
    return value;
  } catch (e) {
    if (
      e instanceof CharError ||
      e instanceof SyntaxError ||
      e instanceof RTError
    ) {
      let title: string;
      if (e instanceof CharError) title = 'Char Error:';
      else if (e instanceof SyntaxError) title = 'Syntax Error:';
      else title = 'Runtime Error:';
      console.error(red(title));

      const { message, start, end } = e;
      const text = Position.textBetween(start, end);
      console.error(text);
      console.error(red(message));
    } else {
      console.error('Unknown Error:');
      console.error(e);
    }
    if (!repl) Deno.exit(1);
  }
}

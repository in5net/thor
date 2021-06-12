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

function runFile(path: string): void {
  const text = Deno.readTextFileSync(path);
  const start = performance.now();
  run(text);
  const end = performance.now();
  const ms = end - start;
  const s = ms / 1000;
  console.log(`Ran in ${s.toFixed(3)}s`);
}

function runPrompt(): void {
  while (true) {
    const line = prompt('>');
    if (line === null) continue;
    const value = run(line, true);
    if (!value) continue;
    console.log(value.toPrint());
  }
}

export default function run(text: string, repl = false): Value | void {
  try {
    const lexer = new Lexer(text);
    const tokens = lexer.lex();
    if (log)
      console.log(
        'tokens:',
        `[
        ${tokens.map(token => token.toPrint()).join(',\n  ')}
      ]`,
        '\n'
      );

    const parser = new Parser(tokens);
    const ast = parser.parse();
    if (log) console.log('ast:', ast.toString(), '\n');

    const interpreter = new Interpreter();
    const globalScope = new Scope('<program>');
    interpreter.visitImportNode(
      new ImportNode(
        new Token('identifier', 'std', Position.EOF, Position.EOF),
        Position.EOF
      ),
      globalScope
    );
    const value = interpreter.visit(repl ? ast.nodes[0] : ast, globalScope);
    return value;
  } catch (e) {
    if (e instanceof CharError) {
      const { message, start, end } = e;
      const text = Position.textBetween(start, end);
      console.error('Char Error:');
      console.error(text);
      console.error(message);
    } else if (e instanceof SyntaxError) {
      const { message, start, end } = e;
      const text = Position.textBetween(start, end);
      console.error('Syntax Error:');
      console.error(text);
      console.error(message);
    } else if (e instanceof RTError) {
      const { message, start, end } = e;
      const text = Position.textBetween(start, end);
      console.error('Runtime Error:');
      console.error(text);
      console.error(message);
    } else {
      console.error('Unknown Error:');
      console.error(e);
    }
    Deno.exit(1);
  }
}

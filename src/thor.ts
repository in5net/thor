/* eslint-disable no-continue */
import { readFileSync } from 'fs';
import { uptime } from 'process';

import readlineSync from 'readline-sync';
import { red } from 'colors';

import Interpreter, { Error as RTError } from './interpreter';
import Lexer, { Error as CharError } from './lexer';
import { ImportNode } from './nodes';
import Parser, { Error as SyntaxError } from './parser';
import Position from './position';
import Scope from './scope';
import Token from './token';
import { None } from './values';
import type Value from './values';

export async function runFile(path: string, log = false): Promise<void> {
  const text = readFileSync(path).toString();
  const start = uptime();
  await run(text, { log });
  const end = uptime();
  if (log) {
    const seconds = end - start;
    console.log(`Ran in ${seconds.toFixed(3)}s`);
  }
}

export async function runPrompt(): Promise<never> {
  console.log('Thor 🐶');
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const line = readlineSync.question('> ');
    if (line === null) continue;
    // eslint-disable-next-line no-await-in-loop
    const value = await run(line, { repl: true });
    if (!value) continue;
    console.log(value.toPrint());
  }
}

async function run(
  text: string,
  {
    stdout,
    safe,
    repl,
    log
  }: { stdout?: Buffer; safe?: boolean; repl?: boolean; log?: boolean } = {}
): Promise<Value> {
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

    const interpreter = new Interpreter(stdout, safe);
    const globalScope = new Scope('<program>');
    interpreter.visitImportNode(
      new ImportNode(
        new Token('identifier', 'std', Position.EOF, Position.EOF),
        Position.EOF
      ),
      globalScope
    );
    const value = await interpreter.visit(
      repl ? ast.nodes[0]! : ast,
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
    if (!repl) process.exit(1);
  }
  return None;
}

export default async function thor(
  text: string,
  { stdout, safe, log }: { stdout?: Buffer; safe?: boolean; log?: boolean } = {}
): Promise<Value> {
  return run(text, { stdout, safe, log });
}

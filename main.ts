import Interpreter from './interpreter.ts';
import Lexer from './lexer.ts';
import Parser from './parser.ts';

if (Deno.args.length > 1) {
  console.log('Usage: deno run --allow-read main.ts [path]');
  Deno.exit(64);
} else if (Deno.args.length === 1) {
  runFile(Deno.args[0]);
} else {
  runPrompt();
}

function runFile(path: string): void {
  const file = Deno.readTextFileSync(path);
  run(file);
}

function runPrompt(): void {
  while (1) {
    const line = prompt('>');
    if (line === null) break;
    run(line);
  }
}

function run(text: string) {
  try {
    if (!text) return;

    const lexer = new Lexer(text);
    const tokens = lexer.lex();

    const parser = new Parser(tokens);
    const ast = parser.parse();
    if (!ast) return;

    const interpreter = new Interpreter();
    const value = interpreter.visit(ast);
    console.log(value.toString());
  } catch (e) {
    console.error('Error:', e);
  }
}

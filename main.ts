import Interpreter from './interpreter.ts';
import Lexer from './lexer.ts';
import Parser from './parser.ts';
import Scope from './scope.ts';
import Value, { BuiltInFunction } from './values.ts';

if (Deno.args.length > 1) {
  console.log('Usage: thor [path]');
  Deno.exit(64);
} else if (Deno.args.length === 1) runFile(Deno.args[0]);
else runPrompt();

function runFile(path: string): void {
  const text = Deno.readTextFileSync(path);
  run(text);
}

function runPrompt(): void {
  while (true) {
    const line = prompt('>');
    if (line === null) continue;
    const value = run(line, { repl: true });
    if (!value) continue;
    console.log(value.toString());
  }
}

export default function run(
  text: string,
  { repl = false, logTokens = false, logAST = false } = {}
): Value | undefined {
  try {
    const lexer = new Lexer(text);
    const tokens = lexer.lex();
    if (logTokens)
      console.log(
        'tokens:',
        `[
  ${tokens.join(',\n  ')}
]`,
        '\n'
      );

    const parser = new Parser(tokens);
    const ast = parser.parse();
    if (!ast) return;
    if (logAST) console.log('ast:', ast.toString(), '\n');

    const interpreter = new Interpreter();
    const globalScope = new Scope('<program>');
    BuiltInFunction.setupGlobalSymbolTable(globalScope.symbolTable);
    const value = interpreter.visit(repl ? ast.nodes[0] : ast, globalScope);
    return value;
  } catch (e) {
    console.error('Error:', e);
  }
}

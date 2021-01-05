import Interpreter from './interpreter.ts';
import Lexer from './lexer.ts';
import Parser from './parser.ts';

while (true) {
  try {
    const text = prompt('calc >');
    if (!text) continue;

    const lexer = new Lexer(text);
    const tokens = lexer.lex();

    const parser = new Parser(tokens);
    const ast = parser.parse();
    if (!ast) continue;

    const interpreter = new Interpreter();
    const value = interpreter.visit(ast);
    console.log('answer:', value.toString());
  } catch (e) {
    console.error('Error:', e);
  }
}

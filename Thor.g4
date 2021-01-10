grammar Thor;

statements  : newlines statement ('\n'+ statement)* newlines;

statement   : expr
            | 'return' expr?;

expr        : term (('+' | '-') term)*
            | 'let' IDENTIFIER '=' expr;

term        : factor (('*' | '/') factor)*;

factor      : ('+' | '-') factor
            | power;

power       : call ('^' factor)*;

call        : atom ('(' (expr (',' expr)*)? ')')?;

atom        : NUMBER | IDENTIFIER | BOOLEAN
            | '(' expr ')'
            | if_expr
            | func_def;

if_expr     : 'if' expr ((':' statement) | ('{' statements '}')) else_expr?;

else_expr   : 'else' (statement | ('{' statements '}'));

func_def    : 'fn' IDENTIFIER '(' (IDENTIFIER (',' IDENTIFIER)* ')')? '{'
            statements
            '}';

NUMBER      : [0-9]* '.' [0-9]*;
BOOLEAN     : 'true' | 'false';
IDENTIFIER  : [a-zA-Z] [a-zA-Z0-9_]*;

newlines    : '\n'*;
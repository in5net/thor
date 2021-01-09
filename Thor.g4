grammar Thor;

statements  : '\n'* statement ('\n'+ statement)* '\n'*;

statement   : expr
            | 'return' expr?;

expr        : term (('+' | '-') term)*
            | 'let' IDENTIFIER '=' expr;

term        : factor (('*' | '/') factor)*;

factor      : ('+' | '-') factor
            | power;

power       : call ('^' factor)*;

call        : atom ('(' (expr (',' expr)*)? ')')?;

atom        : NUMBER | IDENTIFIER
            | '(' expr ')'
            | func_def;

func_def:   'fn' IDENTIFIER '(' (IDENTIFIER (',' IDENTIFIER)* ')')? '{'
            statements
            '}';

NUMBER      : [0-9]* '.' [0-9]*;
IDENTIFIER  : [a-zA-Z] [a-zA-Z0-9_]*;
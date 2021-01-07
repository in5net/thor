grammar Thor;

expr        : term (('+' | '-') term)*
            | 'let' IDENTIFIER '=' expr;

term        : factor (('+' | '-') factor)*;

factor      : ('+' | '-') factor
            | power;

power       : atom ('^' atom)*;

atom        : '(' expr ')'
            | NUMBER
            | IDENTIFIER;

NUMBER      : [0-9]* '.' [0-9]*;
IDENTIFIER  : [a-zA-Z] [a-zA-Z0-9_]*;
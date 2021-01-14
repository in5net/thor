grammar Thor;

statements: '\n'* statement ('\n'+ statement)* '\n'*;

statement: expr | 'return' expr?;

expr:
	'let'? IDENTIFIER '=' expr
	| comp_expr (('and' | 'or' | ':') comp_expr)*;

comp_expr:
	'not' comp_expr
	| arith_expr (
		('==' | '!=' | '<' | '<=' | '>' | '>=') arith_expr
	)*;

arith_expr: term (('+' | '-') term)*;

term: factor (('*' | '/' | '%') factor)* | NUMBER IDENTIFIER;

factor: ('+' | '-') factor | power;

power: call ('^' factor)*;

call: atom ('(' (expr (',' expr)*)? ')')?;

atom:
	(NUMBER | BOOLEAN | STRING | IDENTIFIER)
	| '(' expr ')'
	| '|' expr '|'
	| list_expr
	| if_expr
	| for_expr
	| while_expr
	| func_def;

list_expr: '[' (expr (',' expr)*)? ']';

if_expr:
	'if' expr ((':' statement) | ('{' statements '}')) else_expr?;

else_expr:
	'else' ':'? (statement | ('{' statements '}') | if_expr);

for_expr:
	'for' IDENTIFIER 'in' expr (
		(':' statement)
		| ('{' statements '}')
	);

while_expr:
	'while' expr ((':' statement) | ('{' statements '}'));

func_def:
	'fn' IDENTIFIER '(' (IDENTIFIER (',' IDENTIFIER)*)? ')' (
		('->' statement)
		| ('{' statements '}')
	);

NUMBER: [0-9]* '.' [0-9]*;
BOOLEAN: 'true' | 'false';
STRING: '"' (.)*? '"';
IDENTIFIER: [a-zA-Z] [a-zA-Z0-9_]*;
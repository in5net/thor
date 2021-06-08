grammar Thor;

statements: '\n'* statement ('\n'+ statement)* '\n'*;

statement: 'return'? expr;

expr:
	| (
		IDENTIFIER (('+' | '-' | '*' | '/' | '%' | '^')? '=') expr
	)
	| or_expr;

or_expr: and_expr ('or' and_expr)*;

and_expr: not_expr ('and' not_expr)*;

not_expr: ('not' not_expr) | comp_expr;

comp_expr:
	arith_expr ('==' | '!=' | '>' | '>=' | '<' | '<=' arith_expr)*;

arith_expr: term (('+' | '-') term)*;

term:
	factor (('*' | '∙' | '×' | | '/' | '%') factor)*
	| NUMBER term;

factor: ('+' | '-') factor | power;

power: postfix ('^' factor)*;

postfix: call ('!' | '°')?;

call: atom '(' list ')';

atom:
	(NUMBER | BOOLEAN | IDENTIFIER)
	| NUMBER postfix
	| '(' expr ')'
	| '|' expr '|'
	| '⌊' expr '⌋'
	| '⌈' expr '⌉'
	| vec_expr
	| if_expr
	| for_expr
	| fn_expr;

vec_expr: '⟨' list '⟩';

if_expr: 'if' expr (':' statement | block);

else_expr: 'else' ':'? (statement | block | if_expr);

for_expr: 'for' IDENTIFIER 'in' expr (':' statement | block);

while_expr: 'while' expr (':' statement | block);

loop_expr: 'loop' (':' statement | block);

fn_expr: ('fn' IDENTIFIER '(' list ')' ('->' statement | block));

list: expr? (',' expr)*;

block: '{' statements '}';

NUMBER: [0-9]* '.' [0-9]*;
BOOLEAN: 'true' | 'false';
STRING: '"' (.)*? '"';
IDENTIFIER: [a-zA-Z] [a-zA-Z0-9_]*;
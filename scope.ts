import Value from './values.ts';

export default class Scope {
  symbolTable = new SymbolTable();

  constructor(public name: string, public parent?: Scope) {
    this.symbolTable.parent = parent?.symbolTable;
  }
}

export class SymbolTable {
  symbols = new Map<string, Value>();

  constructor(public parent?: SymbolTable) {}

  get(name: string): Value | undefined {
    let value = this.symbols.get(name);
    if (!value && this.parent) return this.parent.get(name);
    return value;
  }

  set(name: string, value: Value): void {
    this.symbols.set(name, value);
  }

  remove(name: string): void {
    this.symbols.delete(name);
  }
}

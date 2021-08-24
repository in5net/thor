import Value from './values/mod.ts';

export default class Scope {
  symbolTable = new SymbolTable();

  constructor(public name: string, public parent?: Scope) {
    this.symbolTable.parent = parent?.symbolTable;
  }
}

export class SymbolTable {
  symbols = new Map<string, Value>();

  constructor(public parent?: SymbolTable) {}

  add(name: string, value: Value): void {
    this.symbols.set(name, value);
  }

  get(name: string): Value | undefined {
    const value = this.symbols.get(name);
    if (!value && this.parent) return this.parent.get(name);
    return value;
  }

  set(name: string, value: Value): void {
    // TODO: search parent first, then set
    this.symbols.set(name, value);
  }

  remove(name: string): void {
    this.symbols.delete(name);
  }
}

import Value from './values/mod.ts';

export default class Scope {
  symbols = new Map<string, Value>();

  constructor(public name: string, public parent?: Scope) {}

  add(name: string, value: Value): void {
    this.symbols.set(name, value);
  }

  get(name: string): Value | undefined {
    const value = this.symbols.get(name);
    if (!value && this.parent) return this.parent.get(name);
    return value;
  }

  set(name: string, value: Value): Value {
    // TODO: search parent first, then set
    this.symbols.set(name, value);
    return value;
  }

  remove(name: string): void {
    this.symbols.delete(name);
  }
}

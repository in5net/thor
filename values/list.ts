import Boolean from './boolean.ts';
import Value from './value.ts';

export default class List extends Value {
  constructor(public items: Value[]) {
    super();
  }

  toString() {
    return `[${this.items.join(', ')}]`;
  }

  '+'(other?: Value) {
    if (other instanceof List) return new List([...this.items, ...other.items]);
    if (other instanceof Value) return new List([...this.items, other]);
  }

  '=='(other: Value) {
    if (other instanceof List)
      return new Boolean(
        this.items.length === other.items.length &&
          this.items.every((value, index) => value === other.items[index])
      );
  }

  '!='(other: Value) {
    if (other instanceof List)
      return new Boolean(
        this.items.some((value, index) => value !== other.items[index])
      );
  }

  not() {
    return new Boolean(!this.items.length);
  }
}

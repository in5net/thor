import Boolean from './boolean.ts';
import Number from './number.ts';
import Value from './value.ts';

export default class List extends Value {
  constructor(public items: Value[]) {
    super();
  }

  toString() {
    return `[${this.items.join(', ')}]`;
  }

  '[]'(other: Value) {
    if (other instanceof Number) return this.items[other.value];
  }

  '+'(other?: Value) {
    if (other instanceof List) return new List([...this.items, ...other.items]);
    if (other instanceof Value) return new List([...this.items, other]);
  }

  '*'(other?: Value) {
    if (other instanceof List || other instanceof Number)
      return new List(
        this.items.map(
          (value, i) =>
            (value['*'](
              other instanceof List ? other.items[i] : other
            ) as unknown) as Value
        )
      );
  }

  '/'(other?: Value) {
    if (other instanceof List || other instanceof Number)
      return new List(
        this.items.map(
          (value, i) =>
            (value['/'](
              other instanceof List ? other.items[i] : other
            ) as unknown) as Value
        )
      );
  }

  '∑'() {
    let sum = 0;
    for (const item of this.items) {
      if (item instanceof Number) sum += item.value;
    }
    return new Number(sum);
  }

  '∏'() {
    if (this.items.length === 0) return new Number(0);
    let product = 1;
    for (const item of this.items) {
      if (item instanceof Number) product *= item.value;
    }
    return new Number(product);
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

import Boolean from './boolean';
import Number from './number';
import Value from './value';

export default class List extends Value {
  constructor(public items: Value[]) {
    super();
  }

  toString(): string {
    return `[${this.items.join(', ')}]`;
  }

  override '[]'(other: Value) {
    if (other instanceof Number) return this.items[other.value];
    return undefined;
  }

  override '+'(other?: Value) {
    if (other instanceof List) return new List([...this.items, ...other.items]);
    if (other instanceof Value) return new List([...this.items, other]);
    return undefined;
  }

  override '*'(other?: Value) {
    if (other instanceof List || other instanceof Number)
      return new List(
        this.items.map(
          (value, i) =>
            value['*'](
              other instanceof List ? other.items[i]! : other
            ) as unknown as Value
        )
      );
    return undefined;
  }

  override '/'(other?: Value) {
    if (other instanceof List || other instanceof Number)
      return new List(
        this.items.map(
          (value, i) =>
            value['/'](
              other instanceof List ? other.items[i]! : other
            ) as unknown as Value
        )
      );
    return undefined;
  }

  override '∑'() {
    let sum = 0;
    this.items.forEach(item => {
      if (item instanceof Number) sum += item.value;
    });
    return new Number(sum);
  }

  override '∏'() {
    if (this.items.length === 0) return new Number(0);
    let product = 1;
    this.items.forEach(item => {
      if (item instanceof Number) product *= item.value;
    });
    return new Number(product);
  }

  override '=='(other: Value) {
    if (other instanceof List)
      return new Boolean(
        this.items.length === other.items.length &&
          this.items.every((value, index) => value === other.items[index])
      );
    return undefined;
  }

  override '!='(other: Value) {
    if (other instanceof List)
      return new Boolean(
        this.items.some((value, index) => value !== other.items[index])
      );
    return undefined;
  }

  override not() {
    return new Boolean(!this.items.length);
  }
}

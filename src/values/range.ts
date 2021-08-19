import Number from './number';
import Value from './value';

export default class Range extends Value {
  constructor(public from: number, public to: number, public step = 1) {
    super();
  }

  toString(): string {
    return `<range ${this.from}:${this.to}:${this.step}>`;
  }

  override ':'(other: Value) {
    if (other instanceof Number)
      return new Range(this.from, this.to, other.value);
    return undefined;
  }

  override '[]'(other: Value) {
    if (other instanceof Number)
      return new Number(Math.max(this.from + this.step * other.value, this.to));
    return undefined;
  }
}

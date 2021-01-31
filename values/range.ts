import Number from './number.ts';
import Value from './value.ts';

export default class Range extends Value {
  constructor(public from: number, public to: number, public step = 1) {
    super();
  }

  toString() {
    return `<range ${this.from}:${this.to}:${this.step}>`;
  }

  ':'(other: Value) {
    if (other instanceof Number)
      return new Range(this.from, this.to, other.value);
  }
}

import Boolean from './boolean.ts';
import Number from './number.ts';
import Value from './value.ts';

export default class Complex extends Value {
  constructor(public r: number, public i: number) {
    super();
  }

  toString() {
    return `${this.r} + ${this.i}i`;
  }

  '+'(other?: Value) {
    if (other instanceof Complex)
      return new Complex(this.r + other.r, this.i + other.i);
    if (other instanceof Number)
      return new Complex(this.r + other.value, this.i);
    if (!other) return this;
  }

  '-'(other?: Value) {
    if (other instanceof Complex)
      return new Complex(this.r - other.r, this.i - other.i);
    if (other instanceof Number)
      return new Complex(this.r - other.value, this.i);
    return new Complex(-this.r, -this.i);
  }

  '*'(other: Value) {
    if (other instanceof Complex) {
      const r = this.r * other.r - this.i * other.i;
      const i = this.r * other.i + this.i * other.r;
      return new Complex(r, i);
    }
    if (other instanceof Number)
      return new Complex(this.r * other.value, this.i * other.value);
  }

  '^'(other: Value) {
    if (other instanceof Number && other.value === 2) return this['*'](this);
  }

  '||'() {
    return new Complex(Math.abs(this.r), Math.abs(this.i));
  }

  '⌊⌋'() {
    return new Complex(Math.floor(this.r), Math.floor(this.i));
  }

  '⌈⌉'() {
    return new Complex(Math.ceil(this.r), Math.ceil(this.i));
  }

  '=='(other: Value) {
    if (other instanceof Complex)
      return new Boolean(this.r === other.r && this.i == other.i);
    if (other instanceof Complex)
      return new Boolean(this.r === other.r && this.i == other.i);
  }

  '!='(other: Value) {
    return !this['=='](other);
  }
}

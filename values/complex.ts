import Number from './number.ts';
import Value from './mod.ts';

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
    if (!other) return new Complex(-this.r, -this.i);
  }

  '*'(other?: Value) {
    if (other instanceof Number)
      return new Complex(this.r * other.value, this.i * other.value);
  }

  //   '/'(other?: Value) {
  //     if (other instanceof Number) return new Number(this.value / other.value);
  //
  //   }

  //   '%'(other?: Value) {
  //     if (other instanceof Number) return new Number(this.value % other.value);
  //
  //   }

  //   '^'(other?: Value) {
  //     if (other instanceof Number) return new Number(this.value ** other.value);
  //
  //   }

  '||'() {
    return new Complex(Math.abs(this.r), Math.abs(this.i));
  }

  //   '=='(other?: Value) {
  //     if (other instanceof Number) return new Boolean(this.value === other.value);
  //
  //   }

  //   '!='(other?: Value) {
  //     if (other instanceof Number) return new Boolean(this.value !== other.value);
  //
  //   }

  //   '>'(other?: Value) {
  //     if (other instanceof Number) return new Boolean(this.value > other.value);
  //
  //   }

  //   '>='(other?: Value) {
  //     if (other instanceof Number) return new Boolean(this.value >= other.value);
  //
  //   }

  //   '<'(other?: Value) {
  //     if (other instanceof Number) return new Boolean(this.value < other.value);
  //
  //   }

  //   '<='(other?: Value) {
  //     if (other instanceof Number) return new Boolean(this.value <= other.value);
  //
  //   }

  //   not() {
  //     return new Boolean(!this.value);
  //   }

  //   and(other?: Value) {
  //     if (other instanceof Number)
  //       return new Boolean(!!this.value && !!other.value);
  //
  //   }

  //   or(other?: Value) {
  //     if (other instanceof Number)
  //       return new Boolean(!!this.value || !!other.value);
  //
  //   }
}

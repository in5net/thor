import Boolean from './boolean.ts';
import Complex from './complex.ts';
import Value from './value.ts';

export default class Number extends Value {
  constructor(public value: number) {
    super();
  }

  toString() {
    return this.value.toString();
  }

  '+'(other?: Value) {
    if (other instanceof Number) return new Number(this.value + other.value);
    if (other instanceof Complex) return other['+'](this);
    if (!other) return this;
  }

  '-'(other?: Value) {
    if (other) (other['-']() as Value | undefined)?.['+'](this);
    if (!other) return new Number(-this.value);
  }

  '*'(other: Value) {
    if (other instanceof Number) return new Number(this.value * other.value);
    if (other instanceof Complex) return other['*'](this);
  }

  '/'(other: Value) {
    if (other instanceof Number) return new Number(this.value / other.value);
  }

  '%'(other: Value) {
    if (other instanceof Number) return new Number(this.value % other.value);
  }

  '^'(other: Value) {
    if (other instanceof Number) return new Number(this.value ** other.value);
  }

  '||'() {
    return new Number(Math.abs(this.value));
  }

  '⌊⌋'() {
    return new Number(Math.floor(this.value));
  }

  '⌈⌉'() {
    return new Number(Math.ceil(this.value));
  }

  '=='(other: Value) {
    if (other instanceof Number) return new Boolean(this.value === other.value);
  }

  '!='(other: Value) {
    return this['=='](other);
  }

  '>'(other: Value) {
    if (other instanceof Number) return new Boolean(this.value > other.value);
  }

  '>='(other: Value) {
    if (other instanceof Number) return new Boolean(this.value >= other.value);
  }

  '<'(other: Value) {
    if (other instanceof Number) return new Boolean(this.value < other.value);
  }

  '<='(other: Value) {
    if (other instanceof Number) return new Boolean(this.value <= other.value);
  }

  not() {
    return new Boolean(!this.value);
  }

  and(other: Value) {
    if (other instanceof Number)
      return new Boolean(!!this.value && !!other.value);
  }

  or(other: Value) {
    if (other instanceof Number)
      return new Boolean(!!this.value || !!other.value);
  }
}

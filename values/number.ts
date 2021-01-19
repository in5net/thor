import Boolean from './boolean.ts';
import Complex from './complex.ts';
import Iterator from './iterator.ts';
import List from './list.ts';
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
    if (other instanceof Number) return new Number(this.value - other.value);
    if (other instanceof Complex) return other['-']()!['+'](this);
    if (!other) return new Number(-this.value);
  }

  '±'() {
    return new List([this, this['-']()!]);
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

  '√'() {
    return new Number(Math.sqrt(this.value));
  }

  '!'() {
    return new Number(factorial(this.value));
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

  ':'(other: Value) {
    if (other instanceof Number) {
      function* next(this: Number) {
        for (let i = this.value; i < (other as Number).value; i++) {
          yield new Number(i);
        }
      }
      return new Iterator(next.call(this));
    }
  }

  '=='(other: Value) {
    if (other instanceof Number) return new Boolean(this.value === other.value);
  }

  '!='(other: Value) {
    return new Boolean(!this['=='](other));
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

  in(other: Value) {
    if (other instanceof List)
      return new Boolean(
        other.items.some(
          value => value instanceof Number && this.value === value.value
        )
      );
  }
}

function factorial(x: number): number {
  if (x <= 1) return 1;
  return x * factorial(x - 1);
}

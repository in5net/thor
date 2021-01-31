import Boolean from './boolean.ts';
import List from './list.ts';
import Number from './number.ts';
import Value from './value.ts';

export default class String extends Value {
  constructor(public value: string) {
    super();
  }

  toString() {
    return this.value.toString();
  }

  '[]'(other: Value) {
    if (other instanceof Number) return new String(this.value[other.value]);
  }

  '+'(other?: Value) {
    if (
      other instanceof String ||
      other instanceof Number ||
      other instanceof Boolean
    )
      return new String(this.value + other.value);
    if (other instanceof List) return new String(this.value + other.toString());
    if (!other) return new Number(+this.value);
  }

  '*'(other: Value) {
    if (other instanceof Number)
      return new String(this.value.repeat(other.value));
  }

  '×'(other: Value) {
    return this['*'](other);
  }

  '=='(other: Value) {
    if (other instanceof String) return new Boolean(this.value === other.value);
  }

  '!='(other: Value) {
    if (other instanceof String) return new Boolean(this.value !== other.value);
  }

  '>'(other: Value) {
    if (other instanceof String)
      return new Boolean(this.value.length > other.value.length);
    if (other instanceof Number)
      return new Boolean(this.value.length > other.value);
  }

  '>='(other: Value) {
    if (other instanceof String)
      return new Boolean(this.value.length >= other.value.length);
    if (other instanceof Number)
      return new Boolean(this.value.length >= other.value);
  }

  '<'(other: Value) {
    if (other instanceof String)
      return new Boolean(this.value.length < other.value.length);
    if (other instanceof Number)
      return new Boolean(this.value.length < other.value);
  }

  '<='(other: Value) {
    if (other instanceof String)
      return new Boolean(this.value.length <= other.value.length);
    if (other instanceof Number)
      return new Boolean(this.value.length <= other.value);
  }

  not() {
    return new Boolean(!this.value);
  }

  and(other: Value) {
    if (other instanceof String)
      return new Boolean(!!this.value && !!other.value);
  }

  or(other: Value) {
    if (other instanceof String)
      return new Boolean(!!this.value || !!other.value);
  }
}

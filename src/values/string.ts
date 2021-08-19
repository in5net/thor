import Boolean from './boolean';
import List from './list';
import Number from './number';
import Value from './value';

export default class String extends Value {
  constructor(public value: string) {
    super();
  }

  toString(): string {
    return this.value;
  }

  override '[]'(other: Value) {
    if (other instanceof Number) return new String(this.value[other.value]!);
    return undefined;
  }

  override '+'(other?: Value) {
    if (
      other instanceof String ||
      other instanceof Number ||
      other instanceof Boolean
    )
      return new String(this.value + other.value);
    if (other instanceof List) return new String(this.value + other.toString());
    if (!other) return new Number(+this.value);
    return undefined;
  }

  override '*'(other: Value) {
    if (other instanceof Number)
      return new String(this.value.repeat(other.value));
    return undefined;
  }

  override '×'(other: Value) {
    return this['*'](other);
  }

  override '=='(other: Value) {
    if (other instanceof String) return new Boolean(this.value === other.value);
    return undefined;
  }

  override '!='(other: Value) {
    if (other instanceof String) return new Boolean(this.value !== other.value);
    return undefined;
  }

  override '>'(other: Value) {
    if (other instanceof String)
      return new Boolean(this.value.length > other.value.length);
    if (other instanceof Number)
      return new Boolean(this.value.length > other.value);
    return undefined;
  }

  override '>='(other: Value) {
    if (other instanceof String)
      return new Boolean(this.value.length >= other.value.length);
    if (other instanceof Number)
      return new Boolean(this.value.length >= other.value);
    return undefined;
  }

  override '<'(other: Value) {
    if (other instanceof String)
      return new Boolean(this.value.length < other.value.length);
    if (other instanceof Number)
      return new Boolean(this.value.length < other.value);
    return undefined;
  }

  override '<='(other: Value) {
    if (other instanceof String)
      return new Boolean(this.value.length <= other.value.length);
    if (other instanceof Number)
      return new Boolean(this.value.length <= other.value);
    return undefined;
  }

  override not() {
    return new Boolean(!this.value);
  }

  override and(other: Value) {
    if (other instanceof String)
      return new Boolean(!!this.value && !!other.value);
    return undefined;
  }

  override or(other: Value) {
    if (other instanceof String)
      return new Boolean(!!this.value || !!other.value);
    return undefined;
  }
}

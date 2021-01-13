import Value from './value.ts';

export default class Boolean extends Value {
  constructor(public value: boolean) {
    super();
  }

  toString() {
    return this.value.toString();
  }

  '=='(other?: Value) {
    if (other instanceof Boolean)
      return new Boolean(this.value === other.value);
  }

  '!='(other?: Value) {
    if (other instanceof Boolean)
      return new Boolean(this.value !== other.value);
  }

  not() {
    return new Boolean(!this.value);
  }

  and(other?: Value) {
    if (other instanceof Boolean)
      return new Boolean(this.value && !!other.value);
  }

  or(other?: Value) {
    if (other instanceof Boolean)
      return new Boolean(this.value || !!other.value);
  }
}

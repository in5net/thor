import { yellow } from 'colors';

import Value from './value';

export default class Boolean extends Value {
  constructor(public value: boolean) {
    super();
  }

  toString(): string {
    return this.value.toString();
  }
  override toPrint(): string {
    return yellow(this.toString());
  }

  override '=='(other: Value) {
    if (other instanceof Boolean)
      return new Boolean(this.value === other.value);
    return undefined;
  }

  override '!='(other: Value) {
    if (other instanceof Boolean)
      return new Boolean(this.value !== other.value);
    return undefined;
  }

  override not() {
    return new Boolean(!this.value);
  }

  override and(other: Value) {
    if (other instanceof Boolean)
      return new Boolean(this.value && !!other.value);
    return undefined;
  }

  override or(other: Value) {
    if (other instanceof Boolean)
      return new Boolean(this.value || !!other.value);
    return undefined;
  }
}

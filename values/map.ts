import Boolean from './boolean.ts';
import String from './string.ts';
import Value from './value.ts';

export default class HashMap extends Value {
  constructor(public map = new Map<string, Value>()) {
    super();
  }

  toString() {
    return `{
  ${[...this.map.entries()].map(([key, value]) => `${key}: ${value}`).join(`,
  `)}
}`;
  }

  '[]'(other: Value) {
    if (other instanceof String) return this.map.get(other.value);
  }

  not() {
    return new Boolean(!this.map.size);
  }
}

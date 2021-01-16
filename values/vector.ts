import Boolean from './boolean.ts';
import Complex from './complex.ts';
import List from './list.ts';
import Number from './number.ts';
import Value from './value.ts';

export default class Vector extends Value {
  constructor(public components: number[]) {
    super();
  }

  toString() {
    return `<${this.components.join(', ')}>`;
  }

  '+'(other?: Value) {
    if (other instanceof Vector) {
      const length = Math.max(this.components.length, other.components.length);
      const components = [];
      for (let i = 0; i < length; i++) {
        components.push(this.components[i] || 0 + other.components[i] || 0);
      }
      return new Vector(components);
    }
    if (other instanceof Number) return other['+'](this);
    if (!other) return this;
  }

  '-'(other?: Value): Vector | undefined {
    if (other instanceof Vector) return this['+'](other['-']()) as Vector;
    if (other instanceof Number)
      return new Vector(this.components.map(x => x - other.value));
    if (!other) return new Vector(this.components.map(x => -x));
  }

  '±'() {
    return new List([this, this['-']()!]);
  }

  '*'(other: Value) {
    if (other instanceof Vector)
      return new Number(
        this.components.reduce(
          (sum, x, i) => sum + x * (other.components[i] || 0),
          0
        )
      );
  }

  '||'() {
    return new Vector(this.components.map(Math.abs));
  }

  '⌊⌋'() {
    return new Vector(this.components.map(Math.floor));
  }

  '⌈⌉'() {
    return new Vector(this.components.map(Math.ceil));
  }

  '=='(other: Value) {
    if (other instanceof Vector) {
      if (this.components.length !== other.components.length)
        return new Boolean(false);
      return new Boolean(
        this.components.every((x, i) => x === other.components[i])
      );
    }
  }

  '!='(other: Value) {
    return new Boolean(!this['=='](other));
  }
}

function factorial(x: number): number {
  if (x <= 1) return 1;
  return x * factorial(x - 1);
}

import { yellow } from 'colors';

import Boolean from './boolean';
import List from './list';
import Number from './number';
import Value from './value';

export default class Vector extends Value {
  components: Float64Array;

  constructor(components: number[] | Float64Array) {
    super();
    this.components = new Float64Array(components);
  }

  toString(): string {
    return `⟨${[...this.components]
      .map(x => yellow(x.toString()))
      .join(', ')}⟩`;
  }
  override toPrint(): string {
    return `vec${this.components.length} <${this.components.join(', ')}>`;
  }

  override '+'(other?: Value) {
    if (other instanceof Vector) {
      const length = Math.max(this.components.length, other.components.length);
      const components = [];
      for (let i = 0; i < length; i++) {
        components.push(this.components[i] || 0 + other.components[i]! || 0);
      }
      return new Vector(components);
    }
    if (other instanceof Number) return other['+'](this);
    if (!other) return this;
    return undefined;
  }

  override '-'(other?: Value): Vector | undefined {
    if (other instanceof Vector) return this['+'](other['-']()) as Vector;
    if (other instanceof Number)
      return new Vector(this.components.map(x => x - other.value));
    if (!other) return new Vector(this.components.map(x => -x));
    return undefined;
  }

  override '±'() {
    return new List([this, this['-']()!]);
  }

  override '*'(other: Value) {
    if (other instanceof Vector)
      return new Vector(
        this.components.map((x, i) => x * (other.components[i] || 0))
      );
    if (other instanceof Number)
      return new Vector(this.components.map(x => x * other.value));
    return undefined;
  }

  override '∙'(other: Value) {
    if (other instanceof Vector)
      return new Number(
        this.components.reduce(
          (sum, x, i) => sum + x * (other.components[i] || 0),
          0
        )
      );
    return undefined;
  }

  override '×'(other: Value) {
    if (this.components.length !== 3)
      throw new Error('Cross product of 2 vectors must both have lengths of 3');
    if (other instanceof Vector) {
      if (other.components.length !== 3)
        throw new Error(
          'Cross product of 2 vectors must both have lengths of 3'
        );
      const [x1, y1, z1] = this.components as unknown as [
        number,
        number,
        number
      ];
      const [x2, y2, z2] = other.components as unknown as [
        number,
        number,
        number
      ];
      return new Vector([
        y1 * z2 - z1 * y2,
        z1 * x2 - x1 * z2,
        x1 * y2 - y1 * x2
      ]);
    }
    return undefined;
  }

  override '||'() {
    return new Vector(this.components.map(Math.abs));
  }

  override '⌊⌋'() {
    return new Vector(this.components.map(Math.floor));
  }

  override '⌈⌉'() {
    return new Vector(this.components.map(Math.ceil));
  }

  override '=='(other: Value) {
    if (other instanceof Vector) {
      if (this.components.length !== other.components.length)
        return new Boolean(false);
      return new Boolean(
        this.components.every((x, i) => x === other.components[i])
      );
    }
    return undefined;
  }

  override '!='(other: Value) {
    return new Boolean(!this['=='](other));
  }
}

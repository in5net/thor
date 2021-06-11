import { rgb24 } from 'https://deno.land/std@0.83.0/fmt/colors.ts';

import Value from './value.ts';

type Mat = number[][] | Float64Array[];

export default class Vector extends Value {
  data: Float64Array[];
  rows: number;
  cols: number;

  constructor(data: Mat) {
    super();
    this.data = data.map((row: Mat[number]) => new Float64Array(row));
    this.rows = data.length;
    this.cols = data[0].length;
  }

  toString(): string {
    return `[
  ${this.data.map(row => row.join(' ')).join(`
  `)}]`;
  }
  toPrint(): string {
    return `mat${this.rows}x${this.cols} [
  ${rgb24(
    this.data.map(row => row.join(' ')).join(`
  `),
    0xffff00
  )}
]`;
  }
}

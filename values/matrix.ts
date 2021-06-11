import { rgb24 } from 'https://deno.land/std@0.83.0/fmt/colors.ts';

import Number from './number.ts';
import Boolean from './boolean.ts';
import Value from './value.ts';

type Mat = number[][] | Float64Array[];

export default class Matrix extends Value {
  data: Float64Array[];
  readonly rows: number;
  readonly cols: number;

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

  '+'(other?: Value) {
    const { data, rows, cols } = this;
    if (other instanceof Matrix) {
      if (rows !== other.rows || cols !== other.cols)
        throw 'Both matrices must be the same shape';
      return new Matrix(
        data.map((row, i) => row.map((x, j) => x + other.data[i][j]))
      );
    }
    if (other instanceof Number)
      return new Matrix(data.map(row => row.map(x => x + other.value)));
    if (!other) return this;
  }

  '-'(other?: Value) {
    const { data, rows, cols } = this;
    if (other instanceof Matrix) {
      if (rows !== other.rows || cols !== other.cols)
        throw 'Both matrices must be the same shape';
      return new Matrix(
        data.map((row, i) => row.map((x, j) => x - other.data[i][j]))
      );
    }
    if (other instanceof Number)
      return new Matrix(data.map(row => row.map(x => x - other.value)));
    if (!other) return new Matrix(data.map(row => row.map(x => -x)));
  }

  '*'(other: Value) {
    const { data, rows, cols } = this;
    if (other instanceof Matrix) {
      if (cols !== other.rows)
        throw 'The columns of the left bust match the rows of the right';

      const ans: Mat = [];
      for (let i = 0; i < rows; i++) {
        ans[i] = [];
        for (let j = 0; j < other.cols; j++) {
          let sum = 0;
          for (let k = 0; k < cols; k++) {
            sum += data[i]![k]! * other.data[k]![j]!;
          }
          ans[i]![j] = sum;
        }
      }
      return new Matrix(ans);
    }
    if (other instanceof Number)
      return new Matrix(data.map(row => row.map(x => x * other.value)));
  }

  '=='(other: Value) {
    const { data, rows, cols } = this;
    if (other instanceof Matrix) {
      if (rows !== other.rows || cols !== other.cols) return new Boolean(false);
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (data[i][j] !== other.data[i][j]) return new Boolean(false);
        }
      }
      return new Boolean(true);
    }
  }
}

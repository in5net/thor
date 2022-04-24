import { rgb24 } from 'fmt/colors.ts';

import Value from './value.ts';

export default class Bytes extends Value {
  constructor(public value: Uint8Array) {
    super();
  }

  toString(): string {
    return this.value.toString();
  }
  toPrint(): string {
    return `bytes [${[...this.value]
      .map(v => rgb24(v.toString(16), 0xffff00))
      .join(', ')}]`;
  }
}

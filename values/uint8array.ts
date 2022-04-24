import { rgb24 } from 'fmt/colors.ts';

import Value from './value.ts';

export default class Uint8Array extends Value {
  constructor(public value: globalThis.Uint8Array) {
    super();
  }

  toString(): string {
    return this.value.toString();
  }
  toPrint(): string {
    return `uint8[] [${[...this.value]
      .map(v => rgb24(v.toString(), 0xffff00))
      .join(', ')}]`;
  }
}

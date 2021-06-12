import { green } from 'https://deno.land/std@0.83.0/fmt/colors.ts';

export default class Position {
  constructor(
    readonly text: string,
    public row = 0,
    public col = 0,
    public index = 0
  ) {}

  static EOF = new Position('', -1, -1, -1);

  static textBetween(p1: Position, p2: Position) {
    return green(p1.text.slice(p1.index, p2.index));
  }

  copy(): Position {
    return new Position(this.text, this.row, this.col, this.index);
  }

  advance() {
    const char = this.text[this.index++];
    if (char === '\n') {
      this.row++;
      this.col = 0;
    }
  }
}

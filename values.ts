export default abstract class Value {
  abstract toString(): string;
}

export class Number implements Value {
  constructor(public value: number) {}

  toString() {
    return this.value.toString();
  }
}

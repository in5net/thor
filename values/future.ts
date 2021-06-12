import Value from './value.ts';

export default class Future<T extends Value = Value> extends Value {
  constructor(readonly promise: Promise<T>) {
    super();
  }

  toString(): string {
    return 'future';
  }
}

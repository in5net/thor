import Value from './value';

export default class Future<T extends Value = Value> extends Value {
  constructor(readonly promise: Promise<T>) {
    super();
  }

  toString(): string {
    return 'future';
  }
}

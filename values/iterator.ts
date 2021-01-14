import Value from './value.ts';

export default class Iterator extends Value {
  constructor(public generator: Generator<Value>) {
    super();
  }

  toString() {
    return '<iterator>';
  }
}

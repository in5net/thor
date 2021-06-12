import Value from './value.ts';

export default class None extends Value {
  toString(): string {
    return 'none';
  }
}

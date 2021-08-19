import Value from './value';

class NoneValue extends Value {
  override toString(): string {
    return 'none';
  }
}

const None = new NoneValue();
export default None;

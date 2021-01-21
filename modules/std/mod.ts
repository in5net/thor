import Value, { Complex, List, Number, String } from '../../values/mod.ts';

export default { '∞': new Number(Infinity) };
export const i = new Complex(0, 1);

export const π = new Number(Math.PI);
export const PI = π;
export const τ = new Number(Math.PI * 2);
export const TAU = τ;
export const e = new Number(Math.E);
export const Φ = new Number((1 + Math.sqrt(5)) / 2);
export const PHI = Φ;

export function print(messages: Value[]) {
  console.log(messages.join(' '));
  return new Number(0);
}

export function input([message]: Value[]) {
  if (message instanceof String) return new String(prompt(message.value) || '');
  return new String(prompt() || '');
}

export function len([value]: Value[]) {
  if (value instanceof List) return new Number(value.items.length);
  if (value instanceof Complex) return new Number(Math.hypot(value.r, value.i));
  throw 'len() must receive a list or complex number';
}

export function min(nums: Value[]) {
  if (nums[0] instanceof List) return _min((nums[0] as List).items);
  return _min(nums);
}

export function max(nums: Value[]) {
  if (nums[0] instanceof List) return _max((nums[0] as List).items);
  return _max(nums);
}

export function random([min, max]: Value[]) {
  switch (arguments.length) {
    case 0:
      return new Number(Math.random());
    case 1:
      if (min instanceof Number) return new Number(Math.random() * min.value);
      if (min instanceof List)
        return min.items[Math.floor(Math.random() * min.items.length)];
      break;
    case 2:
      if (min instanceof Number && max instanceof Number)
        return new Number(Math.random() * (max.value - min.value) + min.value);
  }
  throw `random() must receive up to 2 numbers or a list`;
}

function _min(array: Value[]): Number {
  let min = Infinity;
  for (const value of array) {
    if (value instanceof Number && value.value < min) min = value.value;
  }
  return new Number(min);
}

function _max(array: Value[]): Number {
  let max = -Infinity;
  for (const value of array) {
    if (value instanceof Number && value.value > max) max = value.value;
  }
  return new Number(max);
}

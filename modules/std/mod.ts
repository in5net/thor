import Value, { Complex, List, Number, String } from '../../values/mod.ts';

import funcs from './trigonometry.ts';

export default { '∞': new Number(Infinity), ...funcs };
export const i = new Complex(0, 1);

export const π = new Number(Math.PI);
export const PI = π;
export const τ = new Number(Math.PI * 2);
export const TAU = τ;
export const e = new Number(Math.E);
export const Φ = new Number((1 + Math.sqrt(5)) / 2);
export const PHI = Φ;

export function print(...messages: Value[]) {
  console.log(messages.join(' '));
  return new Number(0);
}

export function input(message?: Value) {
  if (message instanceof String) return new String(prompt(message.value) || '');
  return new String(prompt() || '');
}

export function len(value?: Value) {
  if (value instanceof List) return new Number(value.items.length);
  if (value instanceof Complex) return new Number(Math.hypot(value.r, value.i));
  throw 'len() must receive a list or complex number';
}

export function min(...nums: Value[]) {
  if (nums[0] instanceof List) return _min((nums[0] as List).items);
  return _min(nums);
}

export function max(...nums: Value[]) {
  if (nums[0] instanceof List) return _max((nums[0] as List).items);
  return _max(nums);
}

export function random(min?: Value, max?: Value) {
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

export function norm(n: Value | Number, min: Value, max: Value): Number {
  if (
    !(n instanceof Number) ||
    !(min instanceof Number) ||
    !(max instanceof Number)
  )
    throw 'norm() expects 3 numbers';
  return new Number((n.value - min.value) / (max.value - min.value));
}

export function lerp(min: Value, max: Value, norm: Value): Number {
  if (
    !(min instanceof Number) ||
    !(max instanceof Number) ||
    !(norm instanceof Number)
  )
    throw 'lerp() expects 3 numbers';
  return new Number(min.value + (max.value - min.value) * norm.value);
}

export function map(
  n: Value,
  fromMin: Value,
  fromMax: Value,
  toMin: Value,
  toMax: Value
): Number {
  if (
    !(n instanceof Number) ||
    !(fromMin instanceof Number) ||
    !(fromMax instanceof Number) ||
    !(toMin instanceof Number) ||
    !(toMax instanceof Number)
  )
    throw 'map() expects 5 numbers';
  return lerp(toMin, toMax, norm(n, fromMin, fromMax));
}

export function clamp(n: Value, min: Value, max: Value): Number {
  if (
    !(n instanceof Number) ||
    !(min instanceof Number) ||
    !(max instanceof Number)
  )
    throw 'clamp() expects 3 numbers';
  return new Number(Math.min(Math.max(n.value, min.value), max.value));
}

export function overlap(
  min1: Value,
  max1: Value,
  min2: Value,
  max2: Value
): Number {
  if (
    !(min1 instanceof Number) ||
    !(max1 instanceof Number) ||
    !(min2 instanceof Number) ||
    !(max2 instanceof Number)
  )
    throw 'overlap() expects 4 numbers';
  const [mi1, ma1] = minmax(min1, max1);
  const [mi2, ma2] = minmax(min2, max2);
  const range1 = ma1.value - mi1.value;
  const range2 = ma2.value - mi2.value;
  const range = Math.max(ma1.value, ma2.value) - Math.min(mi1.value, mi2.value);
  return new Number(range1 + range2 - range);
}

export function minmax(a: Value, b: Value): [min: Number, max: Number] {
  if (!(a instanceof Number) || !(b instanceof Number))
    throw 'minmax() expects 2 numbers';
  return [
    new Number(Math.min(a.value, b.value)),
    new Number(Math.max(a.value, b.value))
  ];
}

export function gcd(av: Value, bv: Value): Number {
  if (!(av instanceof Number) || !(bv instanceof Number))
    throw 'gcd() expects 2 numbers';
  let a = av.value;
  let b = bv.value;
  while (b !== 0) [a, b] = [b, a % b];
  return new Number(a);
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

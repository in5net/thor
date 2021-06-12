import { rgb24 } from 'https://deno.land/std@0.83.0/fmt/colors.ts';

import Boolean from './boolean.ts';
import Complex from './complex.ts';
import Range from './range.ts';
import List from './list.ts';
import String from './string.ts';
import { Function } from './function.ts';
import Value from './value.ts';
import type { BinaryOp } from '../token.ts';

export default class Number extends Value {
  constructor(public value: number) {
    super();
  }

  toString() {
    return this.value.toString();
  }
  toPrint(): string {
    return rgb24(this.toString(), 0xffff00);
  }

  operatorFunc(func: Function, op: BinaryOp): Function {
    const opFunc = new Function(func.name, func.argNames, func.body);
    opFunc.execute = async (args: Value[]) =>
      this[op](await func.execute(args)) as Value;
    return opFunc;
  }

  '+'(other?: Value) {
    if (other instanceof Number) return new Number(this.value + other.value);
    if (other instanceof Complex) return other['+'](this);
    if (other instanceof Function) return this.operatorFunc(other, '+');
    if (!other) return this;
  }

  '-'(other?: Value) {
    if (other instanceof Number) return new Number(this.value - other.value);
    if (other instanceof Complex) return other['-']()!['+'](this);
    if (other instanceof Function) return this.operatorFunc(other, '-');
    if (!other) return new Number(-this.value);
  }

  '±'(other?: Value) {
    if (other) return new List([this['+'](other)!, this['-'](other)!]);
    if (!other) return new List([this, this['-']()!]);
  }

  '∓'(other?: Value) {
    return new List(this['±'](other)!.items.reverse());
  }

  '*'(other: Value) {
    if (other instanceof Number) return new Number(this.value * other.value);
    if (other instanceof Complex) return other['*'](this);
    if (other instanceof String) return other['*'](this);
    if (other instanceof Function) return this.operatorFunc(other, '*');
  }

  '×'(other: Value) {
    return this['*'](other);
  }

  '/'(other: Value) {
    if (other instanceof Number) return new Number(this.value / other.value);
  }

  '%'(other: Value) {
    if (other instanceof Number) return new Number(this.value % other.value);
    if (other instanceof Function) return this.operatorFunc(other, '%');
  }

  '^'(other: Value) {
    if (other instanceof Number) return new Number(this.value ** other.value);
    if (other instanceof Function) return this.operatorFunc(other, '^');
  }

  '√'() {
    if (this.value >= 0) return new Number(Math.sqrt(this.value));
    else return new Complex(0, Math.sqrt(-this.value));
  }

  '∛'() {
    return new Number(Math.cbrt(this.value));
  }

  '∜'() {
    if (this.value >= 0) return new Number(Math.sqrt(Math.sqrt(this.value)));
    else return new Complex(0, Math.sqrt(Math.sqrt(-this.value)));
  }

  '!'() {
    return new Number(factorial(this.value));
  }

  '°'() {
    return new Number(this.value * (Math.PI / 180));
  }

  '||'() {
    return new Number(Math.abs(this.value));
  }

  '⌊⌋'() {
    return new Number(Math.floor(this.value));
  }

  '⌈⌉'() {
    return new Number(Math.ceil(this.value));
  }

  ':'(other: Value) {
    if (other instanceof Number) return new Range(this.value, other.value);
  }

  '=='(other: Value) {
    if (other instanceof Number) return new Boolean(this.value === other.value);
  }

  '!='(other: Value) {
    return new Boolean(!this['=='](other));
  }

  '>'(other: Value) {
    if (other instanceof Number) return new Boolean(this.value > other.value);
  }

  '>='(other: Value) {
    if (other instanceof Number) return new Boolean(this.value >= other.value);
  }

  '<'(other: Value) {
    if (other instanceof Number) return new Boolean(this.value < other.value);
  }

  '<='(other: Value) {
    if (other instanceof Number) return new Boolean(this.value <= other.value);
  }

  not() {
    return new Boolean(!this.value);
  }

  and(other: Value) {
    if (other instanceof Number)
      return new Boolean(!!this.value && !!other.value);
  }

  or(other: Value) {
    if (other instanceof Number)
      return new Boolean(!!this.value || !!other.value);
  }

  in(other: Value) {
    if (other instanceof List)
      return new Boolean(
        other.items.some(
          value => value instanceof Number && this.value === value.value
        )
      );
  }
}

function factorial(x: number): number {
  if (x <= 1) return 1;
  return x * factorial(x - 1);
}

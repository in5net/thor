/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { yellow } from 'colors';

import Boolean from './boolean';
import Complex from './complex';
import Range from './range';
import List from './list';
import String from './string';
import { Function } from './function';
import Value from './value';
import type { BinaryOp } from '../token';

export default class Number extends Value {
  constructor(public value: number) {
    super();
  }

  toString(): string {
    return this.value.toString();
  }
  override toPrint(): string {
    return yellow(this.toString());
  }

  operatorFunc(func: Function, op: BinaryOp): Function {
    const opFunc = new Function(func.name, func.argNames, func.body);
    opFunc.execute = async (args: Value[]) =>
      this[op](await func.execute(args)) as Value;
    return opFunc;
  }

  override '+'(other?: Value) {
    if (other instanceof Number) return new Number(this.value + other.value);
    if (other instanceof Complex) return other['+'](this);
    if (other instanceof Function) return this.operatorFunc(other, '+');
    if (!other) return this;
    return undefined;
  }

  override '-'(other?: Value) {
    if (other instanceof Number) return new Number(this.value - other.value);
    if (other instanceof Complex) return other['-']()!['+'](this);
    if (other instanceof Function) return this.operatorFunc(other, '-');
    if (!other) return new Number(-this.value);
    return undefined;
  }

  override '±'(other?: Value) {
    if (other) return new List([this['+'](other)!, this['-'](other)!]);
    if (!other) return new List([this, this['-']()!]);
    return undefined;
  }

  override '∓'(other?: Value) {
    return new List(this['±'](other)!.items.reverse());
  }

  override '*'(other: Value) {
    if (other instanceof Number) return new Number(this.value * other.value);
    if (other instanceof Complex) return other['*'](this);
    if (other instanceof String) return other['*'](this);
    if (other instanceof Function) return this.operatorFunc(other, '*');
    return undefined;
  }

  override '×'(other: Value) {
    return this['*'](other);
  }

  override '/'(other: Value) {
    if (other instanceof Number) return new Number(this.value / other.value);
    return undefined;
  }

  override '%'(other: Value) {
    if (other instanceof Number) return new Number(this.value % other.value);
    if (other instanceof Function) return this.operatorFunc(other, '%');
    return undefined;
  }

  override '^'(other: Value) {
    if (other instanceof Number) return new Number(this.value ** other.value);
    if (other instanceof Function) return this.operatorFunc(other, '^');
    return undefined;
  }

  override '√'() {
    if (this.value >= 0) return new Number(Math.sqrt(this.value));
    return new Complex(0, Math.sqrt(-this.value));
  }

  override '∛'() {
    return new Number(Math.cbrt(this.value));
  }

  override '∜'() {
    if (this.value >= 0) return new Number(Math.sqrt(Math.sqrt(this.value)));
    return new Complex(0, Math.sqrt(Math.sqrt(-this.value)));
  }

  override '!'() {
    return new Number(factorial(this.value));
  }

  override '°'() {
    return new Number(this.value * (Math.PI / 180));
  }

  override '||'() {
    return new Number(Math.abs(this.value));
  }

  override '⌊⌋'() {
    return new Number(Math.floor(this.value));
  }

  override '⌈⌉'() {
    return new Number(Math.ceil(this.value));
  }

  override ':'(other: Value) {
    if (other instanceof Number) return new Range(this.value, other.value);
    return undefined;
  }

  override '=='(other: Value) {
    if (other instanceof Number) return new Boolean(this.value === other.value);
    return undefined;
  }

  override '!='(other: Value) {
    return new Boolean(!this['=='](other));
    return undefined;
  }

  override '>'(other: Value) {
    if (other instanceof Number) return new Boolean(this.value > other.value);
    return undefined;
  }

  override '>='(other: Value) {
    if (other instanceof Number) return new Boolean(this.value >= other.value);
    return undefined;
  }

  override '<'(other: Value) {
    if (other instanceof Number) return new Boolean(this.value < other.value);
    return undefined;
  }

  override '<='(other: Value) {
    if (other instanceof Number) return new Boolean(this.value <= other.value);
    return undefined;
  }

  override not() {
    return new Boolean(!this.value);
  }

  override and(other: Value) {
    if (other instanceof Number)
      return new Boolean(!!this.value && !!other.value);
    return undefined;
  }

  override or(other: Value) {
    if (other instanceof Number)
      return new Boolean(!!this.value || !!other.value);
    return undefined;
  }

  override in(other: Value) {
    if (other instanceof List)
      return new Boolean(
        other.items.some(
          value => value instanceof Number && this.value === value.value
        )
      );
    return undefined;
  }
}

function factorial(x: number): number {
  if (x <= 1) return 1;
  return x * factorial(x - 1);
}

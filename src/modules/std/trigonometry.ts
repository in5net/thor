import Value, { Number } from '../../values';

const names = ['sin', 'cos', 'tan'] as const;
type BaseName = typeof names[number];
type Name = `${'a' | ''}${BaseName}${'h' | ''}`;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const funcs: Record<Name, (x: Value) => Value | undefined> = {};

names.forEach(baseName => {
  (
    [baseName, `a${baseName}`, `${baseName}h`, `a${baseName}h`] as const
  ).forEach(name => {
    funcs[name] = (x: Value) => {
      if (x instanceof Number) return new Number(Math[name](x.value));
      return undefined;
    };
  });
});

export default funcs;

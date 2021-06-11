import Value, { String } from '../../values/mod.ts';

export function readfile(path: Value): String {
  if (!(path instanceof String)) throw 'readfile() expects a string';
  const data = Deno.readTextFileSync(path.value);
  return new String(data);
}

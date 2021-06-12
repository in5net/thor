import Value, { Future, String } from '../../values/mod.ts';

export function readfile(path: Value): Future<String> {
  if (!(path instanceof String)) throw 'readfile() expects a string';
  const data = Deno.readTextFile(path.value).then(str => new String(str));
  return new Future(data);
}

import Value, { Future, None, String } from '../../values/mod.ts';

export function readfile(path: Value): Future<String> {
  if (!(path instanceof String)) throw 'readfile() expects a string';
  const data = Deno.readTextFile(path.value).then(str => new String(str));
  return new Future(data);
}

export function writefile(path: Value, data: Value): Future<None> {
  if (!(path instanceof String) || !(data instanceof String))
    throw 'writefile() expects 2 strings';
  return new Future(
    Deno.writeTextFile(path.value, data.value).then(() => new None())
  );
}

export default {
  delete: (path: Value): Future<None> => {
    if (!(path instanceof String)) throw 'delete() expects a string';
    const data = Deno.remove(path.value).then(() => new None());
    return new Future(data);
  }
};

export function mkdir(path: Value): Future<None> {
  if (!(path instanceof String)) throw 'mkdir() expects a string';
  return new Future(Deno.mkdir(path.value).then(() => new None()));
}

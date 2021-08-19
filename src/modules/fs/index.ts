import fs from 'fs/promises';

import Value, { Future, None, String } from '../../values';

export function readfile(path: Value): Future<String> {
  if (!(path instanceof String)) throw new Error('readfile() expects a string');
  const data = fs.readFile(path.value).then(str => new String(str.toString()));
  return new Future(data);
}

export function writefile(path: Value, data: Value): Future<typeof None> {
  if (!(path instanceof String) || !(data instanceof String))
    throw new Error('writefile() expects 2 strings');
  return new Future(fs.writeFile(path.value, data.value).then(() => None));
}

export default {
  delete: (path: Value): Future<typeof None> => {
    if (!(path instanceof String)) throw new Error('delete() expects a string');
    const data = fs.unlink(path.value).then(() => None);
    return new Future(data);
  }
};

export function mkdir(path: Value): Future<typeof None> {
  if (!(path instanceof String)) throw new Error('mkdir() expects a string');
  return new Future(fs.mkdir(path.value).then(() => None));
}

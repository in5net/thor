import { readFileSync } from 'fs';

import thor from './src/thor';

const text = readFileSync('./code.thor').toString();
thor(text, { safe: true, log: true });

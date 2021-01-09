import run from './thor.ts';

if (Deno.args.length > 1) {
  console.log('Usage: deno run --allow-read main.ts [path]');
  Deno.exit(64);
} else if (Deno.args.length === 1) {
  runFile(Deno.args[0]);
} else {
  runPrompt();
}

function runFile(path: string): void {
  const text = Deno.readTextFileSync(path);
  run(text);
}

function runPrompt(): void {
  while (true) {
    const line = prompt('>');
    if (line === null) break;
    run(line);
  }
}

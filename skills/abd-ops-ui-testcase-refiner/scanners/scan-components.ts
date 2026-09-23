import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] || process.cwd();
const patterns = [/data-testid=/, /aria-label=/, /placeholder=/, /getByRole/, /<button/i, /<input/i, /<select/i];

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules' || entry.name.startsWith('.git')) return [];
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(tsx?|jsx?)$/.test(entry.name) ? [full] : [];
  });
}

for (const file of walk(root)) {
  const text = fs.readFileSync(file, 'utf8');
  if (patterns.some((pattern) => pattern.test(text))) {
    console.log(path.relative(root, file));
  }
}

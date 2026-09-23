import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] || process.cwd();
const routePattern = /(?:path=|path:|route|href=)["'`:{\s]+(\/[A-Za-z0-9_/:.-]*)/g;

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules' || entry.name.startsWith('.git')) return [];
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(tsx?|jsx?)$/.test(entry.name) ? [full] : [];
  });
}

const routes = new Set<string>();
for (const file of walk(root)) {
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(routePattern)) {
    routes.add(match[1]);
  }
}

console.log([...routes].sort().join('\n'));

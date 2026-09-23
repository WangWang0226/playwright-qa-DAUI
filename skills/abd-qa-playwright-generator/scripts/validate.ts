import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] || process.cwd();
const files = walk(path.join(root, 'tests')).filter((file) => file.endsWith('.spec.ts'));
const ids = new Set<string>();

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  for (const match of content.matchAll(/\bTC-(?:UI|API)-[A-Z0-9-]+-\d{3}\b/g)) {
    ids.add(match[0]);
  }
}

console.log(`Found ${ids.size} automated TC IDs in ${files.length} spec files.`);

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

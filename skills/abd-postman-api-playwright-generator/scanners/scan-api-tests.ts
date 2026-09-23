import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] || process.cwd();
const targets = ['api', 'data/api-scenarios', 'tests/api'];

for (const target of targets) {
  const full = path.join(root, target);
  if (!fs.existsSync(full)) continue;
  console.log(`\n# ${target}`);
  for (const file of walk(full).filter((entry) => /\.(ts|md|json)$/.test(entry)).sort()) {
    console.log(path.relative(root, file));
  }
}

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

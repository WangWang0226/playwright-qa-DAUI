import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] || process.cwd();
const dirs = ['api', 'data', 'fixtures', 'pages', 'tests', 'utils', 'scripts'];

for (const dir of dirs) {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) continue;
  console.log(`\n# ${dir}`);
  for (const file of walk(full).filter((entry) => /\.(ts|md|json)$/.test(entry)).sort()) {
    console.log(path.relative(root, file));
  }
}

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules' || entry.name.startsWith('.git')) return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

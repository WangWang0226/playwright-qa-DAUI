import fs from 'node:fs';

const file = process.argv[2];
if (!file) {
  throw new Error('Usage: tsx scripts/validate.ts <spec.md>');
}

const content = fs.readFileSync(file, 'utf8');
const ids = content.match(/\bTC-(?:UI|API)-[A-Z0-9-]+-\d{3}\b/g) || [];

if (ids.length === 0) {
  throw new Error('No TC IDs found.');
}

console.log(`Validated ${file}: ${new Set(ids).size} unique TC IDs found.`);

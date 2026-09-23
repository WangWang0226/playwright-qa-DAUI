import fs from 'node:fs';

const file = process.argv[2];
if (!file) {
  throw new Error('Usage: tsx scripts/validate.ts <postman-collection.json>');
}

const collection = JSON.parse(fs.readFileSync(file, 'utf8'));

if (!collection.info || !Array.isArray(collection.item)) {
  throw new Error('Input does not look like a Postman collection.');
}

console.log(`Valid Postman collection: ${collection.info.name || '(unnamed)'}`);

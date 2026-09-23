import fs from 'node:fs';

const file = process.argv[2];
if (!file) {
  throw new Error('Usage: tsx scripts/inspect-collection.ts <postman-collection.json>');
}

const collection = JSON.parse(fs.readFileSync(file, 'utf8'));

function walk(items: any[], prefix: string[] = []) {
  for (const item of items || []) {
    const path = [...prefix, item.name].filter(Boolean);
    if (item.request) {
      const method = item.request.method || 'GET';
      const url = item.request.url?.raw || item.request.url || '';
      console.log(`${path.join(' > ')} | ${method} ${url}`);
    }
    if (item.item) walk(item.item, path);
  }
}

walk(collection.item || []);

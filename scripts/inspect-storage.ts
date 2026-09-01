import fs from 'node:fs';

const storagePath = process.argv[2] || 'auth/admin.storageState.json';
const storage = JSON.parse(fs.readFileSync(storagePath, 'utf8'));
const origin = storage.origins?.find((entry: { origin: string }) => entry.origin.includes('daui.34.36.111.7.nip.io'));
const localStorageEntries = Object.fromEntries(
  (origin?.localStorage || []).map((entry: { name: string; value: string }) => [entry.name, entry.value])
);

const user = parseJson(localStorageEntries.scotia_user);
const accounts = parseJson(localStorageEntries.scotia_accounts) || [];

console.log('User:', user);
console.log('Accounts:', Array.isArray(accounts) ? accounts.length : 0);
if (Array.isArray(accounts)) {
  console.table(
    accounts.map((account: any) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      jurisdiction: account.jurisdiction,
      currency: account.currency
    }))
  );
}

function parseJson(value: unknown) {
  if (typeof value !== 'string') return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

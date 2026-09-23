import fs from 'node:fs';
import path from 'node:path';

type ConfluenceConfig = {
  baseUrl?: string;
  pageId?: string;
  username?: string;
  email?: string;
  apiToken?: string;
};

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('--dryRun');
const configPath = readArg('--config') || path.resolve(process.cwd(), 'confluence-config.json');
const baseUrlArg = readArg('--base-url');
const pageIdArg = readArg('--page-id');
const pageUrl = readArg('--page-url') || 'https://confluence.agile.bns/spaces/DIA/pages/1666690868/QA';

const config = readConfig(configPath);
const pageInfo = parsePageUrl(pageUrl);
const username = config.username || config.email;
const apiToken = config.apiToken;

if (!username) {
  throw new Error('Missing username/email in confluence-config.json.');
}
if (!apiToken) {
  throw new Error('Missing apiToken in confluence-config.json.');
}

const baseUrl = normalizeBaseUrl(baseUrlArg) || normalizeBaseUrl(config.baseUrl) || pageInfo.baseUrl;
const pageId = pageIdArg || pageInfo.pageId || config.pageId;

if (!baseUrl || !pageId) {
  throw new Error('Missing Confluence baseUrl/pageId. Provide --page-url or config baseUrl/pageId.');
}

const headers = {
  Authorization: `Basic ${Buffer.from(`${username}:${apiToken}`, 'utf8').toString('base64')}`,
  Accept: 'application/json',
  'Content-Type': 'application/json'
};

const endpoint = `${baseUrl}/rest/api/content/${pageId}`;

console.log('Testing Confluence access...');
console.log(`Base URL: ${baseUrl}`);
console.log(`Page ID : ${pageId}`);
console.log(`User    : ${username}`);

const page = await confluenceFetch(`${endpoint}?expand=version,body.storage`, {
  method: 'GET',
  headers
});

console.log('GET succeeded.');
console.log(`Title   : ${page.title}`);
console.log(`Version : ${page.version.number}`);

if (dryRun) {
  console.log('Dry run enabled. Skipping PUT update.');
  process.exit(0);
}

const timestamp = new Date().toISOString();
const marker = `<p><em>Playwright QA Confluence update test succeeded at ${timestamp}.</em></p>`;
const body = {
  id: String(pageId),
  type: 'page',
  title: page.title,
  version: {
    number: Number(page.version.number) + 1,
    message: 'Playwright QA update permission test'
  },
  body: {
    storage: {
      value: `${page.body.storage.value}\n${marker}`,
      representation: 'storage'
    }
  }
};

await confluenceFetch(endpoint, {
  method: 'PUT',
  headers,
  body: JSON.stringify(body)
});

console.log('PUT succeeded. Page update permission is working.');
console.log(`Updated page: ${pageUrl}`);

function readArg(name: string) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function readConfig(filePath: string): ConfluenceConfig {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Config file not found: ${filePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as ConfluenceConfig;
}

function parsePageUrl(url: string) {
  const match = url.match(/^(https?:\/\/[^/]+).*\/pages\/(\d+)\//);
  if (!match) {
    return { baseUrl: undefined, pageId: undefined };
  }

  return {
    baseUrl: match[1],
    pageId: match[2]
  };
}

function normalizeBaseUrl(baseUrl?: string) {
  return baseUrl?.replace(/\/$/, '');
}

async function confluenceFetch(url: string, init: RequestInit) {
  const response = await fetch(url, init);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Confluence request failed: ${response.status} ${response.statusText}\n${text}`);
  }

  return text ? JSON.parse(text) : undefined;
}

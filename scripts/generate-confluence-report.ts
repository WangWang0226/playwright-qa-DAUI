import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

type ConfluenceConfig = {
  baseUrl?: string;
  pageId?: string;
  pageUrl?: string;
  username?: string;
  email?: string;
  apiToken?: string;
};

type TcStatus = 'active' | 'skipped' | 'pending';

type TcSummary = {
  id: string;
  title: string;
  status: TcStatus;
  activeSpecs: string[];
  skippedSpecs: string[];
};

const args = process.argv.slice(2);
const updateConfluence = args.includes('--update-confluence') || args.includes('--updateConfluence');
const dryRun = args.includes('--dry-run') || args.includes('--dryRun') || !updateConfluence;
const configPath = path.resolve(process.cwd(), readArg('--config') || 'confluence-config.json');
const specPath = path.resolve(process.cwd(), readArg('--spec') || 'playwright-test-cases.spec.md');
const testsRoot = path.resolve(process.cwd(), readArg('--tests') || 'tests');
const scenariosRoot = path.resolve(process.cwd(), readArg('--scenarios') || 'data/scenarios');
const apiScenariosRoot = path.resolve(process.cwd(), readArg('--api-scenarios') || 'data/api-scenarios');
const outputJson = path.resolve(process.cwd(), readArg('--output') || 'reports/automation-progress.json');
const outputHtml = path.resolve(process.cwd(), readArg('--html-output') || 'reports/confluence-report.html');
const pageUrlArg = readArg('--page-url');
const baseUrlArg = readArg('--base-url');
const pageIdArg = readArg('--page-id');

const tcIdsFromSpec = extractTcCasesFromSpec(specPath);
const specFiles = listFiles(testsRoot).filter(file => file.endsWith('.spec.ts'));
const specCoverage = extractSpecCoverage(specFiles, testsRoot);
mergeScenarioCoverage(specCoverage.active, scenariosRoot);
mergeScenarioCoverage(specCoverage.active, apiScenariosRoot);
const tcSummaries = buildTcSummaries(tcIdsFromSpec, specCoverage);
const workflowSummaries = buildWorkflowSummaries(specFiles, testsRoot);
const totals = summarize(tcSummaries, workflowSummaries);

const report = {
  generatedAt: new Date().toISOString(),
  generatedBy: os.userInfo().username,
  sourceSpec: path.relative(process.cwd(), specPath),
  testsRoot: path.relative(process.cwd(), testsRoot),
  summary: totals,
  testCases: tcSummaries,
  workflows: workflowSummaries
};

fs.mkdirSync(path.dirname(outputJson), { recursive: true });
fs.writeFileSync(outputJson, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

const confluenceBody = buildConfluenceBody(report);
fs.mkdirSync(path.dirname(outputHtml), { recursive: true });
fs.writeFileSync(outputHtml, confluenceBody, 'utf8');

printSummary(totals, outputJson, outputHtml);

if (!updateConfluence) {
  console.log('Dry run only. Add --update-confluence to push this report to Confluence.');
  process.exit(0);
}

const config = readConfig(configPath);
const pageInfo = parsePageUrl(pageUrlArg || config.pageUrl || config.pageId || '');
const baseUrl = normalizeBaseUrl(baseUrlArg) || normalizeBaseUrl(config.baseUrl) || pageInfo.baseUrl;
const pageId = pageIdArg || pageInfo.pageId || normalizePageId(config.pageId);
const username = config.username || config.email;
const apiToken = config.apiToken;

if (!baseUrl || !pageId) {
  throw new Error('Missing Confluence baseUrl/pageId. Provide confluence-config.json, --page-url, or --base-url/--page-id.');
}
if (!apiToken) {
  throw new Error('Missing apiToken in confluence-config.json.');
}

const headers = {
  Authorization: buildAuthHeader(username, apiToken),
  Accept: 'application/json',
  'Content-Type': 'application/json'
};

const endpoint = `${baseUrl}/rest/api/content/${pageId}`;

console.log(`Fetching Confluence page ${pageId} from ${baseUrl}...`);
const page = await confluenceFetch(`${endpoint}?expand=version`, { method: 'GET', headers });

if (dryRun) {
  console.log('Dry run enabled. Skipping Confluence PUT.');
  process.exit(0);
}

console.log(`Updating Confluence page "${page.title}" to version ${Number(page.version.number) + 1}...`);
await confluenceFetch(endpoint, {
  method: 'PUT',
  headers,
  body: JSON.stringify({
    id: String(pageId),
    type: 'page',
    title: page.title,
    version: {
      number: Number(page.version.number) + 1,
      message: 'Update Playwright QA automation report'
    },
    body: {
      storage: {
        value: confluenceBody,
        representation: 'storage'
      }
    }
  })
});

console.log('Confluence page updated successfully.');
console.log(`Page: ${baseUrl}/pages/viewpage.action?pageId=${pageId}`);

function readArg(name: string) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function extractTcCasesFromSpec(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  const cases = new Map<string, string>();
  const headingPattern = /^###\s+(TC-(?:UI|API)-[A-Z0-9-]+-\d{3})\s+-\s+(.+)$/gm;
  for (const match of content.matchAll(headingPattern)) {
    cases.set(match[1], match[2].trim());
  }

  for (const id of uniqueMatches(content, /\bTC-(?:UI|API)-[A-Z0-9-]+-\d{3}\b/g)) {
    if (!cases.has(id)) {
      cases.set(id, id);
    }
  }

  return cases;
}

function extractSpecCoverage(files: string[], root: string) {
  const active = new Map<string, Set<string>>();
  const skipped = new Map<string, Set<string>>();

  for (const file of files) {
    const relative = path.relative(root, file);
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);

    for (const line of lines) {
      const isSkipped = /^\s*test\.skip\s*\(/.test(line);
      const isActive = !isSkipped && /^\s*test\s*\(/.test(line);
      if (!isSkipped && !isActive) continue;

      for (const id of uniqueMatches(line, /\bTC-(?:UI|API)-[A-Z0-9-]+-\d{3}\b/g)) {
        const target = isSkipped ? skipped : active;
        if (!target.has(id)) target.set(id, new Set());
        target.get(id)?.add(relative);
      }
    }
  }

  return { active, skipped };
}

function mergeScenarioCoverage(active: Map<string, Set<string>>, scenariosRoot: string) {
  const scenarioFiles = listFiles(scenariosRoot).filter(file => file.endsWith('.ts'));
  for (const file of scenarioFiles) {
    const relative = path.relative(process.cwd(), file);
    const content = fs.readFileSync(file, 'utf8');

    for (const id of uniqueMatches(content, /\bTC-(?:UI|API)-[A-Z0-9-]+-\d{3}\b/g)) {
      if (!active.has(id)) active.set(id, new Set());
      active.get(id)?.add(relative);
    }
  }
}

function buildTcSummaries(tcCases: Map<string, string>, coverage: ReturnType<typeof extractSpecCoverage>) {
  return [...tcCases.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, title]): TcSummary => {
      const activeSpecs = [...(coverage.active.get(id) || [])].sort();
      const skippedSpecs = [...(coverage.skipped.get(id) || [])].sort();
      const status: TcStatus = activeSpecs.length > 0 ? 'active' : skippedSpecs.length > 0 ? 'skipped' : 'pending';
      return { id, title, status, activeSpecs, skippedSpecs };
    });
}

function buildWorkflowSummaries(files: string[], root: string) {
  return files
    .filter(file => path.relative(root, file).startsWith(`workflows${path.sep}`))
    .sort()
    .map(file => {
      const content = fs.readFileSync(file, 'utf8');
      const active = countMatches(content, /^\s*test\s*\(/gm);
      const skipped = countMatches(content, /^\s*test\.skip\s*\(/gm);
      return {
        name: path.basename(file).replace(/\.spec\.ts$/, ''),
        file: path.relative(root, file),
        active,
        skipped,
        total: active + skipped
      };
    });
}

function summarize(testCases: TcSummary[], workflows: ReturnType<typeof buildWorkflowSummaries>) {
  const activeTCs = testCases.filter(tc => tc.status === 'active').length;
  const skippedTCs = testCases.filter(tc => tc.status === 'skipped').length;
  const pendingTCs = testCases.filter(tc => tc.status === 'pending').length;
  const totalTCs = testCases.length;
  const coverage = totalTCs > 0 ? round(activeTCs / totalTCs * 100) : 0;

  return {
    totalTCs,
    activeTCs,
    skippedTCs,
    pendingTCs,
    coverage,
    workflowSpecFiles: workflows.length,
    workflowActiveTests: workflows.reduce((sum, workflow) => sum + workflow.active, 0),
    workflowSkippedTests: workflows.reduce((sum, workflow) => sum + workflow.skipped, 0),
    workflowTotalTests: workflows.reduce((sum, workflow) => sum + workflow.total, 0)
  };
}

function buildConfluenceBody(report: {
  generatedAt: string;
  generatedBy: string;
  summary: ReturnType<typeof summarize>;
  testCases: TcSummary[];
  workflows: ReturnType<typeof buildWorkflowSummaries>;
}) {
  const summary = report.summary;
  const tcRows = report.testCases.map(tc => {
    const specs = [...tc.activeSpecs, ...tc.skippedSpecs].join('<br />') || '-';
    return `<tr><td><strong>${escapeHtml(tc.id)}</strong></td><td>${escapeHtml(tc.title)}</td><td>${statusBadge(tc.status)}</td><td>${specs}</td></tr>`;
  }).join('\n');

  const workflowRows = report.workflows.map(workflow => {
    const status = workflow.active > 0 ? 'active' : workflow.skipped > 0 ? 'skipped' : 'pending';
    return `<tr><td><strong>${escapeHtml(workflow.name)}</strong></td><td>${workflow.total}</td><td>${workflow.active}</td><td>${workflow.skipped}</td><td>${statusBadge(status)}</td></tr>`;
  }).join('\n');

  return `
<h2>Digital Asset Playwright QA Automation Report</h2>
<p><em>Last updated: ${formatDate(report.generatedAt)} by ${escapeHtml(report.generatedBy)}</em></p>

<h3>Summary</h3>
<table>
  <tbody>
    <tr><th>Metric</th><th>Value</th></tr>
    <tr><td>Total TC IDs</td><td><strong>${summary.totalTCs}</strong></td></tr>
    <tr><td>Executable TC Coverage</td><td><strong>${summary.coverage}%</strong></td></tr>
    <tr><td>Active TC IDs</td><td>${summary.activeTCs}</td></tr>
    <tr><td>Skipped / Blocked TC IDs</td><td>${summary.skippedTCs}</td></tr>
    <tr><td>Pending TC IDs</td><td>${summary.pendingTCs}</td></tr>
    <tr><td>Workflow Spec Files</td><td>${summary.workflowSpecFiles}</td></tr>
    <tr><td>Workflow Tests</td><td>${summary.workflowTotalTests} total (${summary.workflowActiveTests} active, ${summary.workflowSkippedTests} skipped)</td></tr>
  </tbody>
</table>

<h3>Test Case Coverage</h3>
<table>
  <tbody>
    <tr><th>TC ID</th><th>Title</th><th>Status</th><th>Spec Files</th></tr>
    ${tcRows}
  </tbody>
</table>

<h3>Workflow Tests</h3>
<table>
  <tbody>
    <tr><th>Workflow</th><th>Total</th><th>Active</th><th>Skipped</th><th>Status</th></tr>
    ${workflowRows}
  </tbody>
</table>

<p><em>Source: Playwright QA repo. Generated by <code>scripts/generate-confluence-report.ts</code>.</em></p>
`.trim();
}

function statusBadge(status: string) {
  const colour = status === 'active' ? 'Green' : status === 'skipped' ? 'Yellow' : 'Red';
  const title = status.toUpperCase();
  return `<ac:structured-macro ac:name="status"><ac:parameter ac:name="colour">${colour}</ac:parameter><ac:parameter ac:name="title">${title}</ac:parameter></ac:structured-macro>`;
}

function printSummary(summary: ReturnType<typeof summarize>, jsonPath: string, htmlPath: string) {
  console.log('');
  console.log('Digital Asset Playwright QA Automation Report');
  console.log('-------------------------------------');
  console.log(`Total TC IDs       : ${summary.totalTCs}`);
  console.log(`Executable coverage: ${summary.coverage}%`);
  console.log(`Active TC IDs      : ${summary.activeTCs}`);
  console.log(`Skipped TC IDs     : ${summary.skippedTCs}`);
  console.log(`Pending TC IDs     : ${summary.pendingTCs}`);
  console.log(`Workflow tests     : ${summary.workflowTotalTests} total (${summary.workflowActiveTests} active, ${summary.workflowSkippedTests} skipped)`);
  console.log(`JSON report        : ${path.relative(process.cwd(), jsonPath)}`);
  console.log(`Confluence HTML    : ${path.relative(process.cwd(), htmlPath)}`);
  console.log('');
}

function listFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
  });
}

function readConfig(filePath: string): ConfluenceConfig {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Config file not found: ${filePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as ConfluenceConfig;
}

function parsePageUrl(url: string) {
  const match = url.match(/^(https?:\/\/[^/]+).*\/pages\/(\d+)/);
  if (!match) {
    return { baseUrl: undefined, pageId: undefined };
  }

  return { baseUrl: match[1], pageId: match[2] };
}

function normalizePageId(pageId?: string) {
  if (!pageId) return undefined;
  const match = pageId.match(/\/pages\/(\d+)/);
  return match ? match[1] : /^\d+$/.test(pageId) ? pageId : undefined;
}

function normalizeBaseUrl(baseUrl?: string) {
  return baseUrl?.replace(/\/$/, '');
}

function buildAuthHeader(username: string | undefined, apiToken: string) {
  if (username) {
    return `Basic ${Buffer.from(`${username}:${apiToken}`, 'utf8').toString('base64')}`;
  }

  return `Bearer ${apiToken}`;
}

async function confluenceFetch(url: string, init: RequestInit) {
  const response = await fetch(url, init);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Confluence request failed: ${response.status} ${response.statusText}\n${text}`);
  }

  return text ? JSON.parse(text) : undefined;
}

function uniqueMatches(content: string, pattern: RegExp) {
  return [...new Set([...content.matchAll(pattern)].map(match => match[0]))];
}

function countMatches(content: string, pattern: RegExp) {
  return [...content.matchAll(pattern)].length;
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function formatDate(iso: string) {
  return iso.replace('T', ' ').slice(0, 16);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

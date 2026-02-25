#!/usr/bin/env node
/**
 * Auto-Documentation Generator
 * Scans the codebase and generates comprehensive project documentation.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(
  process.env.HOME || '/home/openclaw',
  'alleato-project-manager',
  'docs'
);

function scanRoutes(dir, prefix = '') {
  const routes = [];
  if (!fs.existsSync(dir)) return routes;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'api') continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Check for page.tsx in this directory
      const pagePath = path.join(fullPath, 'page.tsx');
      if (fs.existsSync(pagePath)) {
        const routePath = `${prefix}/${entry.name}`.replace(/\[([^\]]+)\]/g, ':$1');
        routes.push({
          path: routePath,
          file: path.relative(PROJECT_ROOT, pagePath),
        });
      }
      // Recurse into subdirectories
      routes.push(...scanRoutes(fullPath, `${prefix}/${entry.name}`));
    }
  }

  return routes;
}

function scanApiRoutes(dir, prefix = '/api') {
  const routes = [];
  if (!fs.existsSync(dir)) return routes;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const routePath = path.join(fullPath, 'route.ts');
      if (fs.existsSync(routePath)) {
        const content = fs.readFileSync(routePath, 'utf8');
        const methods = [];
        if (content.includes('export async function GET') || content.includes('export function GET')) methods.push('GET');
        if (content.includes('export async function POST') || content.includes('export function POST')) methods.push('POST');
        if (content.includes('export async function PUT') || content.includes('export function PUT')) methods.push('PUT');
        if (content.includes('export async function PATCH') || content.includes('export function PATCH')) methods.push('PATCH');
        if (content.includes('export async function DELETE') || content.includes('export function DELETE')) methods.push('DELETE');

        routes.push({
          path: `${prefix}/${entry.name}`,
          file: path.relative(PROJECT_ROOT, routePath),
          methods,
        });
      }
      routes.push(...scanApiRoutes(fullPath, `${prefix}/${entry.name}`));
    }
  }

  return routes;
}

function parseMigrationSQL(filePath) {
  const tables = [];
  if (!fs.existsSync(filePath)) return tables;

  const content = fs.readFileSync(filePath, 'utf8');
  const tableRegex = /CREATE TABLE IF NOT EXISTS (\w+)\s*\(([\s\S]*?)\);/g;
  let match;

  while ((match = tableRegex.exec(content)) !== null) {
    const tableName = match[1];
    const columnsStr = match[2];
    const columns = [];

    for (const line of columnsStr.split('\n')) {
      const trimmed = line.trim().replace(/,$/, '');
      if (!trimmed || trimmed.startsWith('--') || trimmed.startsWith('CONSTRAINT') || trimmed.startsWith('UNIQUE')) continue;

      const colMatch = trimmed.match(/^(\w+)\s+(.+)/);
      if (colMatch) {
        const name = colMatch[1];
        const typeStr = colMatch[2].replace(/\s*(REFERENCES|DEFAULT|PRIMARY|NOT NULL).*/, '').trim();
        const isPK = trimmed.includes('PRIMARY KEY');
        const isFK = trimmed.includes('REFERENCES');
        const notNull = trimmed.includes('NOT NULL');
        const hasDefault = trimmed.includes('DEFAULT');

        columns.push({
          name,
          type: typeStr,
          primaryKey: isPK,
          foreignKey: isFK,
          notNull: notNull || isPK,
          hasDefault,
        });
      }
    }

    tables.push({ name: tableName, columns });
  }

  return tables;
}

function scanModules(filePath) {
  const modules = [];
  if (!fs.existsSync(filePath)) return modules;

  const content = fs.readFileSync(filePath, 'utf8');
  const moduleRegex = /export const (\w+Module):\s*ModuleConfig\s*=\s*\{([\s\S]*?)\n\};/g;
  let match;

  while ((match = moduleRegex.exec(content)) !== null) {
    const name = match[1];
    const body = match[2];

    const tableMatch = body.match(/table:\s*"([^"]+)"/);
    const singularMatch = body.match(/singular:\s*"([^"]+)"/);
    const pluralMatch = body.match(/plural:\s*"([^"]+)"/);

    modules.push({
      name,
      table: tableMatch?.[1] || 'unknown',
      singular: singularMatch?.[1] || 'unknown',
      plural: pluralMatch?.[1] || 'unknown',
    });
  }

  return modules;
}

function readPackageJson() {
  const pkgPath = path.join(PROJECT_ROOT, 'package.json');
  if (!fs.existsSync(pkgPath)) return {};
  return JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
}

function readEnvExample() {
  const envPath = path.join(PROJECT_ROOT, '.env.example');
  if (!fs.existsSync(envPath)) return [];
  return fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((l) => l.trim() && !l.trim().startsWith('#'))
    .map((l) => {
      const eqIdx = l.indexOf('=');
      return eqIdx > 0 ? l.slice(0, eqIdx).trim() : l.trim();
    });
}

function generate() {
  console.log('Generating documentation...');

  const pkg = readPackageJson();
  const routes = scanRoutes(path.join(PROJECT_ROOT, 'src', 'app'));
  const apiRoutes = scanApiRoutes(path.join(PROJECT_ROOT, 'src', 'app', 'api'));
  const tables = parseMigrationSQL(path.join(PROJECT_ROOT, 'pipeline', 'migration.sql'));
  const modules = scanModules(path.join(PROJECT_ROOT, 'src', 'lib', 'modules.ts'));
  const envVars = readEnvExample();

  // Check root page
  if (fs.existsSync(path.join(PROJECT_ROOT, 'src', 'app', 'page.tsx'))) {
    routes.unshift({ path: '/', file: 'src/app/page.tsx' });
  }

  let md = `# Alleato Project Manager

> Construction project management application by Alleato Group

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Data Source | Job Planner API (v1 + v2) |
| Deployment | Vercel |
| Testing | Playwright E2E |
| CI/CD | GitHub Actions |

## Pages (${routes.length})

| Route | Source File |
|-------|------------|
`;

  for (const route of routes) {
    md += `| \`${route.path}\` | \`${route.file}\` |\n`;
  }

  if (apiRoutes.length > 0) {
    md += `\n## API Routes (${apiRoutes.length})\n\n`;
    md += `| Endpoint | Methods | Source File |\n`;
    md += `|----------|---------|-------------|\n`;
    for (const route of apiRoutes) {
      md += `| \`${route.path}\` | ${route.methods.join(', ')} | \`${route.file}\` |\n`;
    }
  }

  md += `\n## Database Tables (${tables.length})\n\n`;
  for (const table of tables) {
    md += `### \`${table.name}\`\n\n`;
    md += `| Column | Type | Constraints |\n`;
    md += `|--------|------|-------------|\n`;
    for (const col of table.columns) {
      const constraints = [
        col.primaryKey ? 'PK' : '',
        col.foreignKey ? 'FK' : '',
        col.notNull ? 'NOT NULL' : '',
        col.hasDefault ? 'DEFAULT' : '',
      ].filter(Boolean).join(', ');
      md += `| ${col.name} | ${col.type} | ${constraints} |\n`;
    }
    md += '\n';
  }

  if (modules.length > 0) {
    md += `## Modules (${modules.length})\n\n`;
    md += `| Module | Table | Display Name |\n`;
    md += `|--------|-------|-------------|\n`;
    for (const mod of modules) {
      md += `| ${mod.name} | \`${mod.table}\` | ${mod.plural} |\n`;
    }
    md += '\n';
  }

  if (envVars.length > 0) {
    md += `## Environment Variables\n\n`;
    md += `| Variable | Description |\n`;
    md += `|----------|-------------|\n`;
    const descriptions = {
      JOBPLANNER_API_KEY: 'Job Planner API authentication key',
      JOBPLANNER_API_V1: 'Job Planner API v1 base URL',
      JOBPLANNER_API_V2: 'Job Planner API v2 base URL',
      SUPABASE_URL: 'Supabase project URL (server-side)',
      SUPABASE_KEY: 'Supabase service role key (server-side)',
      GITHUB_TOKEN: 'GitHub personal access token',
      GITHUB_USERNAME: 'GitHub username',
      GITHUB_REPO: 'GitHub repository name',
      NEXT_PUBLIC_SUPABASE_URL: 'Supabase project URL (client-side)',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'Supabase anonymous key (client-side)',
      VERCEL_TOKEN: 'Vercel deployment token',
      VERCEL_ORG_ID: 'Vercel organization ID',
      VERCEL_PROJECT_ID: 'Vercel project ID',
      SYSTEM_DASHBOARD_PASSWORD: 'Password for /system dashboard',
      LIGHTHOUSE_URL: 'URL for Lighthouse audits',
    };
    for (const v of envVars) {
      md += `| \`${v}\` | ${descriptions[v] || '-'} |\n`;
    }
    md += '\n';
  }

  md += `## Scripts\n\n`;
  md += `| Command | Description |\n`;
  md += `|---------|-------------|\n`;
  const scriptDescriptions = {
    'dev': 'Start development server',
    'build': 'Build production app',
    'start': 'Start production server',
    'lint': 'Run ESLint',
    'sync': 'Sync data from Job Planner to Supabase',
    'setup-db': 'Initialize Supabase database tables',
    'pipeline': 'Run full pipeline (install → setup → sync → build → deploy)',
    'test': 'Run Playwright E2E tests',
    'test:pipeline': 'Run full test → analyze → heal pipeline',
    'test:heal': 'Run self-healing engine',
    'backup': 'Backup all database tables to JSON',
    'docs': 'Generate this documentation',
    'lighthouse': 'Run Lighthouse performance audit',
  };
  for (const [script, desc] of Object.entries(scriptDescriptions)) {
    if (pkg.scripts?.[script]) {
      md += `| \`npm run ${script}\` | ${desc} |\n`;
    }
  }
  md += '\n';

  md += `## Automation (Cron Jobs)\n\n`;
  md += `| Schedule | Script | Description |\n`;
  md += `|----------|--------|-------------|\n`;
  md += `| Every 15 min | \`scripts/sync-cron.sh\` | Sync data from Job Planner |\n`;
  md += `| Every hour | \`scripts/test-heal-cron.sh\` | Run tests + self-healing |\n`;
  md += `| Every 30 min | \`scripts/error-monitor.sh\` | Monitor & fix runtime errors |\n`;
  md += `| Daily midnight | \`scripts/backup-cron.sh\` | Database backup |\n`;
  md += `| Every hour (:30) | \`scripts/lighthouse-cron.sh\` | Performance audit |\n`;
  md += '\n';

  md += `## Quick Start\n\n`;
  md += '```bash\n';
  md += '# One-click setup\n';
  md += 'bash scripts/setup.sh\n\n';
  md += '# Start all automation\n';
  md += './scripts/orchestrate.sh start\n\n';
  md += '# Check system status\n';
  md += './scripts/orchestrate.sh status\n\n';
  md += '# Stop all automation\n';
  md += './scripts/orchestrate.sh stop\n';
  md += '```\n\n';

  md += `---\n*Auto-generated on ${new Date().toISOString()} by \`scripts/generate-docs.mjs\`*\n`;

  // Write documentation
  fs.mkdirSync(DOCS_DIR, { recursive: true });
  const outPath = path.join(DOCS_DIR, 'README.md');
  fs.writeFileSync(outPath, md);
  console.log(`Documentation generated: ${outPath}`);
  console.log(`  ${routes.length} pages, ${apiRoutes.length} API routes, ${tables.length} tables, ${modules.length} modules`);
}

generate();

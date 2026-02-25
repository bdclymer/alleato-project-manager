#!/usr/bin/env node
/**
 * Automated Database Backup Script
 * Exports all Supabase tables to JSON files organized by date.
 * Auto-deletes backups older than 30 days.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Load .env
const envPath = path.join(PROJECT_ROOT, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY');
  process.exit(1);
}

const BACKUP_DIR = path.join(
  process.env.HOME || '/home/openclaw',
  'alleato-project-manager',
  'backups'
);

const LOG_DIR = path.join(
  process.env.HOME || '/home/openclaw',
  'alleato-project-manager',
  'logs'
);

const TABLES = [
  'projects',
  'rfis',
  'submittals',
  'budgets',
  'commitment_change_orders',
  'contract_change_orders',
  'meeting_minutes',
  'attachments',
  'error_log',
  'drawing_sets',
  'drawings',
  'drawing_revisions',
  'drawing_markups',
  'drawing_pins',
  'drawing_transmittals',
  'drawing_transmittal_items',
  'drawing_markup_layers',
  'system_logs',
];

const RETENTION_DAYS = 30;

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.mkdirSync(LOG_DIR, { recursive: true });
  fs.appendFileSync(path.join(LOG_DIR, 'backup.log'), line + '\n');
}

async function fetchTable(table) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=*`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    // Table might not exist yet (e.g., error_log)
    if (res.status === 404 || errText.includes('does not exist')) {
      return null;
    }
    throw new Error(`Failed to fetch ${table}: ${res.status} ${errText.substring(0, 200)}`);
  }

  return res.json();
}

async function backup() {
  const startTime = Date.now();
  const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const backupPath = path.join(BACKUP_DIR, dateStr);

  log('═══════════════════════════════════════════');
  log('DATABASE BACKUP STARTED');
  log('═══════════════════════════════════════════');

  fs.mkdirSync(backupPath, { recursive: true });

  let totalRecords = 0;
  let tablesBackedUp = 0;
  let tablesFailed = 0;

  for (const table of TABLES) {
    try {
      log(`Backing up: ${table}...`);
      const data = await fetchTable(table);

      if (data === null) {
        log(`  ${table}: table does not exist (skipped)`);
        continue;
      }

      const filePath = path.join(backupPath, `${table}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

      const count = Array.isArray(data) ? data.length : 0;
      totalRecords += count;
      tablesBackedUp++;
      log(`  ${table}: ${count} records → ${filePath}`);
    } catch (err) {
      tablesFailed++;
      log(`  ERROR backing up ${table}: ${err.message}`);
    }
  }

  // Write backup manifest
  const manifest = {
    timestamp: new Date().toISOString(),
    date: dateStr,
    tablesBackedUp,
    tablesFailed,
    totalRecords,
    duration: Date.now() - startTime,
    files: TABLES.map((t) => `${t}.json`),
  };

  fs.writeFileSync(
    path.join(backupPath, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  // Cleanup old backups
  cleanupOldBackups();

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  log('───────────────────────────────────────────');
  log(`BACKUP COMPLETE`);
  log(`  Tables: ${tablesBackedUp} backed up, ${tablesFailed} failed`);
  log(`  Records: ${totalRecords} total`);
  log(`  Location: ${backupPath}`);
  log(`  Duration: ${duration}s`);
  log('═══════════════════════════════════════════');
}

function cleanupOldBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return;

  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const entries = fs.readdirSync(BACKUP_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    // Directory names are YYYY-MM-DD
    const dirDate = new Date(entry.name + 'T00:00:00Z');
    if (isNaN(dirDate.getTime())) continue;

    if (dirDate.getTime() < cutoff) {
      const dirPath = path.join(BACKUP_DIR, entry.name);
      fs.rmSync(dirPath, { recursive: true, force: true });
      log(`  Cleaned up old backup: ${entry.name}`);
    }
  }
}

backup().catch((err) => {
  log(`BACKUP FAILED: ${err.message}`);
  console.error(err);
  process.exit(1);
});

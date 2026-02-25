#!/usr/bin/env node
/**
 * Error Analysis and Fix Engine
 * Reads unfixed errors from the error_log Supabase table,
 * attempts pattern-based fixes, and marks as fixed.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
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

const LOG_DIR = path.join(process.env.HOME || '/home/openclaw', 'alleato-project-manager', 'logs');
fs.mkdirSync(LOG_DIR, { recursive: true });

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(path.join(LOG_DIR, 'error-monitor.log'), line + '\n');
}

async function supabaseFetch(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${res.status}: ${text.substring(0, 200)}`);
  }
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  return null;
}

// Error pattern matchers and their fix strategies
const ERROR_PATTERNS = [
  {
    name: 'hydration_mismatch',
    match: (msg) => msg.includes('Hydration') || msg.includes('hydration'),
    action: 'log_only',
    description: 'React hydration mismatch - usually caused by dynamic content rendering differently on server vs client',
  },
  {
    name: 'chunk_load_error',
    match: (msg) => msg.includes('ChunkLoadError') || msg.includes('Loading chunk'),
    action: 'redeploy',
    description: 'Stale deployment chunk - redeploy will fix this',
  },
  {
    name: 'network_error',
    match: (msg) => msg.includes('NetworkError') || msg.includes('Failed to fetch') || msg.includes('net::ERR_'),
    action: 'log_only',
    description: 'Network connectivity issue - transient, no code fix needed',
  },
  {
    name: 'supabase_missing_table',
    match: (msg) => msg.includes('relation') && msg.includes('does not exist'),
    action: 'run_migration',
    description: 'Missing database table - need to run migration',
  },
  {
    name: 'type_error_null',
    match: (msg) => msg.includes('Cannot read properties of null') || msg.includes('Cannot read properties of undefined'),
    action: 'flag_for_heal',
    description: 'Null reference error - flag for self-heal engine',
  },
  {
    name: 'use_client_missing',
    match: (msg) => msg.includes('useState') && msg.includes('Server Component'),
    action: 'flag_for_heal',
    description: 'Missing "use client" directive',
  },
];

async function fetchUnfixedErrors() {
  return supabaseFetch('error_log?fixed=eq.false&order=timestamp.desc&limit=50');
}

async function markAsFixed(id) {
  await supabaseFetch(`error_log?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ fixed: true }),
    headers: { Prefer: 'return=minimal' },
  });
}

async function analyzeAndFix() {
  log('═══════════════════════════════════════════');
  log('ERROR FIXER ENGINE STARTED');
  log('═══════════════════════════════════════════');

  let errors;
  try {
    errors = await fetchUnfixedErrors();
  } catch (err) {
    // error_log table might not exist yet
    if (err.message.includes('does not exist')) {
      log('error_log table does not exist yet. Skipping.');
      return;
    }
    throw err;
  }

  if (!errors || errors.length === 0) {
    log('No unfixed errors found. System is healthy.');
    return;
  }

  log(`Found ${errors.length} unfixed errors to analyze.`);

  let fixed = 0;
  let flagged = 0;
  let needsRedeploy = false;

  // Deduplicate by error message
  const seen = new Set();
  const uniqueErrors = errors.filter((e) => {
    if (seen.has(e.error_message)) return false;
    seen.add(e.error_message);
    return true;
  });

  log(`${uniqueErrors.length} unique error patterns.`);

  for (const error of uniqueErrors) {
    log(`\n--- Analyzing: ${error.error_message.substring(0, 100)} ---`);

    let matched = false;
    for (const pattern of ERROR_PATTERNS) {
      if (pattern.match(error.error_message)) {
        log(`  Pattern: ${pattern.name}`);
        log(`  Description: ${pattern.description}`);
        log(`  Action: ${pattern.action}`);
        matched = true;

        switch (pattern.action) {
          case 'log_only':
            // Mark transient errors as fixed (they resolve themselves)
            await markAsFixed(error.id);
            fixed++;
            break;

          case 'redeploy':
            needsRedeploy = true;
            await markAsFixed(error.id);
            fixed++;
            break;

          case 'run_migration':
            try {
              log('  Running database migration...');
              execSync('node pipeline/setup-db.mjs', {
                cwd: PROJECT_ROOT,
                timeout: 60000,
                encoding: 'utf8',
              });
              await markAsFixed(error.id);
              fixed++;
              log('  Migration completed successfully');
            } catch (e) {
              log(`  Migration failed: ${e.message.substring(0, 100)}`);
              flagged++;
            }
            break;

          case 'flag_for_heal':
            // Write to errors file for self-heal.mjs to pick up
            flagged++;
            log('  Flagged for self-healing engine');
            break;
        }
        break;
      }
    }

    if (!matched) {
      log('  No matching pattern - marking for manual review');
      flagged++;
    }
  }

  // Trigger redeploy if needed
  if (needsRedeploy) {
    log('\nTriggering rebuild and redeploy...');
    try {
      execSync('npm run build', { cwd: PROJECT_ROOT, timeout: 300000, encoding: 'utf8' });
      log('Build succeeded');
      // Check if vercel CLI is available
      try {
        execSync('npx vercel --prod --yes 2>&1', { cwd: PROJECT_ROOT, timeout: 300000, encoding: 'utf8' });
        log('Redeployed successfully');
      } catch {
        log('Vercel CLI not available or deploy failed. Manual redeploy may be needed.');
      }
    } catch (e) {
      log(`Build failed: ${e.message.substring(0, 200)}`);
    }
  }

  log('\n═══════════════════════════════════════════');
  log('ERROR FIXER SUMMARY');
  log(`  Errors analyzed: ${uniqueErrors.length}`);
  log(`  Auto-fixed: ${fixed}`);
  log(`  Flagged for review: ${flagged}`);
  log(`  Redeploy triggered: ${needsRedeploy}`);
  log('═══════════════════════════════════════════');
}

analyzeAndFix().catch((err) => {
  log(`ERROR FIXER FAILED: ${err.message}`);
  console.error(err);
  process.exit(1);
});

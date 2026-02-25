#!/usr/bin/env node
/**
 * Creates the system_logs table in Supabase for automation tracking.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

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

// Extract host from Supabase URL
const hostId = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
const connStr = `postgresql://postgres:${SUPABASE_KEY}@db.${hostId}.supabase.co:5432/postgres`;

async function run() {
  const client = new pg.Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL');

    await client.query(`
      CREATE TABLE IF NOT EXISTS system_logs (
        id BIGSERIAL PRIMARY KEY,
        job_type TEXT NOT NULL,
        status TEXT NOT NULL,
        started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        completed_at TIMESTAMPTZ,
        duration_ms INTEGER,
        summary JSONB DEFAULT '{}',
        error_message TEXT,
        run_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    console.log('Created system_logs table');

    await client.query('CREATE INDEX IF NOT EXISTS idx_system_logs_job_type ON system_logs(job_type, created_at DESC)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_system_logs_created ON system_logs(created_at DESC)');
    console.log('Created indexes');

    // Verify
    const res = await client.query("SELECT count(*) FROM system_logs");
    console.log(`Table verified. Current rows: ${res.rows[0].count}`);

    console.log('Done - system_logs table ready');
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();

/**
 * Run migration by making REST API calls to create/check tables.
 * This uses the Supabase REST API (PostgREST) to verify table access
 * and falls back to creating tables via individual INSERT attempts
 * to trigger auto-creation (won't work), or provides manual instructions.
 *
 * Primary approach: Use the Supabase Management API
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const match = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/);
const projectRef = match?.[1];

// Try to use Supabase Management API
async function tryManagementAPI(sql) {
  // The Management API SQL endpoint
  const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (res.ok) {
    return { success: true, data: await res.json() };
  }
  return { success: false, status: res.status, error: await res.text() };
}

// Try the pg-meta endpoint used by Supabase Studio
async function tryPgMeta(sql) {
  // pg-meta runs alongside PostgREST
  const endpoints = [
    `${SUPABASE_URL}/pg`,
    `${SUPABASE_URL}/pg/query`,
    `https://${projectRef}.supabase.co/pg/query`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "x-connection-encrypted": SUPABASE_KEY,
        },
        body: JSON.stringify({ query: sql }),
      });
      if (res.ok) {
        return { success: true, data: await res.json() };
      }
    } catch {
      // Try next endpoint
    }
  }
  return { success: false };
}

console.log("Trying Supabase Management API...");
let result = await tryManagementAPI("SELECT current_database();");
if (result.success) {
  console.log("Management API available!");
  // Run full migration
  const fs = await import("fs");
  const sql = fs.readFileSync("pipeline/migration-drawings.sql", "utf8");

  // First create base drawings table
  const baseSql = `CREATE TABLE IF NOT EXISTS drawings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    set_name TEXT, drawing_number TEXT, title TEXT, discipline TEXT,
    revision TEXT, revision_date TIMESTAMPTZ, received_date TIMESTAMPTZ,
    status TEXT DEFAULT 'current', file_url TEXT, file_name TEXT,
    file_size BIGINT, markups JSONB DEFAULT '[]', notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
  );`;

  await tryManagementAPI(baseSql);
  result = await tryManagementAPI(sql);
  if (result.success) {
    console.log("Migration completed via Management API!");
    process.exit(0);
  }
  console.log("Management API batch failed:", result.error?.substring(0, 100));
} else {
  console.log(
    `Management API not available (${result.status}): ${result.error?.substring(0, 80)}`
  );
}

console.log("\nTrying pg-meta endpoint...");
result = await tryPgMeta("SELECT 1;");
if (result.success) {
  console.log("pg-meta available!");
} else {
  console.log("pg-meta not available");
}

// Check what's accessible
console.log("\nChecking existing tables via REST API...");
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const tables = [
  "drawings",
  "drawing_sets",
  "drawing_revisions",
  "drawing_markups",
  "drawing_pins",
  "drawing_transmittals",
  "drawing_transmittal_items",
  "drawing_markup_layers",
];

let allExist = true;
for (const t of tables) {
  const { error } = await supabase.from(t).select("id").limit(0);
  const status = error ? "MISSING" : "EXISTS";
  console.log(`  ${t}: ${status}`);
  if (error) allExist = false;
}

if (allExist) {
  console.log("\nAll tables already exist! No migration needed.");
  process.exit(0);
}

console.log("\n========================================");
console.log("MANUAL MIGRATION REQUIRED");
console.log("========================================");
console.log("Run this SQL in the Supabase Dashboard SQL Editor:");
console.log(
  `https://supabase.com/dashboard/project/${projectRef}/sql/new`
);
console.log("\nCopy and paste the contents of:");
console.log("  1. pipeline/migration-v2.sql (lines 191-210 for drawings table)");
console.log("  2. pipeline/migration-drawings.sql (full file)");

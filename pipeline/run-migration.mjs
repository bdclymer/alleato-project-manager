#!/usr/bin/env node
/**
 * Run SQL migration files against Supabase.
 *
 * Requires DATABASE_URL env var for direct PostgreSQL connection,
 * or run the SQL files manually via Supabase Dashboard > SQL Editor.
 *
 * Usage:
 *   DATABASE_URL=postgresql://... node pipeline/run-migration.mjs
 *   node pipeline/run-migration.mjs  (will output instructions if no DB access)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

// Load .env
const envPath = path.join(PROJECT_ROOT, ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

const MIGRATION_FILES = [
  path.join(__dirname, "migration-drawings.sql"),
  path.join(__dirname, "migration-system.sql"),
];

async function runViaPg(files) {
  const pg = await import("pg");
  const client = new pg.default.Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  await client.connect();
  console.log("Connected to database");

  for (const filePath of files) {
    if (!fs.existsSync(filePath)) continue;
    console.log(`\nRunning: ${path.basename(filePath)}`);
    const sql = fs.readFileSync(filePath, "utf8");

    // Split into statements respecting $$ blocks
    const statements = [];
    let current = "";
    let inDollarQuote = false;

    for (const line of sql.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("--") && !inDollarQuote) continue;

      if (line.includes("$$")) {
        const count = (line.match(/\$\$/g) || []).length;
        if (count % 2 === 1) inDollarQuote = !inDollarQuote;
      }

      current += line + "\n";

      if (!inDollarQuote && trimmed.endsWith(";")) {
        const stmt = current.trim();
        if (stmt.length > 1) statements.push(stmt);
        current = "";
      }
    }
    if (current.trim()) statements.push(current.trim());

    let ok = 0, skip = 0, err = 0;
    for (const stmt of statements) {
      try {
        await client.query(stmt);
        ok++;
        process.stdout.write(".");
      } catch (e) {
        if (e.message.includes("already exists")) { skip++; process.stdout.write("s"); }
        else { err++; process.stdout.write("x"); console.error(`\n  ${e.message}`); }
      }
    }
    console.log(`\n  ${ok} ok, ${skip} skipped, ${err} errors`);
  }

  await client.end();
}

async function ensureDrawingsBucket() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  console.log("\nEnsuring drawings storage bucket...");
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.some((b) => b.id === "drawings")) {
    console.log("  Bucket already exists");
    return;
  }

  const { error } = await supabase.storage.createBucket("drawings", {
    public: true,
    fileSizeLimit: 524288000,
    allowedMimeTypes: [
      "application/pdf", "image/png", "image/jpeg", "image/gif",
      "image/webp", "image/svg+xml", "application/acad", "application/x-autocad",
      "application/dxf", "application/x-dxf", "image/vnd.dwg", "image/x-dwg",
    ],
  });

  if (error && !error.message?.includes("already exists")) {
    console.error(`  Error: ${error.message}`);
  } else {
    console.log("  Created successfully");
  }
}

async function main() {
  const files = MIGRATION_FILES.filter((f) => fs.existsSync(f));

  if (DATABASE_URL) {
    await runViaPg(files);
  } else {
    console.log("=================================================");
    console.log("  DATABASE_URL not set — cannot run migrations");
    console.log("  automatically from this environment.");
    console.log("");
    console.log("  To run migrations, either:");
    console.log("  1. Set DATABASE_URL and re-run this script");
    console.log("  2. Copy/paste these SQL files into Supabase");
    console.log("     Dashboard > SQL Editor:");
    for (const f of files) {
      console.log(`     - ${path.basename(f)}`);
    }
    console.log("=================================================");
  }

  await ensureDrawingsBucket();
  console.log("\nDone.");
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});

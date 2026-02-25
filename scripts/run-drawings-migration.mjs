import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY");
  process.exit(1);
}

// Extract project ref
const match = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/);
const projectRef = match?.[1];

// Method 1: Try Supabase pg-meta SQL endpoint (used by Dashboard)
async function tryPgMetaSQL(sql) {
  // The pg-meta endpoint at /pg/query is used by Supabase Dashboard
  const res = await fetch(`${SUPABASE_URL}/pg/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-connection-encrypted": SUPABASE_KEY,
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (res.ok) {
    const data = await res.json();
    return { success: true, data };
  }
  const text = await res.text();
  return { success: false, error: text.substring(0, 200) };
}

// Method 2: Try Supabase REST SQL endpoint
async function tryRestSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql_text: sql }),
  });

  if (res.ok) return { success: true };
  const text = await res.text();
  return { success: false, error: text.substring(0, 200) };
}

// Method 3: Create exec_sql via pg-meta, then use it
async function bootstrapExecSQL() {
  const createFn = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_text text)
    RETURNS void AS $$
    BEGIN
      EXECUTE sql_text;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  const result = await tryPgMetaSQL(createFn);
  return result.success;
}

async function run() {
  console.log("Attempting to run drawings migration...\n");

  // Read SQL files
  const baseDrawingsSQL = `
CREATE TABLE IF NOT EXISTS drawings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  set_name TEXT,
  drawing_number TEXT,
  title TEXT,
  discipline TEXT,
  revision TEXT,
  revision_date TIMESTAMPTZ,
  received_date TIMESTAMPTZ,
  status TEXT DEFAULT 'current',
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  markups JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`;

  const drawingsMigration = fs.readFileSync(
    "pipeline/migration-drawings.sql",
    "utf8"
  );

  // Try Method 1: pg-meta endpoint
  console.log("Method 1: Trying pg-meta SQL endpoint...");
  let result = await tryPgMetaSQL("SELECT 1 AS test;");
  if (result.success) {
    console.log("  pg-meta endpoint available!");

    // Run base drawings table
    console.log("  Creating base drawings table...");
    await tryPgMetaSQL(baseDrawingsSQL);

    // Run drawings migration (split by $$ blocks first, then by ;)
    console.log("  Running drawings migration...");
    // Execute the whole migration as one batch
    result = await tryPgMetaSQL(drawingsMigration);
    if (result.success) {
      console.log("  Migration completed successfully!");
      return true;
    }

    // If batch fails, try individual statements
    console.log("  Batch failed, trying individual statements...");
    const fullSQL = baseDrawingsSQL + "\n" + drawingsMigration;

    // Split carefully handling $$ blocks
    const stmts = splitSQL(fullSQL);
    let ok = 0,
      skip = 0;
    for (const stmt of stmts) {
      const r = await tryPgMetaSQL(stmt + ";");
      if (r.success) {
        ok++;
      } else if (
        r.error?.includes("already exists") ||
        r.error?.includes("does not exist")
      ) {
        ok++;
      } else {
        console.log(`  SKIP: ${r.error?.substring(0, 80)}`);
        skip++;
      }
    }
    console.log(`  Results: ${ok} ok, ${skip} skipped`);
    return ok > 0;
  }
  console.log(`  Not available: ${result.error?.substring(0, 80)}`);

  // Try Method 2: bootstrap exec_sql function
  console.log("\nMethod 2: Trying to bootstrap exec_sql...");
  const bootstrapped = await bootstrapExecSQL();
  if (bootstrapped) {
    console.log("  exec_sql created! Running migration...");
    await tryRestSQL(baseDrawingsSQL);
    const stmts = splitSQL(drawingsMigration);
    let ok = 0,
      skip = 0;
    for (const stmt of stmts) {
      const r = await tryRestSQL(stmt);
      if (r.success || r.error?.includes("already exists")) ok++;
      else skip++;
    }
    console.log(`  Results: ${ok} ok, ${skip} skipped`);
    return ok > 0;
  }
  console.log("  exec_sql bootstrap failed");

  return false;
}

function splitSQL(sql) {
  // Handle $$ blocks (functions/triggers)
  const stmts = [];
  let current = "";
  let inDollarQuote = false;

  const lines = sql.split("\n");
  for (const line of lines) {
    if (line.trim().startsWith("--") && !inDollarQuote) {
      current += line + "\n";
      continue;
    }

    if (line.includes("$$")) {
      inDollarQuote = !inDollarQuote;
    }

    current += line + "\n";

    if (!inDollarQuote && line.trimEnd().endsWith(";")) {
      const trimmed = current.trim();
      if (trimmed.length > 5) {
        // Remove trailing semicolon for individual execution
        stmts.push(trimmed.replace(/;$/, ""));
      }
      current = "";
    }
  }

  if (current.trim().length > 5) {
    stmts.push(current.trim().replace(/;$/, ""));
  }

  return stmts;
}

const success = await run();

if (!success) {
  console.log("\n========================================");
  console.log("MANUAL MIGRATION REQUIRED");
  console.log("========================================");
  console.log(
    "Could not execute SQL automatically. Please run the following SQL"
  );
  console.log("in the Supabase Dashboard SQL Editor:");
  console.log(`  https://supabase.com/dashboard/project/${projectRef}/sql`);
  console.log("\nStep 1: Run the base drawings table:");
  console.log("  Copy from: pipeline/migration-v2.sql (lines 192-210)");
  console.log("\nStep 2: Run the drawings module migration:");
  console.log("  Copy from: pipeline/migration-drawings.sql");
  console.log("\nStep 3: Create the storage bucket:");
  console.log(
    "  Go to Storage > New bucket > Name: 'drawings' > Public: yes"
  );
  process.exit(1);
}

// Create storage bucket
console.log("\nCreating storage bucket...");
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const { data: buckets } = await supabase.storage.listBuckets();
const exists = buckets?.some((b) => b.id === "drawings");

if (exists) {
  console.log("Storage bucket 'drawings' already exists");
} else {
  const { error } = await supabase.storage.createBucket("drawings", {
    public: true,
    fileSizeLimit: 524288000,
    allowedMimeTypes: [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "application/acad",
      "application/x-autocad",
      "application/dxf",
      "application/x-dxf",
      "image/vnd.dwg",
      "image/x-dwg",
    ],
  });

  if (error) {
    console.log(`Storage bucket error: ${error.message}`);
  } else {
    console.log("Storage bucket 'drawings' created successfully!");
  }
}

console.log("\nDone!");

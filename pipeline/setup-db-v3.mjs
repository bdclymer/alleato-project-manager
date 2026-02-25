/**
 * Run v3 migration - additional Procore modules
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY");
  process.exit(1);
}

const sql = readFileSync(join(__dirname, "migration-v3.sql"), "utf-8");

async function run() {
  let createClient;
  try {
    const mod = await import("@supabase/supabase-js");
    createClient = mod.createClient;
  } catch {
    console.error("Run: npm install @supabase/supabase-js");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });

  // Split on semicolons, handling DO $$ blocks
  const statements = [];
  let current = "";
  let inBlock = false;

  for (const line of sql.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("--")) continue;

    if (trimmed.startsWith("DO $$") || trimmed.startsWith("DO $")) {
      inBlock = true;
      current += line + "\n";
      continue;
    }

    if (inBlock) {
      current += line + "\n";
      if (trimmed === "$$;" || trimmed.endsWith("$$;")) {
        statements.push(current.trim());
        current = "";
        inBlock = false;
      }
      continue;
    }

    current += line + "\n";
    if (trimmed.endsWith(";")) {
      const stmt = current.trim();
      if (stmt.length > 1) statements.push(stmt);
      current = "";
    }
  }
  if (current.trim()) statements.push(current.trim());

  console.log(`Running ${statements.length} SQL statements...`);

  let success = 0;
  let skipped = 0;
  let errors = 0;

  for (const stmt of statements) {
    const { error } = await supabase.rpc("exec_sql", { query: stmt });
    if (error) {
      if (error.message?.includes("already exists") || error.message?.includes("duplicate")) {
        skipped++;
        continue;
      }
      // Try with sql_text parameter name
      const { error: error2 } = await supabase.rpc("exec_sql", { sql_text: stmt });
      if (error2) {
        if (error2.message?.includes("already exists") || error2.message?.includes("duplicate")) {
          skipped++;
          continue;
        }
        console.warn(`Warning: ${error2.message}`);
        console.warn(`  Statement: ${stmt.substring(0, 80)}...`);
        errors++;
      } else {
        success++;
      }
    } else {
      success++;
    }
  }

  console.log(`Migration complete: ${success} executed, ${skipped} skipped, ${errors} errors`);
}

run().catch(console.error);

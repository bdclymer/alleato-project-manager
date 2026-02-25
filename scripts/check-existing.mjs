import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Check base tables
const baseTables = [
  "projects",
  "contacts",
  "rfis",
  "submittals",
  "punch_list_items",
  "inspections",
  "observations",
  "incidents",
];

for (const table of baseTables) {
  const { data, error } = await supabase.from(table).select("id").limit(1);
  if (error) {
    console.log(`${table}: MISSING`);
  } else {
    console.log(`${table}: EXISTS`);
  }
}

// Check if there's a DATABASE_URL or similar
console.log("\nDB_URL:", process.env.DATABASE_URL ? "SET" : "NOT SET");
console.log("POSTGRES_URL:", process.env.POSTGRES_URL ? "SET" : "NOT SET");

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const tables = [
  "drawing_sets",
  "drawings",
  "drawing_revisions",
  "drawing_markups",
  "drawing_pins",
  "drawing_transmittals",
  "drawing_transmittal_items",
  "drawing_markup_layers",
];

for (const table of tables) {
  const { data, error } = await supabase
    .from(table)
    .select("id")
    .limit(1);

  if (error) {
    console.log(`${table}: MISSING (${error.message.substring(0, 60)})`);
  } else {
    console.log(`${table}: EXISTS (${data.length} rows sampled)`);
  }
}

// Check storage bucket
const { data: buckets } = await supabase.storage.listBuckets();
const hasBucket = buckets?.some((b) => b.id === "drawings");
console.log(`\nStorage bucket 'drawings': ${hasBucket ? "EXISTS" : "MISSING"}`);

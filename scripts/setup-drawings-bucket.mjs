import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const { data: buckets } = await supabase.storage.listBuckets();
const exists = buckets?.some((b) => b.id === "drawings");

if (exists) {
  console.log("Storage bucket 'drawings' already exists");
} else {
  const { error } = await supabase.storage.createBucket("drawings", {
    public: true,
    fileSizeLimit: 52428800, // 50MB
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
    console.log("Error:", error.message);
  } else {
    console.log("Storage bucket 'drawings' created successfully!");
  }
}

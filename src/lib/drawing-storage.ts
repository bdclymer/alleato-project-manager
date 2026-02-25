import { supabase } from "./supabase";

const BUCKET = "drawings";

export function storagePath(projectId: string, setName: string, revision: string, fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${projectId}/${setName || "general"}/${revision || "initial"}/${Date.now()}_${safeName}`;
}

export async function uploadDrawingFile(
  file: File,
  projectId: string,
  setName: string,
  revision: string
): Promise<{ url: string; path: string; size: number }> {
  const path = storagePath(projectId, setName, revision, file.name);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return {
    url: urlData.publicUrl,
    path,
    size: file.size,
  };
}

export async function uploadMultipleFiles(
  files: File[],
  projectId: string,
  setName: string,
  revision: string,
  onProgress?: (uploaded: number, total: number) => void
): Promise<Array<{ file: File; url: string; path: string; size: number }>> {
  const results: Array<{ file: File; url: string; path: string; size: number }> = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = await uploadDrawingFile(file, projectId, setName, revision);
    results.push({ file, ...result });
    onProgress?.(i + 1, files.length);
  }

  return results;
}

export async function deleteDrawingFile(path: string) {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}

export async function listStorageFiles(projectId: string, prefix?: string) {
  const folder = prefix ? `${projectId}/${prefix}` : projectId;
  const { data, error } = await supabase.storage.from(BUCKET).list(folder);
  if (error) throw error;
  return data || [];
}

export function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

export function isImageFile(fileName: string): boolean {
  const ext = getFileExtension(fileName);
  return ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(ext);
}

export function isPdfFile(fileName: string): boolean {
  return getFileExtension(fileName) === "pdf";
}

export function isCadFile(fileName: string): boolean {
  const ext = getFileExtension(fileName);
  return ["dwg", "dxf"].includes(ext);
}

export function isDrawingFile(fileName: string): boolean {
  return isImageFile(fileName) || isPdfFile(fileName) || isCadFile(fileName);
}

export function getFileIcon(fileName: string): string {
  if (isPdfFile(fileName)) return "pdf";
  if (isCadFile(fileName)) return "cad";
  if (isImageFile(fileName)) return "image";
  return "file";
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export async function ensureBucketExists() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.id === BUCKET);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, {
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
    if (error && !error.message?.includes("already exists")) throw error;
  }
}

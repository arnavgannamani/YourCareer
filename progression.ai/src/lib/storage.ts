import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const BUCKET = "resumes";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function generatePath(userId: string, filename: string): string {
  const ext = filename.split(".").pop() || "dat";
  const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return `${userId}/${stamp}.${ext}`;
}

export async function uploadResume(file: File | Blob, userId: string, filename: string) {
  const path = generatePath(userId, filename);
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: (file as any).type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw error;
  const { data: urlData, error: urlErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60);
  if (urlErr) throw urlErr;
  return { path, signedUrl: urlData.signedUrl };
}

export async function getResumeSignedUrl(path: string) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteResume(path: string) {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}



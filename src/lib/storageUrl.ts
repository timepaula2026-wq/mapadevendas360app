import { supabase } from "@/integrations/supabase/client";

const TRAINING_BUCKET = "training-files";

/**
 * Extracts the object path from a Supabase storage URL of the
 * `training-files` bucket. Returns null if the URL does not belong to it.
 */
export function extractTrainingPath(url: string | null | undefined): string | null {
  if (!url) return null;
  // Canonical stored URLs usually use `/public/`, but some older records may
  // contain a previously signed URL. Extract both so expired signed links are
  // refreshed before the in-app PDF/video viewer receives them.
  const m = url.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/training-files\/([^?]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/**
 * Returns a short-lived signed URL for a training-files asset.
 * If the URL does not point to the private bucket, returns it unchanged.
 */
export async function resolveTrainingUrl(
  url: string | null | undefined,
  expiresIn = 3600
): Promise<string | null> {
  if (!url) return null;
  const path = extractTrainingPath(url);
  if (!path) return url;
  const { data, error } = await supabase.storage
    .from(TRAINING_BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) {
    console.error("createSignedUrl failed", error);
    return url;
  }
  return data.signedUrl;
}
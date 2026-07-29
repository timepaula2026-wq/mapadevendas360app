import { supabase } from "@/integrations/supabase/client";

const TRAINING_BUCKET = "training-files";
const SIGN_TIMEOUT_MS = 10000;

function withTimeout<T>(promise: Promise<T>, ms = SIGN_TIMEOUT_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("Tempo esgotado ao preparar arquivo")), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      }
    );
  });
}

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

async function signThroughBackend(path: string, expiresIn: number): Promise<string | null> {
  const { data, error } = await withTimeout(
    supabase.functions.invoke("sign-training-file", {
      body: { path, expiresIn },
    })
  );

  if (error) {
    console.error("sign-training-file failed", error);
    return null;
  }

  const signedUrl = (data as { signedUrl?: string | null } | null)?.signedUrl;
  return signedUrl || null;
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

  try {
    const { data, error } = await withTimeout(
      supabase.storage.from(TRAINING_BUCKET).createSignedUrl(path, expiresIn)
    );
    if (!error && data?.signedUrl) return data.signedUrl;
    console.error("createSignedUrl failed", error);
  } catch (error) {
    console.error("createSignedUrl timed out", error);
  }

  // Fallback: mobile sessions can fail to sign private files even while the app
  // is logged in. The backend validates the logged-in user and signs with admin
  // privileges, avoiding the infinite PDF loading screen.
  return signThroughBackend(path, expiresIn);
}
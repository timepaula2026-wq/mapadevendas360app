import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

const TRAINING_BUCKET = "training-files";
const REQUEST_TIMEOUT_MS = 10000;
const AUTH_SESSION_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, ms = REQUEST_TIMEOUT_MS, message = "Tempo esgotado ao preparar arquivo"): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = globalThis.setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        globalThis.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        globalThis.clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function isUsableSession(session: Session | null): session is Session {
  if (!session?.access_token) return false;
  if (!session.expires_at) return true;
  return session.expires_at * 1000 > Date.now() + 30_000;
}

async function waitForUsableSession(timeoutMs = AUTH_SESSION_TIMEOUT_MS): Promise<Session | null> {
  try {
    const initial = await withTimeout(
      supabase.auth.getSession(),
      Math.min(4000, timeoutMs),
      "Tempo esgotado ao verificar sessão"
    );
    if (isUsableSession(initial.data.session)) return initial.data.session;
  } catch (error) {
    console.error("getSession failed before signing training file", error);
  }

  return new Promise((resolve) => {
    let finished = false;
    let unsubscribe: (() => void) | null = null;

    const finish = (session: Session | null) => {
      if (finished) return;
      finished = true;
      globalThis.clearTimeout(timer);
      unsubscribe?.();
      resolve(session);
    };

    const timer = globalThis.setTimeout(() => finish(null), timeoutMs);

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isUsableSession(session)) finish(session);
    });
    unsubscribe = () => data.subscription.unsubscribe();
    if (finished) unsubscribe();

    supabase.auth.getSession()
      .then(({ data: sessionData }) => {
        if (isUsableSession(sessionData.session)) finish(sessionData.session);
      })
      .catch(() => {
        // O timeout acima transforma a falta de sessão em erro visível na UI.
      });
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

  const session = await waitForUsableSession();
  if (!session) {
    console.error("Cannot sign training file: authenticated session is not ready or expired");
    return null;
  }

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
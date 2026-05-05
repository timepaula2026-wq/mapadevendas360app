import { useEffect, useState } from "react";
import { resolveTrainingUrl } from "@/lib/storageUrl";

/**
 * Resolves a possibly-private training-files URL into a usable URL
 * (signed if private, untouched otherwise). Returns null while loading.
 */
export function useSignedUrl(url: string | null | undefined): string | null {
  const [resolved, setResolved] = useState<string | null>(url ?? null);
  useEffect(() => {
    let active = true;
    if (!url) {
      setResolved(null);
      return;
    }
    resolveTrainingUrl(url).then((u) => {
      if (active) setResolved(u);
    });
    return () => {
      active = false;
    };
  }, [url]);
  return resolved;
}
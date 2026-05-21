import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TrilhaProgressRow {
  content_id: string;
  section_id: string;
}

export interface TrilhaCertificateRow {
  section_id: string;
  scope: string;
  scope_ref: string | null;
  title: string;
  issued_at: string;
}

export const useTrilhaProgress = () => {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [certificates, setCertificates] = useState<TrilhaCertificateRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async (uid: string) => {
    const [{ data: prog }, { data: certs }] = await Promise.all([
      supabase.from("trilha_progress").select("content_id, section_id").eq("user_id", uid),
      supabase.from("trilha_certificates").select("section_id, scope, scope_ref, title, issued_at").eq("user_id", uid),
    ]);
    setCompleted(new Set((prog || []).map((r) => r.content_id as string)));
    setCertificates((certs as TrilhaCertificateRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id || null;
      if (!active) return;
      setUserId(uid);
      if (!uid) {
        setLoading(false);
        return;
      }
      await fetchAll(uid);
    })();
    return () => {
      active = false;
    };
  }, [fetchAll]);

  const markCompleted = useCallback(
    async (contentId: string, sectionId: string) => {
      if (!userId) return;
      if (completed.has(contentId)) return;
      // Atualização otimista
      setCompleted((prev) => new Set(prev).add(contentId));
      const { error } = await supabase
        .from("trilha_progress")
        .upsert(
          { user_id: userId, content_id: contentId, section_id: sectionId },
          { onConflict: "user_id,content_id" }
        );
      if (error) {
        // reverte se falhou
        setCompleted((prev) => {
          const n = new Set(prev);
          n.delete(contentId);
          return n;
        });
      }
    },
    [userId, completed]
  );

  const issueCertificate = useCallback(
    async (params: { sectionId: string; scope: "tab" | "section" | "global"; scopeRef: string | null; title: string }) => {
      if (!userId) return null;
      const exists = certificates.find(
        (c) => c.section_id === params.sectionId && c.scope === params.scope && (c.scope_ref || null) === params.scopeRef
      );
      if (exists) return exists;
      const row = {
        user_id: userId,
        section_id: params.sectionId,
        scope: params.scope,
        scope_ref: params.scopeRef,
        title: params.title,
      };
      const { data, error } = await supabase
        .from("trilha_certificates")
        .insert(row)
        .select("section_id, scope, scope_ref, title, issued_at")
        .single();
      if (error || !data) return null;
      setCertificates((prev) => [...prev, data as TrilhaCertificateRow]);
      return data as TrilhaCertificateRow;
    },
    [userId, certificates]
  );

  const hasCertificate = useCallback(
    (sectionId: string, scope: "tab" | "section" | "global", scopeRef: string | null) =>
      certificates.some(
        (c) => c.section_id === sectionId && c.scope === scope && (c.scope_ref || null) === scopeRef
      ),
    [certificates]
  );

  return {
    userId,
    loading,
    completed,
    certificates,
    markCompleted,
    issueCertificate,
    hasCertificate,
  };
};
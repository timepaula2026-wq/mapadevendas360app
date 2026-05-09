import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Cloud, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const autosaveSelector = "input, textarea, select";

const PlanejamentoAutoSave = ({
  formKey,
  children,
}: {
  formKey: "mensal" | "semanal" | "prospec" | "ficha";
  children: React.ReactNode;
}) => {
  const { user } = useAuth();
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);
  const [status, setStatus] = useState<"loading" | "saved" | "saving">("loading");
  const storageKey = `planejamento:auto:${user?.id || "local"}:${formKey}`;

  const applyData = (data: unknown) => {
    if (!ref.current || !data || typeof data !== "object") return;
    const fields = Array.from(ref.current.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(autosaveSelector));
    const values = data as Record<string, string>;
    fields.forEach((el, index) => {
      const key = el.getAttribute("data-autosave-key") || String(index);
      if (values[key] !== undefined) el.value = values[key];
    });
  };

  const collectData = () => {
    const fields = Array.from(ref.current?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(autosaveSelector) || []);
    return fields.reduce<Record<string, string>>((acc, el, index) => {
      const key = el.getAttribute("data-autosave-key") || String(index);
      acc[key] = el.value;
      return acc;
    }, {});
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      setStatus("loading");
      const local = localStorage.getItem(storageKey);
      if (local) {
        try { applyData(JSON.parse(local)); } catch { /* ignore */ }
      }
      if (user) {
        const { data } = await supabase
          .from("planejamento_form_drafts" as any)
          .select("data")
          .eq("user_id", user.id)
          .eq("form_key", formKey)
          .maybeSingle();
        const row = data as { data?: unknown } | null;
        if (active && row?.data) {
          localStorage.setItem(storageKey, JSON.stringify(row.data));
          applyData(row.data);
        }
      }
      if (active) setStatus("saved");
    };
    window.setTimeout(load, 0);
    return () => {
      active = false;
      if (timer.current) window.clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formKey, user?.id]);

  const scheduleSave = () => {
    const data = collectData();
    localStorage.setItem(storageKey, JSON.stringify(data));
    setStatus("saving");
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      if (user) {
        await supabase.from("planejamento_form_drafts" as any).upsert(
          { user_id: user.id, form_key: formKey, data },
          { onConflict: "user_id,form_key" }
        );
      }
      setStatus("saved");
    }, 700);
  };

  return (
    <div ref={ref} onInputCapture={scheduleSave} onChangeCapture={scheduleSave}>
      <div className="mb-3 flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground print:hidden">
        {status === "loading" ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Carregando preenchimento...</>
        ) : status === "saving" ? (
          <><Cloud className="w-3.5 h-3.5" /> Salvando automaticamente...</>
        ) : (
          <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Salvo automaticamente</>
        )}
      </div>
      {children}
    </div>
  );
};

export default PlanejamentoAutoSave;
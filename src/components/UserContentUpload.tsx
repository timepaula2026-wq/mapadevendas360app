import { useEffect, useRef, useState } from "react";
import { Upload, Loader2, FileText, Trash2, ExternalLink, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  contentId: string;
}

interface UploadRow {
  id: string;
  file_url: string;
  file_name: string | null;
  created_at: string;
}

const BUCKET = "user-uploads";

const UserContentUpload = ({ contentId }: Props) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [row, setRow] = useState<UploadRow | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Path inside the bucket: file_url stores the storage object path.
  useEffect(() => {
    let active = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id || null;
      if (!active) return;
      setUserId(uid);
      if (!uid) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("user_content_uploads")
        .select("id, file_url, file_name, created_at")
        .eq("content_id", contentId)
        .eq("user_id", uid)
        .maybeSingle();
      if (!active) return;
      setRow((data as UploadRow) || null);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [contentId]);

  // Sign current file for preview/download
  useEffect(() => {
    let active = true;
    if (!row?.file_url) {
      setSignedUrl(null);
      return;
    }
    (async () => {
      const { data } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(row.file_url, 3600);
      if (active) setSignedUrl(data?.signedUrl || null);
    })();
    return () => {
      active = false;
    };
  }, [row?.file_url]);

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !userId) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx. 25 MB)");
      return;
    }
    setBusy(true);
    try {
      // Remove arquivo anterior (se houver) para não acumular lixo
      if (row?.file_url) {
        await supabase.storage.from(BUCKET).remove([row.file_url]);
      }
      const ext = file.name.split(".").pop() || "bin";
      const path = `${userId}/${contentId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          cacheControl: "3600",
          contentType: file.type || undefined,
          upsert: false,
        });
      if (upErr) throw upErr;
      const { data, error } = await supabase
        .from("user_content_uploads")
        .upsert(
          {
            content_id: contentId,
            user_id: userId,
            file_url: path,
            file_name: file.name,
          },
          { onConflict: "content_id,user_id" }
        )
        .select("id, file_url, file_name, created_at")
        .single();
      if (error) throw error;
      setRow(data as UploadRow);
      toast.success("Arquivo enviado!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro no envio";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!row) return;
    if (!confirm("Remover seu arquivo enviado?")) return;
    setBusy(true);
    try {
      await supabase.storage.from(BUCKET).remove([row.file_url]);
      const { error } = await supabase
        .from("user_content_uploads")
        .delete()
        .eq("id", row.id);
      if (error) throw error;
      setRow(null);
      toast.success("Arquivo removido");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao remover";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  if (!userId && !loading) return null;

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Upload className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Envie seu arquivo</h3>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Carregando…
        </div>
      ) : row ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-lg bg-card border border-border p-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground truncate">
                {row.file_name || "Arquivo enviado"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Enviado em {new Date(row.created_at).toLocaleString("pt-BR")}
              </p>
            </div>
            {signedUrl && (
              <a
                href={signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary"
                title="Abrir arquivo"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
            >
              {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              Substituir
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs gap-1 text-destructive hover:text-destructive"
              onClick={handleRemove}
              disabled={busy}
            >
              <Trash2 className="w-3 h-3" /> Remover
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Envie aqui seu arquivo (PDF, imagem ou documento). Apenas você e a administração poderão visualizá-lo.
          </p>
          <Button
            size="sm"
            className="text-xs gap-1"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            Selecionar arquivo
          </Button>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,image/*,.doc,.docx"
        className="hidden"
        onChange={handleSelect}
      />
    </div>
  );
};

export default UserContentUpload;
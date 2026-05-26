import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { UNITS } from "@/lib/units";

interface SupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SupportDialog = ({ open, onOpenChange }: SupportDialogProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [unit, setUnit] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName(""); setEmail(""); setUnit(""); setMessage(""); setFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Preencha nome, e-mail e descrição do problema");
      return;
    }
    setSubmitting(true);
    try {
      let photo_url: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("support-attachments")
          .upload(path, file);
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("support-attachments").getPublicUrl(path);
        photo_url = data.publicUrl;
      }
      const { error } = await supabase.from("support_tickets").insert({
        name: name.trim(),
        email: email.trim(),
        unit: unit || null,
        message: message.trim(),
        photo_url,
      });
      if (error) throw error;
      toast.success("Mensagem enviada! Responderemos em breve no e-mail informado.");
      reset();
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Erro ao enviar: " + (err.message || "tente novamente"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Suporte</DialogTitle>
          <DialogDescription>
            Descreva seu problema. Você não precisa estar logado.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            placeholder="Nome completo *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            required
          />
          <Input
            type="email"
            placeholder="E-mail *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={255}
            required
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full bg-secondary border border-input rounded-md px-3 py-2 text-sm"
          >
            <option value="">Selecione sua unidade</option>
            {UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
          <textarea
            placeholder="Descreva o problema *"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={2000}
            required
            className="w-full bg-secondary border border-input rounded-md px-3 py-2 text-sm resize-none"
          />
          <div>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              <Upload className="w-4 h-4" />
              {file ? file.name : "Anexar foto (opcional)"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
            {file && (
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-xs text-destructive mt-1 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Remover anexo
              </button>
            )}
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Enviar mensagem
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SupportDialog;
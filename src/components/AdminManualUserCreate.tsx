import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { validateEmail } from "@/lib/emailValidation";
import { ROLES } from "@/lib/roles";
import { Checkbox } from "@/components/ui/checkbox";

const ACTIVITIES = [
  { value: "CONSULTOR INICIANTE", label: "Consultor Iniciante" },
  { value: "CONSULTOR AUTORIZADO", label: "Consultor Autorizado" },
  { value: "GESTOR DE UNIDADE", label: "Gestor de Unidade" },
  { value: "ADMINISTRATIVO", label: "Administrativo" },
];

interface Props {
  onCreated?: () => void;
}

export default function AdminManualUserCreate({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [form, setForm] = useState({
    display_name: "",
    email: "",
    phone: "",
    unit: "",
    activity: "CONSULTOR INICIANTE",
    matricula_cpf: "",
  });

  const reset = () => {
    setForm({
      display_name: "",
      email: "",
      phone: "",
      unit: "",
      activity: "CONSULTOR INICIANTE",
      matricula_cpf: "",
    });
    setRoles([]);
  };

  const toggleRole = (r: string) =>
    setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  const submit = async () => {
    if (!form.display_name.trim()) return toast.error("Informe o nome");
    const v = validateEmail(form.email);
    const finalEmail = v.valid ? v.email! : v.suggestion;
    if (!finalEmail) return toast.error(v.error || "E-mail inválido");
    if (v.suggestion && !v.valid) {
      toast.message(`E-mail corrigido para ${finalEmail}`);
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("bulk-import-users", {
        body: {
          rows: [{ ...form, email: finalEmail, roles }],
          password: "123456",
        },
      });
      if (error) throw error;
      const r = (data?.results || [])[0];
      if (!r || r.status === "error" || r.status === "skip") {
        toast.error(r?.message || "Falha ao cadastrar");
      } else {
        toast.success(
          r.status === "created" ? "Usuário criado (senha 123456)" : "Usuário atualizado",
        );
        reset();
        setOpen(false);
        onCreated?.();
      }
    } catch (e: any) {
      toast.error(e?.message || "Erro ao cadastrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <UserPlus className="w-4 h-4" /> Cadastro manual
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastrar novo usuário</DialogTitle>
          <DialogDescription>
            Senha provisória <b>123456</b>. O usuário definirá a senha no primeiro acesso.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome completo *</Label>
            <Input
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
            />
          </div>
          <div>
            <Label>E-mail *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>WhatsApp</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <Label>Matrícula / CPF</Label>
              <Input
                value={form.matricula_cpf}
                onChange={(e) => setForm({ ...form, matricula_cpf: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Unidade</Label>
            <Input
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            />
          </div>
          <div>
            <Label>Atividade / Papel</Label>
            <Select
              value={form.activity}
              onValueChange={(v) => setForm({ ...form, activity: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACTIVITIES.map((a) => (
                  <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={loading} className="gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Cadastrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
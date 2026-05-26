import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForcePasswordChange({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.length < 6) return toast.error("Senha precisa ter ao menos 6 caracteres");
    if (pwd !== pwd2) return toast.error("As senhas não coincidem");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }
    await supabase.from("profiles").update({ must_change_password: false }).eq("user_id", user!.id);
    toast.success("Senha atualizada!");
    setLoading(false);
    onDone();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-8 max-w-sm w-full space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground text-center">Crie sua nova senha</h2>
        <p className="text-sm text-muted-foreground text-center">
          Este é o seu primeiro acesso. Defina uma senha pessoal para continuar usando o app.
        </p>
        <Input type="password" placeholder="Nova senha" value={pwd} onChange={(e) => setPwd(e.target.value)} autoFocus />
        <Input type="password" placeholder="Confirme a senha" value={pwd2} onChange={(e) => setPwd2(e.target.value)} />
        <Button type="submit" disabled={loading} className="w-full gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />} Salvar nova senha
        </Button>
        <button type="button" onClick={() => supabase.auth.signOut()} className="text-xs text-muted-foreground hover:text-foreground w-full text-center">
          Sair
        </button>
      </form>
    </div>
  );
}
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const translateResetError = (raw: string) => {
  const msg = (raw || "").toLowerCase();
  if (msg.includes("auth session missing") || msg.includes("session")) {
    return "Sessão de redefinição não encontrada. Abra o link mais recente do e-mail novamente.";
  }
  if (msg.includes("expired") || msg.includes("invalid")) {
    return "Link expirado ou inválido. Solicite uma nova recuperação de senha.";
  }
  if (msg.includes("password") && msg.includes("characters")) {
    return "A senha deve ter pelo menos 6 caracteres.";
  }
  return raw;
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setIsRecovery(true);
        setChecking(false);
      }
    });

    const hash = window.location.hash || "";
    const search = window.location.search || "";
    if (hash.includes("type=recovery") || hash.includes("access_token") || search.includes("code=")) {
      setIsRecovery(true);
    }

    // Fallback: if a session exists (SDK already exchanged the recovery code), allow form
    (async () => {
      // Give the SDK a brief moment to process the URL
      await new Promise((r) => setTimeout(r, 600));
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) setIsRecovery(true);
      setChecking(false);
    })();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" });
      return;
    }

    if (password.length < 6) {
      toast({ title: "Erro", description: "A senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({
        title: "Erro ao redefinir senha",
        description: translateResetError(error.message) + ` (detalhe: ${error.message})`,
        variant: "destructive",
      });
    } else {
      setSuccess(true);
      toast({ title: "Senha redefinida!", description: "Sua senha foi alterada com sucesso." });
      setTimeout(() => navigate("/"), 2000);
    }
    setSubmitting(false);
  };

  if (!isRecovery && checking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-sm text-center space-y-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Verificando link de redefinição...</p>
        </div>
      </div>
    );
  }

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-sm text-center space-y-4">
          <h2 className="text-lg font-bold text-foreground">Link inválido ou expirado</h2>
          <p className="text-sm text-muted-foreground">
            Abra novamente o e-mail de redefinição e clique no link mais recente. Se o problema persistir, solicite um novo em "Esqueci minha senha".
          </p>
          <button onClick={() => navigate("/auth")} className="text-sm text-primary hover:underline">
            Voltar para o login
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-sm text-center space-y-4">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Senha redefinida!</h2>
          <p className="text-sm text-muted-foreground">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-foreground">Redefinir senha</h1>
          <p className="text-sm text-muted-foreground mt-1">Digite sua nova senha abaixo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nova senha"
              required
              minLength={6}
              className="w-full bg-secondary rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmar nova senha"
              required
              minLength={6}
              className="w-full bg-secondary rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full gradient-gold text-primary-foreground font-semibold py-3 rounded-xl transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Redefinir senha
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;

import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Map, Mail, Lock, User, Loader2, Phone, Building2, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const UNITS = [
  "Araucária",
  "Araçatuba",
  "Almirante Tamandaré",
  "Colombo",
  "Paranaguá",
  "Palácio do Café",
  "Praça do Japão",
  "Pinheiros",
  "Poços de Caldas",
  "São João da Boa Vista",
  "Digital",
];

const Auth = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [unit, setUnit] = useState("");
  const [customUnit, setCustomUnit] = useState("");
  const [unitStartDate, setUnitStartDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "E-mail enviado!", description: "Verifique sua caixa de entrada para redefinir a senha." });
      setForgotMode(false);
    }
    setSubmitting(false);
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const validateConsultor = async (emailToCheck: string): Promise<{ allowed: boolean; message: string } | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("validate-consultor", {
        body: { email: emailToCheck.trim().toLowerCase() },
      });
      if (error) {
        console.error("Erro ao validar consultor:", error);
        toast({ title: "Erro de validação", description: "Não foi possível validar seu cadastro. Tente novamente.", variant: "destructive" });
        return null;
      }
      return data as { allowed: boolean; message: string };
    } catch (err) {
      console.error("Erro ao chamar validação:", err);
      toast({ title: "Erro de validação", description: "Não foi possível validar seu cadastro. Tente novamente.", variant: "destructive" });
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Validate consultant status for both login and signup
    const validation = await validateConsultor(email);
    if (!validation) {
      setSubmitting(false);
      return;
    }
    if (!validation.allowed) {
      toast({
        title: "Acesso bloqueado",
        description: validation.message || "Seu cadastro não está autorizado. Entre em contato com o suporte.",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
      }
    } else {
      if (!displayName.trim()) {
        toast({ title: "Erro", description: "Preencha o nome completo.", variant: "destructive" });
        setSubmitting(false);
        return;
      }
      if (phone.replace(/\D/g, "").length < 10) {
        toast({ title: "Erro", description: "Preencha o telefone com DDD.", variant: "destructive" });
        setSubmitting(false);
        return;
      }
      const finalUnit = unit === "outra" ? customUnit.trim() : unit;
      if (!finalUnit) {
        toast({ title: "Erro", description: "Selecione uma unidade.", variant: "destructive" });
        setSubmitting(false);
        return;
      }
      if (!unitStartDate) {
        toast({ title: "Erro", description: "Informe a data de início na unidade.", variant: "destructive" });
        setSubmitting(false);
        return;
      }

      const { error } = await signUp(email, password, {
        displayName: displayName.trim(),
        phone: phone.replace(/\D/g, ""),
        unit: finalUnit,
        unitStartDate,
      });
      if (error) {
        toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Cadastro realizado!", description: "Verifique seu e-mail para confirmar a conta." });
      }
    }

    setSubmitting(false);
  };

  const inputClass = "w-full bg-secondary rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";

  if (forgotMode) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 gradient-gold rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
              <Mail className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground">Esqueceu a senha?</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Digite seu e-mail para receber o link de redefinição
            </p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="Seu e-mail"
                required
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full gradient-gold text-primary-foreground font-semibold py-3 rounded-xl transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Enviar link
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            <button onClick={() => setForgotMode(false)} className="text-primary font-semibold hover:underline">
              Voltar ao login
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 gradient-gold rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
            <Map className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">
            {isLogin ? "Mapa de Vendas" : "Criar conta"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLogin ? "Acesse aqui sua plataforma de vendas" : "Cadastre-se para começar"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <>
              {/* Nome completo */}
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Nome completo"
                  required
                  className={inputClass}
                />
              </div>

              {/* Telefone com DDD */}
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="Telefone com DDD"
                  required
                  className={inputClass}
                />
              </div>

              {/* Unidade */}
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  required
                  className={`${inputClass} appearance-none`}
                >
                  <option value="">Selecione a unidade</option>
                  {UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                  <option value="outra">Outra</option>
                </select>
              </div>

              {unit === "outra" && (
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    placeholder="Digite o nome da unidade"
                    required
                    className={inputClass}
                  />
                </div>
              )}

              {/* Data de início na unidade */}
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="date"
                  value={unitStartDate}
                  onChange={(e) => setUnitStartDate(e.target.value)}
                  required
                  className={`${inputClass} [color-scheme:dark]`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                  Início na unidade
                </span>
              </div>
            </>
          )}

          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              required
              className={inputClass}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              required
              minLength={6}
              className={inputClass}
            />
          </div>

          {isLogin && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setForgotMode(true)}
                className="text-xs text-primary hover:underline"
              >
                Esqueci minha senha
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full gradient-gold text-primary-foreground font-semibold py-3 rounded-xl transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLogin ? "Entrar" : "Cadastrar"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {isLogin ? "Não tem conta?" : "Já tem conta?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-semibold hover:underline"
          >
            {isLogin ? "Cadastre-se" : "Entrar"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;

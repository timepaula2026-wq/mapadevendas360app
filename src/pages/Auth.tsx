import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, User, Loader2, Building2, IdCard, Headphones, Briefcase, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import logoMapaVendas from "@/assets/mapa-de-vendas-logo.png";
import { validateEmail } from "@/lib/emailValidation";
import { UNITS } from "@/lib/units";
import SupportDialog from "@/components/SupportDialog";

const Auth = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [cpf, setCpf] = useState("");
  const [atividade, setAtividade] = useState("");
  // matrícula removida — validação agora é por nome completo
  const [unit, setUnit] = useState("");
  const [customUnit, setCustomUnit] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [supportOpen, setSupportOpen] = useState(false);
  const [lastErrorReport, setLastErrorReport] = useState<string>("");

  // Classifica a mensagem bruta do Supabase em título + instruções amigáveis
  const classifySignupError = (
    raw: string,
  ): { title: string; description: string; instructions: string[] } => {
    const msg = (raw || "").toLowerCase();

    if (
      msg.includes("already registered") ||
      msg.includes("already been registered") ||
      msg.includes("user already exists") ||
      msg.includes("duplicate key") ||
      msg.includes("email address is already")
    ) {
      return {
        title: "E-mail já cadastrado",
        description: "Este e-mail já possui uma conta na plataforma.",
        instructions: [
          "Se a conta é sua, faça login normalmente.",
          "Esqueceu a senha? Use a opção 'Esqueci minha senha'.",
          "Se não foi você quem se cadastrou, contate o suporte.",
        ],
      };
    }

    if (
      msg.includes("invalid email") ||
      msg.includes("email address") && msg.includes("invalid")
    ) {
      return {
        title: "E-mail inválido",
        description: "O e-mail informado não tem um formato válido.",
        instructions: [
          "Verifique se digitou corretamente (ex.: nome@dominio.com).",
          "Evite espaços antes ou depois do e-mail.",
        ],
      };
    }

    if (
      msg.includes("password") &&
      (msg.includes("short") || msg.includes("weak") || msg.includes("characters") || msg.includes("at least"))
    ) {
      return {
        title: "Senha muito fraca",
        description: "A senha não atende aos requisitos mínimos.",
        instructions: [
          "Use no mínimo 6 caracteres.",
          "Combine letras e números para maior segurança.",
        ],
      };
    }

    if (msg.includes("cpf")) {
      return {
        title: "CPF/Matrícula inválido",
        description: "O CPF ou matrícula informado não pôde ser validado.",
        instructions: [
          "Confira se digitou todos os dígitos corretamente.",
          "Use apenas números, sem pontos ou traços.",
        ],
      };
    }

    if (
      msg.includes("missing") ||
      msg.includes("required") ||
      msg.includes("null value") ||
      msg.includes("not-null")
    ) {
      return {
        title: "Campos obrigatórios faltando",
        description: "Alguns campos obrigatórios não foram preenchidos.",
        instructions: [
          "Verifique se preencheu nome completo, e-mail, atividade e unidade.",
          "Tente novamente após completar os dados.",
        ],
      };
    }

    if (
      msg.includes("rate limit") ||
      msg.includes("too many") ||
      msg.includes("for security purposes")
    ) {
      return {
        title: "Muitas tentativas",
        description: "Você fez muitas tentativas em pouco tempo.",
        instructions: [
          "Aguarde alguns minutos antes de tentar novamente.",
        ],
      };
    }

    if (
      msg.includes("network") ||
      msg.includes("failed to fetch") ||
      msg.includes("timeout")
    ) {
      return {
        title: "Falha de conexão",
        description: "Não foi possível se conectar ao servidor.",
        instructions: [
          "Verifique sua conexão com a internet.",
          "Tente novamente em alguns instantes.",
        ],
      };
    }

    return {
      title: "Erro ao cadastrar",
      description: raw || "Não foi possível concluir o cadastro.",
      instructions: [
        "Confira se todos os campos estão corretos.",
        "Se o problema persistir, contate o suporte.",
      ],
    };
  };

  const buildErrorReport = (errorMessage: string) => {
    const finalUnit = unit === "outra" ? customUnit.trim() : unit;
    const classified = classifySignupError(errorMessage);
    const lines = [
      "=== Detalhes do erro de cadastro ===",
      `Data/hora: ${new Date().toLocaleString("pt-BR")}`,
      `Tipo: ${classified.title}`,
      `Erro: ${errorMessage}`,
      "",
      "Dados informados:",
      `- Nome: ${displayName || "(vazio)"}`,
      `- E-mail: ${email || "(vazio)"}`,
      `- Atividade: ${atividade || "(vazio)"}`,
      `- Unidade: ${finalUnit || "(vazio)"}`,
      `- Matrícula/CPF: ${cpf || "(vazio)"}`,
      "",
      `Navegador: ${navigator.userAgent}`,
      `URL: ${window.location.href}`,
      "",
      "(Por favor descreva abaixo o que estava tentando fazer.)",
      "",
    ].join("\n");
    return lines;
  };

  const showSignupError = (description: string) => {
    const classified = classifySignupError(description);
    const report = buildErrorReport(description);
    setLastErrorReport(report);
    try {
      const log = JSON.parse(localStorage.getItem("signup_error_log") || "[]");
      log.unshift({
        at: new Date().toISOString(),
        type: classified.title,
        error: description,
        report,
      });
      localStorage.setItem("signup_error_log", JSON.stringify(log.slice(0, 20)));
    } catch {}
    toast({
      title: classified.title,
      description: (
        <div className="space-y-1">
          <p>{classified.description}</p>
          <ul className="list-disc pl-4 space-y-0.5 text-xs opacity-90">
            {classified.instructions.map((i, idx) => (
              <li key={idx}>{i}</li>
            ))}
          </ul>
        </div>
      ),
      variant: "destructive",
      duration: 10000,
      action: (
        <ToastAction altText="Contate o suporte" onClick={() => setSupportOpen(true)}>
          Contate o suporte
        </ToastAction>
      ),
    });
  };

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

  const formatCpf = (value: string) => {
    const d = value.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  };

  const validateConsultor = async (nomeToCheck: string): Promise<{ allowed: boolean; message: string; status?: string; nome?: string | null } | null> => {
    const cleanNome = nomeToCheck.trim().replace(/\s+/g, " ");
    if (cleanNome.split(" ").length < 2) {
      return { allowed: false, message: "Informe seu nome completo (nome e sobrenome)." };
    }

    try {
      const { data, error } = await supabase.functions.invoke("validate-consultor", {
        body: { nome: cleanNome },
      });
      if (error) {
        console.error("Erro ao validar consultor:", error);
        return { allowed: false, status: "api_unavailable", message: "Serviço de validação indisponível." };
      }

      return data as { allowed: boolean; message: string; status?: string; nome?: string | null };
    } catch (err) {
      console.error("Erro ao chamar validação:", err);
      return { allowed: false, status: "api_unavailable", message: "Serviço de validação indisponível." };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

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
      if (!atividade) {
        toast({ title: "Erro", description: "Selecione sua atividade.", variant: "destructive" });
        setSubmitting(false);
        return;
      }
      // Validação rigorosa de e-mail
      const emailCheck = validateEmail(email);
      if (!emailCheck.valid) {
        toast({ title: "E-mail inválido", description: emailCheck.error, variant: "destructive" });
        if (emailCheck.suggestion) setEmail(emailCheck.suggestion);
        setSubmitting(false);
        return;
      }
      const finalUnit = unit === "outra" ? customUnit.trim() : unit;
      if (!finalUnit) {
        toast({ title: "Erro", description: "Selecione uma unidade.", variant: "destructive" });
        setSubmitting(false);
        return;
      }

      // Administrativo não passa pela validação Gestão360 — depende de aprovação manual do admin
      const isAdministrativo = atividade === "administrativo" || finalUnit.toLowerCase() === "administrativo";

      if (isAdministrativo) {
        const { error } = await signUp(email, password, {
          displayName: displayName.trim(),
          unit: finalUnit,
        cpf: cpf.trim() || undefined,
          atividade,
          auto_approved: false,
        } as any);
        if (error) {
          showSignupError(error.message);
        } else {
          toast({
            title: "Cadastro recebido!",
            description: "Sua conta administrativa foi criada e aguarda liberação manual do administrador.",
          });
        }
        setSubmitting(false);
        return;
      }

      // Valida nome completo contra a base do Gestão360.
      // Política: se a validação falhar por QUALQUER motivo (não encontrado,
      // inativo, API fora do ar, etc.), o cadastro ainda é criado e fica
      // pendente de aprovação manual do administrador. Apenas quando o nome
      // for validado com sucesso a conta é auto-aprovada.
      const validation = await validateConsultor(displayName);
      if (!validation) {
        setSubmitting(false);
        return;
      }

      const autoApproved = validation.allowed === true;
      const needsManualApproval = !autoApproved;

      const { error } = await signUp(email, password, {
        displayName: displayName.trim(),
        unit: finalUnit,
        cpf: cpf.trim() || undefined,
        atividade,
        auto_approved: autoApproved,
      } as any);
      if (error) {
        showSignupError(error.message);
      } else if (needsManualApproval) {
        toast({
          title: "Cadastro recebido!",
          description:
            validation.message
              ? `${validation.message} Sua conta foi criada e aguarda liberação manual do administrador.`
              : "Não conseguimos validar automaticamente seu nome. Sua conta foi criada e aguarda liberação manual do administrador.",
        });
      } else {
        toast({ title: "Cadastro realizado!", description: "Verifique seu e-mail para confirmar a conta." });
      }
    }

    setSubmitting(false);
  };

  const inputClass = "w-full bg-secondary rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";

  if (forgotMode) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-5"
        style={{
          background:
            "radial-gradient(ellipse at center, #2a0608 0%, #120203 55%, #050102 100%)",
        }}
      >
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
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{
        background:
          "radial-gradient(ellipse at center, #2a0608 0%, #120203 55%, #050102 100%)",
      }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-6">
          <img
            src={logoMapaVendas}
            alt="Mapa de Vendas"
            className="w-full max-w-[22rem] sm:max-w-[26rem] h-auto object-contain mx-auto mb-2 drop-shadow-2xl"
          />
          {!isLogin && (
            <h1 className="text-2xl font-extrabold text-white">Criar conta</h1>
          )}
          <p className="text-sm text-white/60 mt-1">
            {isLogin ? "Acesse aqui sua plataforma de vendas" : "Cadastre-se para começar"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <>
              {/* Aviso importante */}
              <div className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-white/80 leading-relaxed">
                Use o <strong>mesmo nome completo</strong> e o <strong>mesmo e-mail</strong> informados no
                seu cadastro de consultor. Caso contrário, o acesso não será liberado.
              </div>

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

              {/* Atividade */}
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  value={atividade}
                  onChange={(e) => setAtividade(e.target.value)}
                  required
                  className={`${inputClass} appearance-none`}
                >
                  <option value="">Selecione sua atividade</option>
                  <option value="gestor">Gestor</option>
                  <option value="administrativo">Administrativo</option>
                  <option value="iniciante">Consultor Iniciante</option>
                  <option value="autorizado">Consultor Autorizado</option>
                </select>
              </div>

              {/* Matrícula (opcional para iniciantes — concede também o papel de Consultor Autorizado) */}
              {atividade === "iniciante" && (
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="Matrícula (opcional)"
                    className={inputClass}
                  />
                  <p className="mt-1 text-[11px] text-white/50 leading-snug">
                    Se você já é consultor autorizado, informe sua matrícula para liberar o acesso de Consultor Autorizado.
                  </p>
                </div>
              )}

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
              minLength={4}
              className={inputClass}
            />
          </div>

          {isLogin && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setForgotMode(true)}
                className="text-xs font-semibold hover:underline"
                style={{ color: "#e7242b" }}
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
            className="font-semibold hover:underline"
            style={{ color: "#e7242b" }}
          >
            {isLogin ? "Cadastre-se" : "Entrar"}
          </button>
        </p>
      </div>
      <button
        type="button"
        onClick={() => setSupportOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 transition-opacity"
        aria-label="Suporte"
      >
        <Headphones className="w-5 h-5" />
        <span className="text-sm font-semibold hidden sm:inline">Suporte</span>
      </button>
      <SupportDialog
        open={supportOpen}
        onOpenChange={setSupportOpen}
        prefillMessage={lastErrorReport || undefined}
      />
    </div>
  );
};

export default Auth;

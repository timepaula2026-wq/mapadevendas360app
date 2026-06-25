import { Link } from "react-router-dom";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background text-foreground px-5 py-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="space-y-2">
          <Link to="/" className="text-sm text-primary hover:underline">← Voltar</Link>
          <h1 className="text-3xl font-bold">Política de Privacidade</h1>
          <p className="text-sm text-muted-foreground">Plataforma de Gestão de Vendas de Consórcio — última atualização: 02/06/2026</p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Sobre o app</h2>
          <p className="text-sm leading-relaxed">
            A Plataforma de Gestão de Vendas de Consórcio é uma plataforma destinada a consultores e equipes de vendas, oferecendo
            ferramentas de treinamento, gestão de carreira, agenda e materiais comerciais.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Dados que coletamos</h2>
          <p className="text-sm leading-relaxed">
            Coletamos apenas as informações necessárias para o funcionamento da plataforma:
          </p>
          <ul className="list-disc pl-5 text-sm space-y-1">
            <li>E-mail e dados de cadastro (nome, telefone, unidade);</li>
            <li>Dados de uso da plataforma (acessos, progresso em treinamentos, interações);</li>
            <li>Conteúdos enviados pelo próprio usuário (documentos, agendamentos, mensagens).</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Como usamos seus dados</h2>
          <p className="text-sm leading-relaxed">
            Os dados são utilizados exclusivamente para autenticação, personalização da experiência,
            acompanhamento de desempenho e suporte. <strong>Não compartilhamos dados com terceiros
            para fins publicitários</strong> e não realizamos rastreamento entre apps ou sites de outras empresas.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Armazenamento e segurança</h2>
          <p className="text-sm leading-relaxed">
            Os dados são armazenados em servidores seguros com criptografia em trânsito e em repouso,
            com acesso restrito por meio de autenticação e regras de permissão.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Seus direitos</h2>
          <p className="text-sm leading-relaxed">
            O usuário pode, a qualquer momento, acessar, corrigir ou solicitar a <strong>exclusão completa
            da sua conta e dos seus dados</strong> diretamente pelo app (Perfil → Excluir conta) ou enviando
            um pedido para o canal de suporte.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Contato</h2>
          <p className="text-sm leading-relaxed">
            Dúvidas sobre privacidade podem ser enviadas pelo canal "Fale com a Paula" dentro do app
            ou pelo e-mail de suporte informado na loja de aplicativos.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Privacy;
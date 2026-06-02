import { ArrowLeft, FileSignature, Printer, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const TermoCorrespondente = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const formRef = useRef<HTMLDivElement>(null);

  // Auto-fill fields
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [unidade, setUnidade] = useState("");
  const [phone, setPhone] = useState("");

  // Manual fields
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cep, setCep] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");

  // Checkboxes for each clause
  const [checks, setChecks] = useState<Record<string, boolean>>({
    politica: false,
    analisePrevia: false,
    comissionamento: false,
    valorComissao: false,
    pagamentoComissao: false,
    treinamentoMateriais: false,
    usoMarca: false,
    protecaoDados1: false,
    protecaoDados2: false,
    vendaCruzada: false,
    atendimentoDuplo: false,
    crm: false,
    leads: false,
    contrato: false,
    encerramento: false,
    imagem: false,
  });

  // Signature
  const [assinatura, setAssinatura] = useState("");
  const [assinaturaGestor, setAssinaturaGestor] = useState("");

  const allChecked = Object.values(checks).every(Boolean);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("display_name, unit, phone, cpf")
      .eq("user_id", user!.id)
      .single();
    if (data) {
      setNomeCompleto(data.display_name || "");
      setUnidade(data.unit || "");
      setPhone(data.phone || "");
      setCpf(data.cpf || "");
      setAssinatura(data.display_name || "");
    }
    setLoading(false);
  };

  const toggleCheck = (key: string) => {
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const hoje = new Date();
  const dataFormatada = `Curitiba, ${hoje.getDate()} de ${hoje.toLocaleString("pt-BR", { month: "long" })} de ${hoje.getFullYear()}`;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const content = formRef.current?.innerHTML || "";
    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>Termo de Correspondente Comercial</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Times New Roman', Georgia, serif; padding: 40px 50px; font-size: 12pt; line-height: 1.6; color: #000; background: #fff; max-width: 800px; margin: 0 auto; }
        h1, h2, h3 { color: #000; }
        h2 { font-size: 13pt; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 4px; text-transform: uppercase; }
        h3 { font-size: 12pt; margin-top: 14px; margin-bottom: 6px; }
        p { margin: 6px 0; text-align: justify; }
        label { display: inline-block; font-weight: bold; margin-right: 6px; }
        input { border: none; border-bottom: 1px solid #000; background: transparent; padding: 2px 4px; font-family: inherit; font-size: inherit; color: #000; width: auto; min-width: 200px; }
        .field-row { margin: 8px 0; display: block; }
        .grid { display: block; }
        input[type="checkbox"] { width: auto; min-width: 0; margin-right: 6px; vertical-align: middle; }
        button, [role="button"] { display: none !important; }
        .no-print { display: none !important; }
        @media print { @page { margin: 2cm; } body { padding: 0; } }
      </style></head><body>${content}</body></html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  };

  const handleSubmit = () => {
    if (!allChecked) {
      toast.error("Você precisa marcar todas as cláusulas para enviar.");
      return;
    }
    toast.success("Termo enviado com sucesso!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-br from-[hsl(348,70%,35%)] to-[hsl(340,65%,25%)] px-5 pt-12 pb-8">
        <button onClick={() => navigate("/trilha")} className="flex items-center gap-2 text-white/80 mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Voltar</span>
        </button>
        <div className="flex items-center gap-3 mb-3">
          <FileSignature className="w-8 h-8 text-white" />
          <h1 className="text-xl font-bold text-white">Termo de Correspondente Comercial</h1>
        </div>
        <p className="text-white/70 text-sm">Leia e aceite os termos para iniciar sua jornada.</p>
      </div>

      <div className="px-4 mt-6 max-w-2xl mx-auto" ref={formRef}>
        {/* Dados do correspondente */}
        <div className="bg-card border border-border rounded-xl p-5 mb-4 space-y-3">
          <h2 className="font-bold text-base text-foreground">Dados do Correspondente Comercial</h2>
          <div className="space-y-2">
            <div>
              <Label className="text-xs">Nome Completo</Label>
              <Input value={nomeCompleto} onChange={(e) => setNomeCompleto(e.target.value)} className="bg-muted/50" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">CPF</Label>
                <Input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" />
              </div>
              <div>
                <Label className="text-xs">RG</Label>
                <Input value={rg} onChange={(e) => setRg(e.target.value)} placeholder="00.000.000-0" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Endereço / Residência</Label>
              <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, nº, bairro, cidade" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">CEP</Label>
                <Input value={cep} onChange={(e) => setCep(e.target.value)} placeholder="00000-000" />
              </div>
              <div>
                <Label className="text-xs">Telefone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-muted/50" />
              </div>
            </div>
          </div>
        </div>

        {/* Dados da unidade */}
        <div className="bg-card border border-border rounded-xl p-5 mb-4 space-y-3">
          <h2 className="font-bold text-base text-foreground">Unidade de Negócios</h2>
          <div className="space-y-2">
            <div>
              <Label className="text-xs">Unidade Ademicon</Label>
              <Input value={unidade} onChange={(e) => setUnidade(e.target.value)} className="bg-muted/50" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">CNPJ</Label>
                <Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
              </div>
              <div>
                <Label className="text-xs">Razão Social</Label>
                <Input value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Cláusulas do contrato */}
        <div className="bg-card border border-border rounded-xl p-5 mb-4 space-y-4">
          <h2 className="font-bold text-base text-foreground">DO OBJETO DO CONTRATO</h2>

          <div className="text-xs text-muted-foreground space-y-3 leading-relaxed">
            <p><strong>Cláusula 1ª</strong> – O presente contrato tem como OBJETO a autorização para o correspondente comercial indicar os serviços e produtos, realizar treinamentos internos e participar das reuniões de fechamento de vendas, junto com o Contratante.</p>

            <h3 className="font-bold text-foreground text-sm mt-4">DAS OBRIGAÇÕES DA PARCEIRA</h3>
            <p><strong>Cláusula 2ª</strong> – O contratante fica obrigado a fornecer à contratada, quando lhe for solicitado, informações detalhadas sobre o andamento dos negócios postos a seu cargo.</p>
            <p><strong>Cláusula 3ª</strong> – O correspondente comercial receberá comissão sobre o valor dos negócios realizados por sua indicação e participação das vendas.</p>
            <p><strong>Cláusula 4ª</strong> – Nenhuma retribuição será devida ao correspondente comercial se a falta de pagamento resultar de insolvência ou inadimplência do comprador, bem como se o negócio for por ele(a) desfeito.</p>
            <p><strong>Cláusula 5ª</strong> – O correspondente comercial só será Vendedor Iniciante a partir do momento que regularizar as documentações de pessoa física (RG, CPF, comprovante de residência em seu nome ou nome dos pais). Após isso receberá acesso à plataforma de vendas e treinamentos.</p>
            <p><strong>Cláusula 6ª</strong> – O correspondente comercial receberá por sua atuação nos negócios fechados o percentual de 1% a 2% no período de 13 meses, sobre o valor mensal aportado em parcela pelo cliente indicado.</p>
            <p><strong>Cláusula 7ª</strong> – A parte que desejar rescindir o presente instrumento notificará de forma expressa sua intenção à outra parte, sem antecedência mínima.</p>
            <p><strong>Cláusula 8ª</strong> – Estará rescindido automaticamente o presente contrato de parceria, ocorrendo a violação de qualquer cláusula, por dolo ou culpa. Parágrafo primeiro – No caso do disposto na cláusula 8ª, não caberá indenização em nenhuma hipótese.</p>

            <h3 className="font-bold text-foreground text-sm mt-4">DA VALIDADE E PRAZO DO CONTRATO</h3>
            <p><strong>Cláusula 9ª</strong> – O presente instrumento passa a vigorar a partir da assinatura mútua.</p>
            <p><strong>Cláusula 10ª</strong> – A validade do contrato é de 40 dias, até a regularização de documentos para cadastro de análise prévia.</p>
            <p><strong>Cláusula 11ª</strong> – Caso o correspondente comercial não entregue a documentação pendente, tornará indicador de vendas, o comissionamento passa a ser de 1% sobre vendas já efetuadas.</p>

            <h3 className="font-bold text-foreground text-sm mt-4">DISPOSIÇÕES GERAIS</h3>
            <p><strong>Cláusula 12ª</strong> – Fica compactuado entre as partes a total inexistência de vínculos trabalhistas, excluindo as obrigações previdenciárias e os encargos sociais.</p>
          </div>
        </div>

        {/* Termo de ciência e concordância */}
        <div className="bg-card border border-border rounded-xl p-5 mb-4 space-y-4">
          <h2 className="font-bold text-base text-foreground">Termo de Ciência e Concordância</h2>

          <CheckItem
            id="politica"
            checked={checks.politica}
            onToggle={() => toggleCheck("politica")}
            text="POLÍTICA DE PRIVACIDADE – POR MEIO DO TERMO DE CIÊNCIA E CONCORDÂNCIA, EU CONFIRMO QUE TENHO CONHECIMENTO DAS REGRAS E NORMAS APLICÁVEIS. CASO EU VIOLE A NORMA OU A REGRA NELE MENCIONADA, O TERMO DE CIÊNCIA E CONCORDÂNCIA PODE FUNCIONAR COMO IMPORTANTE MEIO DE PROVA."
          />

          <CheckItem
            id="analisePrevia"
            checked={checks.analisePrevia}
            onToggle={() => toggleCheck("analisePrevia")}
            text="Do período de análise prévia e treinamento: São 30 dias de integração. Para formalizar a contratação é necessário que envie documentação de CNPJ em até 70 dias após ingresso como consultor. Caso isso não aconteça, a ADEMICON realizará automaticamente a baixa da análise prévia, e o mesmo poderá atuar como indicador de clientes, recebendo 1% de comissão."
          />

          <CheckItem
            id="comissionamento"
            checked={checks.comissionamento}
            onToggle={() => toggleCheck("comissionamento")}
            text="Do período de comissionamento ADEMICON: Estou ciente que meu comissionamento de 2% será pago em até 18 parcelas, podendo ser menor dependendo do modelo de vendas. O período de fechamento da comissão é até dia 20 do mês com pagamento no quinto dia útil do mês subsequente. O recebimento está atrelado à adimplência do cliente."
          />

          <CheckItem
            id="valorComissao"
            checked={checks.valorComissao}
            onToggle={() => toggleCheck("valorComissao")}
            text="Do valor de comissionamento: O valor da comissão é de 2%, sem considerar o desconto dos impostos."
          />

          <CheckItem
            id="pagamentoComissao"
            checked={checks.pagamentoComissao}
            onToggle={() => toggleCheck("pagamentoComissao")}
            text="Do pagamento de comissionamento: Estou ciente que toda venda efetuada será cadastrada na matrícula do gestor da loja e o desconto de imposto será conforme a empresa dele, até que eu abra o meu CNPJ."
          />

          <CheckItem
            id="treinamentoMateriais"
            checked={checks.treinamentoMateriais}
            onToggle={() => toggleCheck("treinamentoMateriais")}
            text="Do treinamento e materiais: Estou ciente que não poderei copiar, distribuir os materiais em vídeo, PDF, imagens, para outros consultores da rede ou concorrentes. O uso é restrito da loja."
          />

          <CheckItem
            id="usoMarca"
            checked={checks.usoMarca}
            onToggle={() => toggleCheck("usoMarca")}
            text="Do uso da marca: Estou ciente que só poderei fazer uso da marca (ADEMICON), tabelas e ofertas nas redes sociais, após a validação da abertura da empresa. Antes disso preciso verificar o manual de normas de redes sociais."
          />

          <CheckItem
            id="protecaoDados1"
            checked={checks.protecaoDados1}
            onToggle={() => toggleCheck("protecaoDados1")}
            text="Das leis de proteção de dados: Estou ciente que meus dados (documentação) estão protegidos e não são veiculados para terceiros."
          />

          <CheckItem
            id="protecaoDados2"
            checked={checks.protecaoDados2}
            onToggle={() => toggleCheck("protecaoDados2")}
            text="Estou ciente que os dados da ADEMICON e dados de clientes não poderão ser divulgados a terceiros, ou disponibilizada qualquer cópia dos mesmos."
          />

          <CheckItem
            id="vendaCruzada"
            checked={checks.vendaCruzada}
            onToggle={() => toggleCheck("vendaCruzada")}
            text="No caso de venda cruzada: Quem efetivou o primeiro atendimento ao cliente tem o direito da venda e da comissão total, mas precisa comprovar o atendimento e o acompanhamento mensal dado ao cliente. Não havendo provas, a venda ficará para o consultor que fechou e recebeu do cliente."
          />

          <CheckItem
            id="atendimentoDuplo"
            checked={checks.atendimentoDuplo}
            onToggle={() => toggleCheck("atendimentoDuplo")}
            text="Quando o cliente recebe o atendimento de dois consultores simultaneamente, sendo comprovado o atendimento e suporte de ambos, a venda será dividida, e a produção ficará na matrícula de quem fechou a venda, exceto se houver mais de um contrato."
          />

          <CheckItem
            id="crm"
            checked={checks.crm}
            onToggle={() => toggleCheck("crm")}
            text="Estou ciente que preciso cadastrar as vendas no CRM na data da operação."
          />

          <CheckItem
            id="leads"
            checked={checks.leads}
            onToggle={() => toggleCheck("leads")}
            text="Estou ciente que a rede de contatos e leads que eu disponibilizar será utilizada para minha prospecção ativa e prospecção ativa do gestor da equipe."
          />

          <CheckItem
            id="contrato"
            checked={checks.contrato}
            onToggle={() => toggleCheck("contrato")}
            text="Estou ciente que meu contrato ADEMICON só inicia no momento do envio de documentação pessoa jurídica."
          />

          <CheckItem
            id="encerramento"
            checked={checks.encerramento}
            onToggle={() => toggleCheck("encerramento")}
            text="Estou ciente que meu período de prévia (treinamento e integração) será encerrado se houver falta de comparecimento à integração por mais de 1 semana, não conclusão da certificação obrigatória, comportamento inadequado com gestor, colegas de trabalho, clientes e no ambiente comercial."
          />

          <CheckItem
            id="imagem"
            checked={checks.imagem}
            onToggle={() => toggleCheck("imagem")}
            text="A presente autorização abrange o uso da minha imagem em vídeos e fotos e a inserção em materiais para toda e qualquer finalidade, seja para uso comercial, de publicidade, jornalístico, editorial, didático, para veiculação/distribuição em território nacional e internacional, por prazo indeterminado. DECLARO QUE LI E CONCORDO COM AS NORMAS DESTE DOCUMENTO."
          />
        </div>

        {/* Assinaturas */}
        <div className="bg-card border border-border rounded-xl p-5 mb-4 space-y-4">
          <h2 className="font-bold text-base text-foreground">Assinaturas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Assinatura do Vendedor (nome completo)</Label>
              <Input value={assinatura} onChange={(e) => setAssinatura(e.target.value)} placeholder="Digite seu nome completo" />
            </div>
            <div>
              <Label className="text-xs">Assinatura do Gestor da Unidade</Label>
              <Input value={assinaturaGestor} onChange={(e) => setAssinaturaGestor(e.target.value)} placeholder="Nome do gestor" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">{dataFormatada}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-8">
          <Button onClick={handleSubmit} disabled={!allChecked} className="flex-1 gap-2">
            <FileSignature className="w-4 h-4" />
            Enviar Termo
          </Button>
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            Imprimir
          </Button>
        </div>
      </div>
    </div>
  );
};

const CheckItem = ({ id, checked, onToggle, text }: { id: string; checked: boolean; onToggle: () => void; text: string }) => (
  <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
    <Checkbox id={id} checked={checked} onCheckedChange={onToggle} className="mt-0.5" />
    <label htmlFor={id} className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
      {text}
      <span className="block mt-1 font-semibold text-foreground">
        {checked ? "✅ Estou ciente" : "⬜ Marque para confirmar"}
      </span>
    </label>
  </div>
);

export default TermoCorrespondente;

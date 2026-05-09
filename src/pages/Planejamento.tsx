import { useState } from "react";
import { ArrowLeft, Printer, Calendar, CalendarDays, Phone, ClipboardCheck, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PlanejamentoStatus from "@/components/PlanejamentoStatus";

const DAYS = ["SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];
const HOURS = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];
const FIRST_HOUR_TOPICS = [
  "Alinhamento Semanal",
  "Role Play",
  "Inteligência Emocional",
  "Treinamento Produto",
  "Cresça e Compartilhe",
  "09:00",
];

const inputCls =
  "w-full bg-transparent border-b border-border/60 focus:border-primary focus:outline-none text-sm py-1 px-1 print:border-black";
const cellCls =
  "border border-border/60 p-1 align-top print:border-black";

const Planejamento = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("mensal");

  return (
    <div className="min-h-screen bg-background pb-24 print:bg-white print:pb-0">
      <div className="bg-gradient-to-br from-[hsl(348,70%,35%)] to-[hsl(340,65%,25%)] px-5 pt-12 pb-6 print:hidden">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white/80 mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Voltar</span>
        </button>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="w-7 h-7 text-white" />
            <h1 className="text-xl font-bold text-white">Planejamento</h1>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3 py-2 rounded-lg"
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
        </div>
      </div>

      <div className="px-4 mt-5 print:px-0 print:mt-0">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid grid-cols-5 w-full mb-4 print:hidden">
            <TabsTrigger value="status" className="text-[11px] gap-1"><TrendingUp className="w-3.5 h-3.5" />Status</TabsTrigger>
            <TabsTrigger value="mensal" className="text-[11px] gap-1"><Calendar className="w-3.5 h-3.5" />Mensal</TabsTrigger>
            <TabsTrigger value="semanal" className="text-[11px] gap-1"><CalendarDays className="w-3.5 h-3.5" />Semanal</TabsTrigger>
            <TabsTrigger value="prospec" className="text-[11px] gap-1"><Phone className="w-3.5 h-3.5" />Prospecção</TabsTrigger>
            <TabsTrigger value="ficha" className="text-[11px] gap-1"><ClipboardCheck className="w-3.5 h-3.5" />Ficha</TabsTrigger>
          </TabsList>

          {/* === STATUS & METAS === */}
          <TabsContent value="status">
            <PlanejamentoStatus />
          </TabsContent>

          {/* === MENSAL === */}
          <TabsContent value="mensal" className="print:block">
            <FormCard title="PLANEJAMENTO MENSAL">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Field label="NOME" />
                <Field label="MÊS" />
              </div>
              <div className="overflow-x-auto -mx-2 print:overflow-visible print:mx-0">
                <table className="w-full border-collapse text-xs min-w-[640px]">
                  <thead>
                    <tr>
                      {DAYS.map((d) => (
                        <th key={d} className={`${cellCls} bg-primary/10 font-bold text-primary text-center`}>{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 5 }).map((_, r) => (
                      <tr key={r}>
                        {DAYS.map((_, c) => (
                          <td key={c} className={cellCls}>
                            <textarea className={`${inputCls} resize-none border-b-0 h-16`} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 space-y-3">
                <BlockField label="QUAL É O SEU OBJETIVO?" />
                <BlockField label="FECHAMENTO MÊS" />
              </div>
            </FormCard>
          </TabsContent>

          {/* === SEMANAL === */}
          <TabsContent value="semanal" className="print:block">
            <FormCard title="PLANEJAMENTO SEMANAL">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                <Field label="NOME" />
                <Field label="PROSPECÇÃO" />
                <Field label="ATENDIMENTO" />
                <Field label="VENDAS LAR" />
                <Field label="VENDA MOTORS" />
              </div>
              <div className="overflow-x-auto -mx-2 print:overflow-visible print:mx-0">
                <table className="w-full border-collapse text-[11px] min-w-[760px]">
                  <thead>
                    <tr>
                      {DAYS.map((d) => (
                        <th key={d} className={`${cellCls} bg-primary/10 font-bold text-primary text-center`}>{d}</th>
                      ))}
                      <th className={`${cellCls} bg-primary/10 font-bold text-primary text-center`}>REALIZADO VENDAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {FIRST_HOUR_TOPICS.map((topic, i) => (
                        <td key={i} className={cellCls}>
                          <div className="font-bold">08:30 às 09:00</div>
                          <div className="text-muted-foreground">{topic}</div>
                          <input className={`${inputCls} mt-1`} />
                        </td>
                      ))}
                      <td className={cellCls}>
                        <span className="font-bold mr-1">1</span>
                        <input className={inputCls} />
                      </td>
                    </tr>
                    {HOURS.map((h, i) => (
                      <tr key={h}>
                        {DAYS.map((_, c) => (
                          <td key={c} className={cellCls}>
                            <div className="font-semibold">{h}</div>
                            <input className={inputCls} />
                          </td>
                        ))}
                        <td className={cellCls}>
                          {i + 2 <= 10 ? (
                            <>
                              <span className="font-bold mr-1">{i + 2}</span>
                              <input className={inputCls} />
                            </>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 space-y-3">
                <h3 className="font-bold text-primary text-sm">FECHAMENTO SEMANAL</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="TOTAL PROSPECÇÕES" />
                  <Field label="VISITAS REALIZADAS" />
                  <Field label="TOTAL DE VENDAS" />
                </div>
                <BlockField label="FATO | CAUSA" />
                <BlockField label="AÇÃO" />
              </div>
            </FormCard>
          </TabsContent>

          {/* === PROSPECÇÃO === */}
          <TabsContent value="prospec" className="print:block">
            <FormCard title="CONTROLE PROSPECÇÃO">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Field label="DIA" />
              </div>
              <h3 className="font-bold text-primary text-sm mb-2">PLANEJAMENTO DIÁRIO</h3>
              <table className="w-full border-collapse text-xs mb-4">
                <thead>
                  <tr>
                    <th className={`${cellCls} bg-primary/10 text-primary w-24 text-center`}>HORA</th>
                    <th className={`${cellCls} bg-primary/10 text-primary text-left`}>DESCRIÇÃO ATIVIDADE</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <tr key={i}>
                      <td className={cellCls}><input className={inputCls} /></td>
                      <td className={cellCls}><input className={inputCls} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3 className="font-bold text-primary text-sm mb-2">RESUMO PROSPECÇÃO</h3>
              <table className="w-full border-collapse text-xs mb-4">
                <tbody>
                  {[
                    "QUANTIDADE DE LIGAÇÕES",
                    "NÚMERO INVÁLIDO",
                    "NÃO ATENDIDAS",
                    "ATENDIDAS",
                    "SEM INTERESSE",
                    "INTERESSE FUTURO",
                    "AGENDAMENTOS",
                    "% CONVERSÃO",
                    "MENSAGEM WHATSAPP",
                    "E-MAIL",
                    "REDES SOCIAIS",
                    "NETWORKING / P.A.P.",
                  ].map((label) => (
                    <tr key={label}>
                      <td className={`${cellCls} font-semibold w-2/3`}>{label}</td>
                      <td className={cellCls}><input className={inputCls} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="overflow-x-auto -mx-2 print:overflow-visible print:mx-0">
                <table className="w-full border-collapse text-xs min-w-[560px]">
                  <thead>
                    <tr>
                      <th className={`${cellCls} bg-primary/10 text-primary w-10`}>#</th>
                      <th className={`${cellCls} bg-primary/10 text-primary text-left`}>CLIENTE</th>
                      <th className={`${cellCls} bg-primary/10 text-primary text-left`}>TELEFONE</th>
                      <th className={`${cellCls} bg-primary/10 text-primary text-left`}>STATUS</th>
                      <th className={`${cellCls} bg-primary/10 text-primary text-left`}>OBS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 30 }).map((_, i) => (
                      <tr key={i}>
                        <td className={`${cellCls} text-center font-semibold`}>{i + 1}</td>
                        <td className={cellCls}><input className={inputCls} /></td>
                        <td className={cellCls}><input className={inputCls} /></td>
                        <td className={cellCls}><input className={inputCls} /></td>
                        <td className={cellCls}><input className={inputCls} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 space-y-3">
                <BlockField label="RESUMO DO DIA" />
                <BlockField label="O QUE EU POSSO FAZER A MAIS OU DIFERENTE?" />
              </div>
            </FormCard>
          </TabsContent>

          {/* === FICHA === */}
          <TabsContent value="ficha" className="print:block">
            <FormCard title="Ficha de Avaliação — Primeira Semana de Trabalho">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <Field label="Nome" />
                <Field label="Unidade" />
              </div>
              <div className="space-y-3">
                <BlockField label="Como foi sua adaptação ao dia a dia na unidade?" />
                <BlockField label="Como tem sido sua rotina de trabalho?" />
                <BlockField label="Quais foram as principais dificuldades encontradas até o momento?" />
                <BlockField label="Como você avalia seu próprio desempenho nesta primeira semana?" />
                <BlockField label="Qual é o seu plano de ação para as próximas semanas?" />
                <Field label="Qual é a sua meta salarial para os próximos 3 meses? (R$)" />
                <BlockField label="Há algo que gostaria de sugerir ou compartilhar com a liderança?" />
              </div>
            </FormCard>
          </TabsContent>
        </Tabs>
      </div>

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          [data-state="inactive"] { display: none !important; }
          [role="tabpanel"] { display: block !important; }
        }
      `}</style>
    </div>
  );
};

const FormCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm print:shadow-none print:border-0 print:rounded-none print:p-0">
    <h2 className="text-lg sm:text-xl font-extrabold text-primary mb-4 tracking-wide">{title}</h2>
    {children}
  </div>
);

const Field = ({ label }: { label: string }) => (
  <label className="block">
    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{label}</span>
    <input className={inputCls} />
  </label>
);

const BlockField = ({ label }: { label: string }) => (
  <label className="block">
    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{label}</span>
    <textarea className={`${inputCls} resize-y min-h-[60px]`} />
  </label>
);

export default Planejamento;
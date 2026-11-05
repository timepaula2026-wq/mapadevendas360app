// Conteúdo do "modo gratuito" da IA do Consórcio — funciona sem API de IA paga.
// Respostas prontas, simulados roteirizados com checagem automática e vídeos de cenário.
import { CAREER_LEVELS } from "@/lib/careerLevels";
import { PARTE1_STEPS, DAY1_TASKS, DAY2_TASKS, DAY3_TASKS } from "@/lib/acelerador72h";
import { tokenize, sectionsOverview } from "@/lib/localSearch";
import type { ScenarioKey } from "@/components/SimuladosPanel";

/* ------------------------------------------------------------------ */
/* Perguntas frequentes                                                */
/* ------------------------------------------------------------------ */

type FaqEntry = {
  question: string;
  keywords: string[];
  answer: string | (() => Promise<string>);
};

const lista = (itens: readonly string[]) => itens.map((i) => `- ${i}`).join("\n");

export const FAQ: FaqEntry[] = [
  // Consórcio
  {
    question: "O que é consórcio?",
    keywords: ["consorcio", "funciona", "que e", "o que"],
    answer:
      "**Consórcio** é uma forma de compra planejada: um grupo de pessoas se junta, administrado por uma administradora autorizada pelo **Banco Central**, e todo mês cada participante paga uma parcela.\n\n" +
      "Com esse dinheiro, a cada assembleia alguns participantes são **contemplados** e recebem a **carta de crédito** para comprar o bem (imóvel, veículo, serviço etc.).\n\n" +
      "- **Não tem juros** — o custo é a taxa de administração (diluída nas parcelas)\n" +
      "- A parcela é formada por: fundo comum + taxa de administração + fundo de reserva (e seguro, quando houver)\n" +
      "- A carta de crédito é reajustada ao longo do tempo para manter o poder de compra\n\n" +
      "_Taxas e condições exatas variam por grupo — confira sempre no material oficial da Ademicon._",
  },
  {
    question: "Como funciona a contemplação?",
    keywords: ["contemplacao", "contemplado", "sorteio", "lance", "assembleia"],
    answer:
      "A contemplação acontece nas **assembleias mensais** do grupo, de duas formas:\n\n" +
      "**1. Sorteio** — todo participante em dia concorre, sem custo extra.\n\n" +
      "**2. Lance** — o participante oferece antecipar parcelas para ser contemplado antes. Tipos comuns:\n" +
      "- **Lance livre:** o cliente escolhe quanto oferecer; ganha o maior percentual\n" +
      "- **Lance fixo:** percentual pré-definido pelo grupo\n" +
      "- **Lance embutido:** usa parte da própria carta de crédito como lance (o cliente não precisa ter o dinheiro todo)\n\n" +
      "💡 Para o cliente, a estratégia de lance é o que mais acelera a contemplação — vale montar isso junto com ele na reunião.",
  },
  {
    question: "Vantagens vs financiamento",
    keywords: ["vantagem", "vantagens", "financiamento", "juros", "comparar", "diferenca", "banco", "caro", "barato"],
    answer:
      "**Consórcio x Financiamento**\n\n" +
      "| | Consórcio | Financiamento |\n|---|---|---|\n" +
      "| Juros | Não tem | Tem (e pesa muito no total) |\n" +
      "| Custo | Taxa de administração diluída | Juros + taxas + seguros |\n" +
      "| Entrada | Não exige | Normalmente exige |\n" +
      "| Quando usa o bem | Na contemplação | Na hora |\n" +
      "| Poder de negociação | Compra à vista com a carta | Compra financiada |\n\n" +
      "**Como falar com o cliente:** o financiamento vende *tempo* e cobra caro por isso; o consórcio é para quem planeja e quer pagar bem menos no total. Com lance, o cliente ainda pode antecipar a contemplação.",
  },
  {
    question: "Quais modalidades existem?",
    keywords: ["modalidade", "modalidades", "tipos", "imovel", "imoveis", "carro", "veiculo", "veiculos", "servico", "servicos", "moto", "pesados"],
    answer:
      "As modalidades mais comuns de consórcio:\n\n" +
      "- 🏠 **Imóveis** — casa, apartamento, terreno, construção, reforma\n" +
      "- 🚗 **Veículos** — carros e motos\n" +
      "- 🚛 **Pesados** — caminhões, máquinas, implementos\n" +
      "- 🛠️ **Serviços** — reformas, estudos, viagens, festas e outros serviços\n\n" +
      "Na seção **Apresentação de Produtos** você encontra os materiais de cada produto para mostrar ao cliente.",
  },
  // Vendas
  {
    question: "Como funciona o CRM?",
    keywords: ["crm", "registrar", "registro", "venda", "cadastrar", "cliente", "ferramenta", "ferramentas"],
    answer:
      "O acesso ao **CRM** e às ferramentas de apoio à venda fica na seção **[CRM & Ferramentas](/vendas)**. Lá também tem a calculadora.\n\n" +
      "Dica: registre **todo contato** no CRM no mesmo dia — é ele que mostra seu funil (contatos → reuniões → vendas) e ajuda seu gestor a te apoiar.\n\n" +
      "Se tiver dúvida no passo a passo do registro, fale com seu gestor ou supervisor.",
  },
  {
    question: "Dicas para fechar mais vendas",
    keywords: ["dica", "dicas", "fechar", "fechamento", "vender", "vendas", "mais"],
    answer:
      "**7 hábitos de quem fecha mais:**\n\n" +
      "1. **Volume diário** — mensagens e ligações todos os dias, sem pular\n" +
      "2. **Descubra o sonho antes de falar de produto** — pergunte o que o cliente quer conquistar e em quanto tempo\n" +
      "3. **Use números** — mostre parcela, prazo e simulação de lance\n" +
      "4. **Sempre marque o próximo passo** — nunca termine uma conversa sem data\n" +
      "5. **Feche com alternativa** — \"prefere a carta de 300 ou de 350 mil?\"\n" +
      "6. **Trate objeção como pergunta** — o cliente que objeta está interessado\n" +
      "7. **Follow-up em até 24h** — quem some perde a venda\n\n" +
      "🎯 Treine isso na aba **Vendedor IA → Simulados**.",
  },
  {
    question: "Como apresentar produtos ao cliente?",
    keywords: ["apresentar", "apresentacao", "produto", "produtos", "mostrar", "reuniao"],
    answer:
      "**Roteiro de apresentação em 5 passos:**\n\n" +
      "1. **Conexão** — quebre o gelo e entenda o momento do cliente\n" +
      "2. **Descoberta** — qual o objetivo, valor, prazo e quanto cabe no bolso por mês\n" +
      "3. **Solução** — mostre o produto certo com a simulação (carta, parcela, prazo)\n" +
      "4. **Estratégia de contemplação** — explique sorteio e monte uma estratégia de lance\n" +
      "5. **Fechamento** — proponha a carta e o próximo passo concreto\n\n" +
      "Os materiais oficiais estão em **[Apresentação de Produtos](/apresentacao)**.",
  },
  {
    question: "Como contornar objeções?",
    keywords: ["objecao", "objecoes", "contornar", "rebater", "responder", "nao quero", "pensar", "furada"],
    answer:
      "**Método em 3 passos para qualquer objeção:**\n\n" +
      "1. **Acolha** — \"Faz sentido você pensar assim…\"\n" +
      "2. **Pergunte** — \"O que exatamente te preocupa nisso?\" (a objeção real costuma ser outra)\n" +
      "3. **Responda com fato + pergunta de avanço** — \"…então, se a gente montar uma estratégia de lance, faz sentido pra você?\"\n\n" +
      "**As mais comuns:**\n" +
      "- *\"Posso não ser contemplado\"* → estratégia de lance + carta corrigida\n" +
      "- *\"É mais caro que financiamento\"* → sem juros; compare o total pago\n" +
      "- *\"Preciso pensar\"* → \"Claro! O que ficou de dúvida pra eu te ajudar agora?\"\n\n" +
      "🎯 Pratique no simulado **Treino de Objeções**.",
  },
  // Carreira
  {
    question: "Como funciona o plano de carreira?",
    keywords: ["plano", "carreira", "progressao", "crescer"],
    answer: () =>
      Promise.resolve(
        "O **Plano de Carreira** mostra os níveis que você pode alcançar no time:\n\n" +
          CAREER_LEVELS.map((l, i) => `${i + 1}. **${l.label}** — ${l.requirement}`).join("\n") +
          "\n\nSeu nível atual aparece destacado na seção **[Plano de Carreira](/carreira)**. Quem define e atualiza o nível é a liderança.",
      ),
  },
  {
    question: "Quais são os níveis de progressão?",
    keywords: ["nivel", "niveis", "progressao", "categoria", "junior", "pleno", "master", "supervisor", "gestor"],
    answer: () =>
      Promise.resolve(
        "Níveis do plano de carreira:\n\n" +
          CAREER_LEVELS.map((l) => `- **${l.label}** — ${l.requirement}`).join("\n") +
          "\n\nVeja o seu em **[Plano de Carreira](/carreira)**.",
      ),
  },
  {
    question: "Como subir de nível?",
    keywords: ["subir", "promocao", "promovido", "evoluir", "proximo nivel"],
    answer:
      "Para subir de nível:\n\n" +
      "- Mantenha **constância de vendas** mês a mês\n" +
      "- Cumpra a **Trilha** e os treinamentos do seu nível\n" +
      "- Registre tudo no **CRM** — é o histórico que a liderança avalia\n" +
      "- Converse com seu **gestor** sobre as metas do próximo nível\n\n" +
      "A mudança de nível é feita pela liderança e aparece na seção **[Plano de Carreira](/carreira)**.",
  },
  {
    question: "Onde vejo meu nível atual?",
    keywords: ["meu nivel", "nivel atual", "ver nivel", "onde vejo"],
    answer:
      "Seu nível atual aparece destacado como **Atual** na seção **[Plano de Carreira](/carreira)**. Se ainda não aparecer, é porque a liderança ainda não definiu — fale com seu gestor.",
  },
  // App
  {
    question: "O que tem em cada seção do app?",
    keywords: ["secoes", "secao", "tem", "app", "ferramentas", "disponiveis", "menu", "abas"],
    answer: async () => {
      const secs = await sectionsOverview();
      return (
        "**Seções do Mapa de Vendas:**\n\n" +
        secs
          .map((s) => `- **[${s.title}](${s.route})**${s.tabs.length ? ` — ${s.tabs.slice(0, 6).join(", ")}${s.tabs.length > 6 ? "…" : ""}` : ""}`)
          .join("\n")
      );
    },
  },
  {
    question: "Como usar a Trilha do Iniciante?",
    keywords: ["trilha", "iniciante", "onboarding", "comecar", "comeco", "novo"],
    answer:
      "A **[Trilha do Iniciante](/trilha)** é o seu caminho de início no time. Siga as etapas na ordem, assista os conteúdos e marque o que concluir.\n\n" +
      "Depois dela, use o **[Acelerador 72h](/acelerador-72h)** para colocar o plano de ação dos 3 primeiros dias em prática.",
  },
  {
    question: "O que é o Acelerador 72h?",
    keywords: ["acelerador", "72h", "72", "horas", "tres dias", "checklist"],
    answer:
      "O **[Acelerador 72h](/acelerador-72h)** é o checklist do plano de ação dos seus 3 primeiros dias.\n\n" +
      "**Metas:**\n" + lista(PARTE1_STEPS) + "\n\n" +
      `**Tarefas diárias:** ${DAY1_TASKS.length} no 1º dia, ${DAY2_TASKS.length} no 2º e ${DAY3_TASKS.length} no 3º — tudo marcado no app, com progresso salvo e PDF da semana.`,
  },
  {
    question: "Como falar com a Paula?",
    keywords: ["paula", "falar", "sugestao", "reclamacao", "elogio", "duvida", "feedback"],
    answer:
      "Use a seção **[Fale com a Paula](/fale-com-paula)**: escolha o tipo (sugestão, dúvida, reclamação ou elogio), escreva sua mensagem e envie. Seu nome é opcional.",
  },
];

export const FAQ_CATEGORIES = [
  { label: "🏠 Consórcio", questions: FAQ.slice(0, 4).map((f) => f.question) },
  { label: "💰 Vendas", questions: FAQ.slice(4, 8).map((f) => f.question) },
  { label: "📈 Carreira", questions: FAQ.slice(8, 12).map((f) => f.question) },
  { label: "📱 App", questions: FAQ.slice(12, 16).map((f) => f.question) },
];

/** Procura a resposta pronta mais parecida. Retorna null se não tiver boa correspondência. */
export async function answerFromFaq(text: string): Promise<string | null> {
  const exact = FAQ.find((f) => f.question.toLowerCase() === text.trim().toLowerCase());
  const pick = async (f: FaqEntry) => (typeof f.answer === "string" ? f.answer : await f.answer());
  if (exact) return pick(exact);

  const tokens = new Set(tokenize(text));
  if (!tokens.size) return null;
  const norm = " " + tokenize(text).join(" ") + " ";
  let best: { f: FaqEntry; score: number } | null = null;
  for (const f of FAQ) {
    let score = 0;
    for (const k of f.keywords) {
      const kt = tokenize(k);
      if (!kt.length) continue;
      if (kt.length > 1 ? norm.includes(" " + kt.join(" ") + " ") : tokens.has(kt[0])) score += kt.length > 1 ? 3 : 2;
    }
    for (const t of tokenize(f.question)) if (tokens.has(t)) score += 1;
    if (!best || score > best.score) best = { f, score };
  }
  return best && best.score >= 3 ? pick(best.f) : null;
}

/* ------------------------------------------------------------------ */
/* Simulados roteirizados                                              */
/* ------------------------------------------------------------------ */

type Check = { label: string; test: (all: string, answers: string[]) => boolean };

const rx = (re: RegExp) => (all: string) => re.test(all);
const fezPergunta: Check = { label: "Fez perguntas para entender o cliente", test: (_a, ans) => ans.filter((x) => x.includes("?")).length >= 2 };
const respostasCompletas: Check = {
  label: "Respostas completas (não monossilábicas)",
  test: (_a, ans) => ans.length > 0 && ans.reduce((s, x) => s + x.split(/\s+/).length, 0) / ans.length >= 12,
};

export type ScriptedScenario = {
  lines: string[]; // falas do cliente depois da abertura
  modelAnswers: string[]; // resposta modelo para a abertura + cada fala
  checks: Check[];
};

export const SCRIPTED: Record<ScenarioKey, ScriptedScenario> = {
  prospeccao: {
    lines: [
      "Hum… Ademicon? Como você conseguiu meu número?",
      "Olha, eu já tenho um consórcio, viu.",
      "Tá, mas eu não tenho muito tempo pra isso agora.",
      "Tá bom… e o que você quer exatamente?",
    ],
    modelAnswers: [
      "\"Oi, [nome]! Aqui é o [seu nome], da Ademicon. Prometo ser rápido: em 1 minuto te explico por que liguei, tudo bem?\"",
      "\"Peguei com o [indicação/lista], que achou que fazia sentido pra você. Se não fizer, sem problema nenhum!\"",
      "\"Que ótimo, então você já conhece as vantagens! Muita gente usa um segundo consórcio pra investimento ou pra antecipar outro objetivo. Qual é o seu objetivo com o atual?\"",
      "\"Entendo total. Por isso proponho 20 minutinhos numa conversa marcada — fica melhor pra você terça às 19h ou quinta às 12h?\"",
      "\"Quero entender seus planos — imóvel, carro, investimento — e te mostrar como chegar lá sem juros. Fechamos aquele horário?\"",
    ],
    checks: [
      { label: "Se apresentou (nome + Ademicon)", test: rx(/(meu nome|aqui e|sou o|sou a|me chamo)/) },
      { label: "Citou a Ademicon", test: rx(/ademicon/) },
      { label: "Explicou de onde veio o contato", test: rx(/(indica|lista|amig|conhec|peguei|consegui)/) },
      { label: "Propôs próximo passo (reunião/horário)", test: rx(/(reuniao|agendar|marcar|conversa|horario|amanha|segunda|terca|quarta|quinta|sexta|\d{1,2}h|\d{1,2}:\d{2})/) },
      fezPergunta,
      respostasCompletas,
    ],
  },
  agendamento: {
    lines: [
      "Mas não dá pra você me mandar tudo por WhatsApp mesmo?",
      "Não sei se essa semana vou ter tempo…",
      "E qual o objetivo dessa reunião, afinal?",
      "Tá… e quanto tempo leva?",
    ],
    modelAnswers: [
      "\"Consigo sim, mas cada caso é um caso — numa conversa rápida monto a simulação certa pro seu objetivo. Quando fica melhor pra você?\"",
      "\"Por mensagem você recebe números genéricos. Em 20 minutos eu monto a SUA simulação, com parcela e estratégia de lance. Vale muito mais a pena.\"",
      "\"Por isso é rapidinho! Tenho terça às 19h ou quinta às 12h — qual encaixa melhor?\"",
      "\"Entender seu objetivo e te mostrar, com números, o caminho mais barato pra chegar lá. Sem compromisso.\"",
      "\"Uns 20 minutos. Então fica confirmado quinta às 12h? Te mando o lembrete por WhatsApp.\"",
    ],
    checks: [
      { label: "Ofereceu 2 opções de horário", test: (a) => (a.match(/(\d{1,2}h|\d{1,2}:\d{2}|manha|tarde|noite|segunda|terca|quarta|quinta|sexta|sabado)/g) || []).length >= 2 },
      { label: "Explicou o objetivo/valor da reunião", test: rx(/(objetivo|entender|simulacao|mostrar|numeros|estrategia)/) },
      { label: "Informou a duração", test: rx(/(minuto|rapid|meia hora|\d+ ?min)/) },
      { label: "Confirmou o compromisso", test: rx(/(confirm|combinado|fechado|lembrete|agendado|marcado)/) },
      fezPergunta,
      respostasCompletas,
    ],
  },
  reuniao: {
    lines: [
      "E quanto ficaria a parcela mais ou menos?",
      "E em quanto tempo eu consigo ser contemplado?",
      "Como funciona esse tal de lance?",
      "Mas no financiamento eu já pego o imóvel na hora, né?",
      "Entendi… e qual seria o próximo passo?",
    ],
    modelAnswers: [
      "\"Antes de te passar números, me conta: o imóvel é pra morar ou investir? E em quanto tempo você gostaria de ter ele?\"",
      "\"Depende do prazo do grupo — vou te mostrar a simulação com a carta de R$ 300 mil e as opções de prazo, pra você ver o que cabe no seu mês.\"",
      "\"Pelo sorteio pode ser em qualquer assembleia; com uma estratégia de lance a gente acelera bastante. Vamos montar a sua?\"",
      "\"Você antecipa parcelas pra ser contemplado antes. E tem o lance embutido, que usa parte da própria carta — você não precisa ter todo o dinheiro.\"",
      "\"Sim, mas paga juros por isso — no total sai muito mais caro. No consórcio você paga só a taxa de administração e compra à vista quando for contemplado.\"",
      "\"Separar seus documentos e escolher a carta. Prefere a de 300 ou a de 350 mil?\"",
    ],
    checks: [
      { label: "Fez perguntas de descoberta (objetivo, prazo)", test: rx(/(objetivo|morar|investir|prazo|quanto tempo|cabe)/) },
      { label: "Usou números concretos", test: (a) => /\d/.test(a) },
      { label: "Explicou sorteio e lance", test: (a) => /sorteio/.test(a) && /lance/.test(a) },
      { label: "Comparou com financiamento (juros)", test: rx(/(juros|financiamento)/) },
      { label: "Conduziu para o fechamento", test: rx(/(document|contrato|assinar|proposta|prefere|fechar|carta de)/) },
      respostasCompletas,
    ],
  },
  fechamento: {
    lines: [
      "E se eu nunca for contemplado?",
      "E se eu perder o emprego no meio do caminho?",
      "Não sei… acho melhor esperar o ano que vem.",
      "Tá, você me convenceu. Como a gente faz?",
    ],
    modelAnswers: [
      "\"Faz todo sentido conversar com ela! O que você acha que ela vai perguntar? Já te ajudo com isso — ou melhor, que tal chamarmos ela numa ligação rápida agora?\"",
      "\"Você pode ser contemplado por sorteio ou lance, e a gente monta uma estratégia de lance pra acelerar. E sua carta é corrigida, então seu poder de compra fica protegido.\"",
      "\"É uma preocupação importante. A parcela foi pensada pra caber no seu orçamento, e existem alternativas se algo mudar — eu te acompanho do começo ao fim.\"",
      "\"Esperar significa começar um ano depois e pagar mais caro pelo mesmo imóvel. Quem entra hoje já concorre na próxima assembleia.\"",
      "\"Perfeito! Vou te enviar a proposta agora e preciso só dos seus documentos. Prefere assinar hoje à tarde ou amanhã cedo?\"",
    ],
    checks: [
      { label: "Acolheu a objeção antes de responder", test: rx(/(entendo|faz sentido|compreendo|normal|claro|importante)/) },
      { label: "Usou fechamento por alternativa", test: rx(/(prefere|ou amanha|hoje ou|qual dos|qual das)/) },
      { label: "Trouxe segurança (lance/correção/acompanhamento)", test: rx(/(lance|corrig|reajust|seguran|acompanh|garant)/) },
      { label: "Criou urgência real", test: rx(/(hoje|agora|proxima assembleia|mais caro|esperar)/) },
      { label: "Pediu documentos/assinatura", test: rx(/(document|assinar|assinatura|proposta|contrato)/) },
      respostasCompletas,
    ],
  },
  objecoes: {
    lines: [
      "Tá, mas consórcio é mais caro que financiamento, né?",
      "Eu já tenho consórcio em outra administradora.",
      "Sinceramente, não confio em administradora. Prefiro banco.",
      "E agora não tenho dinheiro pra mais uma parcela.",
    ],
    modelAnswers: [
      "\"Entendo! Pelo sorteio todos concorrem todo mês, e com estratégia de lance (inclusive embutido) a gente antecipa. E a carta é corrigida, então você não perde poder de compra.\"",
      "\"Na verdade é o contrário: consórcio não tem juros. Somando tudo, o financiamento chega a custar o dobro do bem. Quer ver a comparação com números?\"",
      "\"Ótimo, você já conhece! Muita gente diversifica com um segundo, pra outro objetivo ou investimento. Qual era o objetivo do seu?\"",
      "\"A Ademicon é autorizada e fiscalizada pelo Banco Central, e é a maior administradora independente do país. O dinheiro do grupo é protegido por lei.\"",
      "\"Faz sentido. Por isso a gente ajusta a carta pra parcela caber no seu mês. Quanto você conseguiria investir no seu objetivo por mês?\"",
    ],
    checks: [
      { label: "Objeção 1 — falou de sorteio/lance", test: (_a, ans) => /(sorteio|lance)/.test(norm(ans[0])) },
      { label: "Objeção 2 — falou de juros/custo total", test: (_a, ans) => /(juros|total|financiamento)/.test(norm(ans[1])) },
      { label: "Objeção 3 — explorou diversificação/objetivo", test: (_a, ans) => /(diversific|objetivo|segundo|outro|investi)/.test(norm(ans[2])) },
      { label: "Objeção 4 — citou Banco Central/solidez", test: (_a, ans) => /(banco central|regulament|fiscaliz|lei|maior|solid)/.test(norm(ans[3])) },
      { label: "Objeção 5 — ajustou parcela ao bolso", test: (_a, ans) => /(parcela|cabe|orcamento|ajust|por mes)/.test(norm(ans[4])) },
      respostasCompletas,
    ],
  },
};

const norm = (s = "") =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Extrai perguntas do roteiro em PDF pra usar como falas extras do cliente. */
export function questionsFromRoteiro(text?: string | null, max = 3): string[] {
  if (!text) return [];
  const out: string[] = [];
  for (const raw of text.split(/(?<=[.!?])\s+|\n+/)) {
    const s = raw.replace(/^[\s\-•*\d.)]+/, "").trim();
    if (s.endsWith("?") && s.length >= 15 && s.length <= 180 && !out.includes(s)) out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

export type Turn = { text: string; model?: string };

/** Falas do cliente na ordem: abertura, falas roteirizadas e perguntas extraídas do PDF (se houver). */
export function buildTurns(key: ScenarioKey, opener: string, roteiro?: string | null): Turn[] {
  const sc = SCRIPTED[key];
  return [
    { text: opener, model: sc.modelAnswers[0] },
    ...sc.lines.map((l, i) => ({ text: l, model: sc.modelAnswers[i + 1] })),
    ...questionsFromRoteiro(roteiro).map((q) => ({ text: q })),
  ];
}

export function buildFeedback(key: ScenarioKey, consultantAnswers: string[], turns: Turn[]): string {
  const script = SCRIPTED[key];
  const all = norm(consultantAnswers.join(" \n "));
  const answersNorm = consultantAnswers.map(norm);
  const results = script.checks.map((c) => ({ label: c.label, ok: c.test(all, answersNorm) }));
  const ok = results.filter((r) => r.ok).length;
  const nota = Math.round((ok / results.length) * 10);

  const modelos = turns
    .map((t) => (t.model ? `**Cliente:** _${t.text}_\n\n**Sugestão:** ${t.model}` : null))
    .filter(Boolean)
    .join("\n\n");

  return (
    `## 📊 Feedback do simulado — nota ${nota}/10\n\n` +
    results.map((r) => `${r.ok ? "✅" : "⬜"} ${r.label}`).join("\n\n") +
    `\n\n---\n\n### 💡 Respostas sugeridas\n\n${modelos}\n\n---\n\n` +
    "_Checagem automática pelas palavras usadas. Feedback personalizado da IA disponível para assinantes._"
  );
}

/* ------------------------------------------------------------------ */
/* Vídeos dos cenários (storyboard + narração por voz do navegador)    */
/* ------------------------------------------------------------------ */

export const OFFLINE_VIDEOS: Record<ScenarioKey, { title: string; scenes: { title: string; narration: string }[] }> = {
  prospeccao: {
    title: "Prospecção que abre portas",
    scenes: [
      { title: "Os 10 primeiros segundos", narration: "Na prospecção, você tem dez segundos. Diga seu nome, a Ademicon e peça permissão: em um minuto eu te explico por que liguei, tudo bem?" },
      { title: "Desarme a desconfiança", narration: "Se o cliente perguntar de onde veio o contato, seja transparente. Uma indicação ou lista é normal. Transparência gera confiança." },
      { title: "Saia com uma data", narration: "O objetivo da ligação não é vender, é agendar. Ofereça dois horários e termine com a reunião marcada." },
    ],
  },
  agendamento: {
    title: "Agendamento sem enrolação",
    scenes: [
      { title: "Venda a reunião", narration: "O cliente pede tudo por WhatsApp porque não vê valor na reunião. Mostre que em vinte minutos você monta a simulação personalizada dele." },
      { title: "Duas opções", narration: "Nunca pergunte se ele pode. Pergunte qual horário é melhor: terça às dezenove ou quinta ao meio-dia?" },
      { title: "Confirme e lembre", narration: "Repita data e hora, confirme o canal da reunião e mande um lembrete no dia. Reunião confirmada é reunião que acontece." },
    ],
  },
  reuniao: {
    title: "Reunião que conduz ao sim",
    scenes: [
      { title: "Descoberta primeiro", narration: "Antes do produto, descubra o sonho. Pra que é o imóvel, em quanto tempo, e quanto cabe no mês." },
      { title: "Mostre com números", narration: "Apresente a simulação: carta, parcela, prazo e uma estratégia de lance. Números concretos tiram o cliente do achismo." },
      { title: "Compare e avance", narration: "Compare com o financiamento: sem juros, o total pago é muito menor. E termine perguntando qual carta faz mais sentido pra ele." },
    ],
  },
  fechamento: {
    title: "Fechamento com segurança",
    scenes: [
      { title: "Leia o momento", narration: "Quando o cliente diz que vai pensar, ele está quase lá. Acolha e pergunte o que ficou de dúvida." },
      { title: "Trate a trava real", narration: "Medo de não ser contemplado? Estratégia de lance. Medo de esperar? Quem entra hoje concorre na próxima assembleia." },
      { title: "Fechamento por alternativa", narration: "Proponha o próximo passo concreto: prefere assinar hoje à tarde ou amanhã cedo? Peça os documentos." },
    ],
  },
  objecoes: {
    title: "Objeções viram oportunidades",
    scenes: [
      { title: "Acolha", narration: "Toda objeção começa com acolhimento: faz sentido você pensar assim. O cliente precisa se sentir ouvido." },
      { title: "Pergunte", narration: "Descubra a objeção real: o que exatamente te preocupa? Muitas vezes o motivo é outro." },
      { title: "Responda e avance", narration: "Responda com um fato, como a ausência de juros ou a regulação pelo Banco Central, e termine com uma pergunta de avanço." },
    ],
  },
};

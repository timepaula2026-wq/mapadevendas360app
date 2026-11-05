// Conteúdo estático do Acelerador de Vendas 72h (baseado no material oficial)

export const PARTE1_STEPS = [
  "Baixar lista de contatos",
  "Qualificar os primeiros 100 nomes",
  "Agendar as 30 primeiras reuniões",
  "15 apresentações",
  "2 vendas (200k)",
];

export const DAY1_TASKS = [
  "Enviar 100 mensagens diretas (contatos quentes)",
  "Enviar 100 mensagens indiretas (contatos frios)",
  "Conseguir 3 listas de contatos",
  "Postar criativos nas redes sociais",
  "Seguir @unidadeademicon",
  "Agendar as primeiras 5 reuniões",
  "Pedir para 10 pessoas postarem",
  "Estudar material da Ademicon + mapa de vendas",
];

export const DAY2_TASKS = [
  "Ligar para quem não respondeu às mensagens",
  "Enviar +100 mensagens diretas (contatos quentes)",
  "Enviar +100 mensagens indiretas (contatos quentes)",
  "Fazer lista de 50 contatos no Google e ligar usando o roteiro de vendas",
  "Repostar conteúdos no Instagram",
  "Agendar 10 reuniões",
  "Pedir para 10 pessoas postarem",
  "Atender 5 clientes",
];

export const DAY3_TASKS = [
  "Fazer uma apresentação para o multiplicador",
  "Ir nos comércios pegar cartões + deixar folhetos",
  "Fazer lista de 50 contatos no Google e ligar usando o roteiro de vendas",
  "Repostar mais conteúdos no Instagram",
  "Pedir para 10 pessoas postarem",
  "Agendar 15 reuniões",
  "Atender 10 clientes",
  "Fechar 2 vendas",
];

export const ESSENCIAIS_TASKS = [
  "Enviar mensagem no WhatsApp",
  "Enviar mensagem no Instagram",
  "Pedir para as pessoas postarem",
];

export const TABELA_IMOVEIS: [string, string][] = [
  ["R$100.000", "R$564,50"],
  ["R$200.000", "R$1.129,00"],
  ["R$300.000", "R$1.693,50"],
  ["R$400.000", "R$2.258,00"],
  ["R$500.000", "R$2.822,50"],
  ["R$600.000", "R$3.387,00"],
  ["R$700.000", "R$3.951,50"],
  ["R$800.000", "R$4.516,00"],
  ["R$900.000", "R$5.080,50"],
  ["R$1.000.000", "R$5.645,00"],
];

export const TABELA_VEICULOS: [string, string][] = [
  ["R$50.000", "R$645,55"],
  ["R$100.000", "R$1.291,10"],
  ["R$150.000", "R$1.936,65"],
  ["R$200.000", "R$2.582,20"],
  ["R$250.000", "R$3.227,75"],
  ["R$300.000", "R$3.873,30"],
  ["R$350.000", "R$4.518,85"],
  ["R$400.000", "R$5.164,40"],
  ["R$450.000", "R$5.809,95"],
  ["R$500.000", "R$6.455,50"],
];

export const TABELA_SERVICOS: [string, string][] = [
  ["R$15.000", "R$372,60"],
  ["R$30.000", "R$745,20"],
  ["R$45.000", "R$1.117,80"],
  ["R$60.000", "R$1.490,40"],
];

export const ROTEIRO_VENDAS = [
  {
    titulo: "1º Passo — Abertura (áudio ~5s)",
    texto:
      'Bom dia, "Fulano"! Tudo bem? Deus abençoe seu dia e que seja uma semana abençoada para você e sua família!',
  },
  {
    titulo: "2º Passo — Apresentação (áudio ~19s)",
    texto:
      '"Fulano", eu estou trabalhando atualmente aqui na Ademicon, e eu lembrei de você! Nós trabalhamos com crédito imobiliário com o recurso financeiro mais barato do Brasil e nossa taxa é de 1,3% AO ANO, e com ele você pode: COMPRAR IMÓVEL; CONSTRUIR; REFORMAR; QUITAR FINANCIAMENTO; ou INVESTIR… Eu vou te mandar alguns valores que temos aqui e, caso seja interessante pra você, me chama que eu te explico melhor.',
  },
  {
    titulo: '3º Passo — Se o cliente diz "Não tenho interesse" (áudio ~17s)',
    texto:
      '"Fulano", então eu gostaria de fazer uma parceria com você. Funciona assim: vou te enviar um card da nossa empresa para você postar nos seus status do WhatsApp, Instagram, grupos de amigos e família. E qualquer pessoa que vier de você e fechar comigo, eu te pago metade da minha primeira comissão. Você consegue me ajudar?',
  },
  {
    titulo: "3º Passo — Se o cliente demonstrou interesse (3 perguntas rápidas por áudio)",
    texto:
      '1ª: "Tá, então, para eu te explicar melhor, só preciso saber qual valor de crédito você mais se interessou?" (~5s)\n2ª: "Legal! E esse crédito seria para qual objetivo? Comprar imóvel, construir, reformar ou investir?" (~5s)\n3ª: "Tá bom, e essa decisão é só sua ou depende de mais alguém?" (~3s)',
  },
  {
    titulo: "Marcar a reunião (áudio ~10s)",
    texto:
      'Entendi! Então, para que eu possa te explicar melhor como funciona e tirar todas as suas dúvidas, hoje tenho horário disponível para reunião às 14h ou às 16h. Qual você prefere?',
  },
];

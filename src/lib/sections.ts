export const DEFAULT_GRID_SECTIONS = [
  { id: "trilha", label: "Trilha do Iniciante", iconName: "Rocket", route: "/trilha" },
  { id: "vendas", label: "Central de Vendas & CRM", iconName: "BarChart3", route: "/vendas" },
  { id: "ferramentas", label: "Acessos de Ferramentas", iconName: "Wrench", route: "/ferramentas" },
  { id: "treinamentos", label: "Treinamentos", iconName: "GraduationCap", route: "/trainings" },
  { id: "carreira", label: "Plano de Carreira", iconName: "Trophy", route: "/carreira" },
  { id: "apresentacao", label: "Apresentação de Produtos", iconName: "FileText", route: "/apresentacao" },
  { id: "sorteios", label: "Sorteios & Comunicados", iconName: "Gift", route: "/sorteios" },
  { id: "credito", label: "Liberação de Crédito", iconName: "CreditCard", route: "/credito" },
  { id: "jornada", label: "Jornada Impacto", iconName: "MapPin", route: "/jornada" },
  { id: "equipe", label: "Gestão de Equipe", iconName: "Users", route: "/equipe" },
  { id: "cliente", label: "Área do Cliente", iconName: "Globe", route: "/cliente" },
  { id: "administrativo", label: "Gestão de Performance 360", iconName: "Briefcase", route: "/administrativo" },
  { id: "agenda", label: "Agenda Online", iconName: "CalendarDays", route: "/agenda" },
  { id: "paula", label: "Fale com a Paula", iconName: "MessageCircleHeart", route: "/fale-com-paula" },
  { id: "comissao", label: "Comissão", iconName: "DollarSign", route: "/vendas?calc=1" },
  { id: "lideres", label: "Escola de Líderes", iconName: "School", route: "/lideres" },
] as const;

export const DEFAULT_SECTION_LABELS = Object.fromEntries(
  DEFAULT_GRID_SECTIONS.map((section) => [section.id, section.label])
) as Record<string, string>;

export const DEFAULT_SECTION_ICONS = Object.fromEntries(
  DEFAULT_GRID_SECTIONS.map((section) => [section.id, section.iconName])
) as Record<string, string>;

export const DEFAULT_SECTION_ROUTES = Object.fromEntries(
  DEFAULT_GRID_SECTIONS.map((section) => [section.id, section.route])
) as Record<string, string>;

export const DEFAULT_SECTION_IDS = DEFAULT_GRID_SECTIONS.map((section) => section.id);

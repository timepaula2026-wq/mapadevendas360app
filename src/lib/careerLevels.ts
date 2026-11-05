// Níveis do Plano de Carreira — espelham o enum `consultant_category` do banco
// (coluna profiles.category). Definidos/atribuídos pelo admin na liberação do
// perfil do consultor (AdminUserApproval.tsx), e exibidos em PlanoCarreira.tsx.
export interface CareerLevel {
  value: string;
  label: string;
  requirement: string;
}

export const CAREER_LEVELS: CareerLevel[] = [
  { value: "iniciante", label: "Iniciante", requirement: "Início de carreira" },
  { value: "junior", label: "Autorizado Júnior", requirement: "Consultor autorizado" },
  { value: "pleno", label: "Autorizado Pleno", requirement: "Consultor autorizado" },
  { value: "master", label: "Autorizado Master", requirement: "Consultor autorizado" },
  { value: "supervisor", label: "Supervisor", requirement: "Liderança de equipe" },
  { value: "gestor_pleno", label: "Gestor Pleno", requirement: "Gestão de unidade" },
  { value: "gestor_master", label: "Gestor Master", requirement: "Gestão de unidade" },
];

export const CAREER_LEVEL_LABELS: Record<string, string> = Object.fromEntries(
  CAREER_LEVELS.map((l) => [l.value, l.label])
);

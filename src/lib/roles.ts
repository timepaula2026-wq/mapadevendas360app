export const ROLES = [
  { value: "iniciante", label: "Iniciante" },
  { value: "autorizado", label: "Autorizado" },
  { value: "supervisor", label: "Supervisor" },
  { value: "gestor", label: "Gestor" },
  { value: "secretaria", label: "Secretaria" },
  { value: "escola_lideres", label: "Escola de Líderes" },
  { value: "admin", label: "Admin" },
] as const;

export type AppRole = string;

export const ROLE_LABELS: Record<string, string> = Object.fromEntries(
  ROLES.map((r) => [r.value, r.label])
);
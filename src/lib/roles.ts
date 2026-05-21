export const ROLES = [
  { value: "iniciante", label: "Iniciante" },
  { value: "autorizado", label: "Autorizado" },
  { value: "supervisor", label: "Supervisor" },
  { value: "gestor", label: "Gestor" },
  { value: "secretaria", label: "Secretaria" },
  { value: "admin", label: "Admin" },
] as const;

export type AppRole = typeof ROLES[number]["value"];

export const ROLE_LABELS: Record<string, string> = Object.fromEntries(
  ROLES.map((r) => [r.value, r.label])
);
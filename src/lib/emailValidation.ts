// Validação de e-mails: formato + correção de domínios populares digitados errado.

const KNOWN_DOMAINS = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "outlook.com.br",
  "hotmail.com.br",
  "yahoo.com",
  "yahoo.com.br",
  "icloud.com",
  "live.com",
  "bol.com.br",
  "uol.com.br",
  "terra.com.br",
];

// Lista de erros comuns -> domínio correto
const DOMAIN_TYPOS: Record<string, string> = {
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmail.om": "gmail.com",
  "gmal.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmail.colm": "gmail.com",
  "gmai.com": "gmail.com",
  "gemail.com": "gmail.com",
  "hotmail.co": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "hotmial.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "hotmaill.com": "hotmail.com",
  "hotamail.com": "hotmail.com",
  "homail.com": "hotmail.com",
  "hormail.com": "hotmail.com",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outlook.con": "outlook.com",
  "outlook.co": "outlook.com",
  "outllok.com": "outlook.com",
  "outloook.com": "outlook.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yahoo.con": "yahoo.com",
};

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const c = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + c);
    }
  }
  return dp[m][n];
}

export type EmailValidationResult =
  | { valid: true; email: string }
  | { valid: false; error: string; suggestion?: string };

export function validateEmail(raw: string): EmailValidationResult {
  const email = (raw || "").trim().toLowerCase();
  if (!email) return { valid: false, error: "Informe um e-mail." };
  if (!email.includes("@")) {
    return { valid: false, error: "E-mail inválido: faltando o caractere '@'." };
  }
  // formato básico
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!re.test(email)) {
    return { valid: false, error: "Formato de e-mail inválido." };
  }
  const [local, domain] = email.split("@");
  if (!local || !domain) {
    return { valid: false, error: "E-mail incompleto." };
  }
  if (!domain.includes(".")) {
    return { valid: false, error: "Domínio do e-mail inválido (faltando '.')." };
  }

  // Typo direto
  if (DOMAIN_TYPOS[domain]) {
    const fix = DOMAIN_TYPOS[domain];
    return {
      valid: false,
      error: `Domínio "${domain}" parece incorreto. Você quis dizer ${local}@${fix}?`,
      suggestion: `${local}@${fix}`,
    };
  }

  // Similaridade com domínios conhecidos
  if (!KNOWN_DOMAINS.includes(domain)) {
    for (const known of KNOWN_DOMAINS) {
      const dist = levenshtein(domain, known);
      if (dist > 0 && dist <= 2 && Math.abs(domain.length - known.length) <= 2) {
        return {
          valid: false,
          error: `Domínio "${domain}" parece incorreto. Você quis dizer ${local}@${known}?`,
          suggestion: `${local}@${known}`,
        };
      }
    }
  }

  return { valid: true, email };
}
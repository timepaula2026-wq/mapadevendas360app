import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { handler, isValidCPF } from "./index.ts";

// ---- Mock fetch helper ----
const originalFetch = globalThis.fetch;

type MockResponse = {
  ok?: boolean;
  status?: number;
  body: unknown;
};

function mockFetch(response: MockResponse | (() => MockResponse) | "network_error") {
  globalThis.fetch = (async (_url: string | URL, _init?: RequestInit) => {
    if (response === "network_error") {
      throw new Error("network down");
    }
    const r = typeof response === "function" ? response() : response;
    return new Response(JSON.stringify(r.body), {
      status: r.status ?? 200,
    });
  }) as typeof fetch;
}

function restoreFetch() {
  globalThis.fetch = originalFetch;
}

function makeRequest(body: unknown, opts: { skipJson?: boolean } = {}) {
  return new Request("http://localhost/validate-consultor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: opts.skipJson ? (body as string) : JSON.stringify(body),
  });
}

// ============= isValidCPF unit tests =============

Deno.test("isValidCPF: aceita CPF válido", () => {
  // 529.982.247-25 — CPF válido conhecido para testes
  assertEquals(isValidCPF("52998224725"), true);
});

Deno.test("isValidCPF: rejeita sequência repetida (11111111111)", () => {
  assertEquals(isValidCPF("11111111111"), false);
  assertEquals(isValidCPF("00000000000"), false);
  assertEquals(isValidCPF("99999999999"), false);
});

Deno.test("isValidCPF: rejeita dígito verificador errado", () => {
  // CPF válido alterado no último dígito
  assertEquals(isValidCPF("52998224726"), false);
  // CPF válido alterado no penúltimo dígito
  assertEquals(isValidCPF("52998224715"), false);
});

Deno.test("isValidCPF: rejeita tamanho inválido", () => {
  assertEquals(isValidCPF("123"), false);
  assertEquals(isValidCPF("529982247250"), false);
});

// ============= Handler integration tests =============

Deno.test("handler: retorna missing_cpf quando body sem cpf", async () => {
  const res = await handler(makeRequest({}));
  const body = await res.json();
  assertEquals(res.status, 400);
  assertEquals(body.allowed, false);
  assertEquals(body.status, "missing_cpf");
});

Deno.test("handler: retorna missing_cpf quando JSON inválido", async () => {
  const res = await handler(makeRequest("not-a-json", { skipJson: true }));
  const body = await res.json();
  assertEquals(res.status, 400);
  assertEquals(body.status, "missing_cpf");
});

Deno.test("handler: retorna invalid_format para CPF curto", async () => {
  const res = await handler(makeRequest({ cpf: "123" }));
  const body = await res.json();
  assertEquals(body.allowed, false);
  assertEquals(body.status, "invalid_format");
});

Deno.test("handler: retorna invalid_format para sequência repetida", async () => {
  const res = await handler(makeRequest({ cpf: "11111111111" }));
  const body = await res.json();
  assertEquals(body.allowed, false);
  assertEquals(body.status, "invalid_format");
});

Deno.test("handler: retorna invalid_format para dígito verificador errado", async () => {
  const res = await handler(makeRequest({ cpf: "52998224726" }));
  const body = await res.json();
  assertEquals(body.allowed, false);
  assertEquals(body.status, "invalid_format");
});

Deno.test("handler: aceita CPF válido e retorna allowed=true", async () => {
  mockFetch({ body: { valido: true, ativo: true, nome: "Fulano de Tal" } });
  try {
    const res = await handler(makeRequest({ cpf: "529.982.247-25" }));
    const body = await res.json();
    assertEquals(res.status, 200);
    assertEquals(body.allowed, true);
    assertEquals(body.status, "ok");
    assertEquals(body.nome, "Fulano de Tal");
  } finally {
    restoreFetch();
  }
});

Deno.test("handler: CPF inexistente retorna not_found", async () => {
  mockFetch({ body: { valido: false, ativo: null, nome: null } });
  try {
    const res = await handler(makeRequest({ cpf: "52998224725" }));
    const body = await res.json();
    assertEquals(body.allowed, false);
    assertEquals(body.status, "not_found");
  } finally {
    restoreFetch();
  }
});

Deno.test("handler: CPF inativo retorna inactive", async () => {
  mockFetch({ body: { valido: true, ativo: false, nome: "Inativo Silva" } });
  try {
    const res = await handler(makeRequest({ cpf: "52998224725" }));
    const body = await res.json();
    assertEquals(body.allowed, false);
    assertEquals(body.status, "inactive");
  } finally {
    restoreFetch();
  }
});

Deno.test("handler: API externa indisponível (erro de rede) retorna api_unavailable", async () => {
  mockFetch("network_error");
  try {
    const res = await handler(makeRequest({ cpf: "52998224725" }));
    const body = await res.json();
    assertEquals(body.allowed, false);
    assertEquals(body.status, "api_unavailable");
  } finally {
    restoreFetch();
  }
});

Deno.test("handler: API externa retorna 500 → api_unavailable", async () => {
  mockFetch({ status: 500, body: { error: "boom" } });
  try {
    const res = await handler(makeRequest({ cpf: "52998224725" }));
    const body = await res.json();
    assertEquals(body.allowed, false);
    assertEquals(body.status, "api_unavailable");
  } finally {
    restoreFetch();
  }
});

Deno.test("handler: resposta da API não é JSON → parse_error", async () => {
  globalThis.fetch = (async () =>
    new Response("<html>not json</html>", { status: 200 })) as typeof fetch;
  try {
    const res = await handler(makeRequest({ cpf: "52998224725" }));
    const body = await res.json();
    assertEquals(body.allowed, false);
    assertEquals(body.status, "parse_error");
  } finally {
    restoreFetch();
  }
});

Deno.test("handler: requisição OPTIONS retorna CORS headers", async () => {
  const res = await handler(new Request("http://localhost/", { method: "OPTIONS" }));
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
  await res.text();
});
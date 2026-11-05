import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_SECTION_LABELS, DEFAULT_SECTION_ROUTES } from "@/lib/sections";

// Busca local (sem IA) em seções, abas e materiais do app.
// Funciona com frases faladas ou digitadas: quebra em palavras, ignora acentos,
// plurais e palavras comuns, e pontua cada item.

export type LocalHit = {
  kind: "section" | "tab" | "content";
  id: string;
  title: string;
  subtitle: string;
  route: string;
  type?: string;
  url?: string | null;
  youtube_id?: string | null;
  score: number;
};

type Entry = Omit<LocalHit, "score"> & { titleTokens: string[]; extraTokens: string[]; titleNorm: string };

const STOPWORDS = new Set(
  ("a o as os um uma uns umas de da do das dos em na no nas nos para pra pro por com sem e ou que " +
    "como onde qual quais quero queria preciso ver abrir mostrar mostra me meu minha meus minhas " +
    "sobre tem ter esta esse essa isso aqui ali la ai voce vc eu ele ela gostaria poderia pode " +
    "levar leva ir vai achar acha encontrar procurar procuro material materiais aba secao app")
    .split(" "),
);

export const normalize = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// plural -> singular simples (apresentações→apresentacao, imóveis→imovel, lances→lance)
const stem = (w: string) => {
  if (w.length <= 3) return w;
  const r = w
    .replace(/oes$/, "ao")
    .replace(/aes$/, "ao")
    .replace(/ais$/, "al")
    .replace(/eis$/, "el")
    .replace(/ns$/, "m");
  if (r !== w) return r;
  return w.length > 4 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w;
};

export const tokenize = (s: string) =>
  normalize(s)
    .split(" ")
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w))
    .map(stem);

let indexPromise: Promise<Entry[]> | null = null;
let indexTime = 0;

export const sectionRoute = (id: string, route?: string | null) =>
  route || DEFAULT_SECTION_ROUTES[id] || `/c/${id}`;

async function buildIndex(): Promise<Entry[]> {
  const [icons, tabs, contents] = await Promise.all([
    supabase.from("icon_grid_order").select("id, custom_label, route, visible").order("sort_order"),
    supabase.from("section_tabs").select("id, section_id, title"),
    supabase
      .from("section_contents")
      .select("id, title, description, type, url, youtube_id, section_id, tab_id"),
  ]);

  const sectionInfo: Record<string, { label: string; route: string }> = {};
  const entries: Entry[] = [];
  const make = (e: Omit<Entry, "titleTokens" | "extraTokens" | "titleNorm">, extra: string): Entry => ({
    ...e,
    titleTokens: tokenize(e.title),
    extraTokens: tokenize(extra),
    titleNorm: normalize(e.title),
  });

  (icons.data || [])
    .filter((s: any) => s.visible)
    .forEach((s: any) => {
      const label = s.custom_label || DEFAULT_SECTION_LABELS[s.id] || s.id;
      const route = sectionRoute(s.id, s.route);
      sectionInfo[s.id] = { label, route };
      entries.push(make({ kind: "section", id: s.id, title: label, subtitle: "Seção", route }, s.id.replace(/-/g, " ")));
    });

  const tabTitle: Record<string, string> = {};
  (tabs.data || []).forEach((t: any) => {
    tabTitle[t.id] = t.title;
    const sec = sectionInfo[t.section_id];
    if (!sec) return;
    entries.push(make({ kind: "tab", id: t.id, title: t.title, subtitle: `Aba em ${sec.label}`, route: sec.route }, sec.label));
  });

  (contents.data || []).forEach((c: any) => {
    const sec = sectionInfo[c.section_id];
    if (!sec) return;
    const tab = c.tab_id ? tabTitle[c.tab_id] : "";
    entries.push(
      make(
        {
          kind: "content",
          id: c.id,
          title: c.title,
          subtitle: tab ? `${sec.label} › ${tab}` : sec.label,
          route: sec.route,
          type: c.type,
          url: c.url,
          youtube_id: c.youtube_id,
        },
        `${c.description || ""} ${tab} ${sec.label}`,
      ),
    );
  });

  return entries;
}

function getIndex() {
  // recarrega a cada 5 min pra pegar materiais novos
  if (!indexPromise || Date.now() - indexTime > 5 * 60 * 1000) {
    indexTime = Date.now();
    indexPromise = buildIndex().catch((e) => {
      indexPromise = null;
      throw e;
    });
  }
  return indexPromise;
}

export async function localSearch(query: string, limit = 15): Promise<LocalHit[]> {
  const tokens = tokenize(query);
  const qNorm = normalize(query);
  if (!tokens.length && qNorm.length < 2) return [];
  const entries = await getIndex();

  const scored = entries.map((e) => {
    let score = 0;
    if (qNorm.length >= 3 && e.titleNorm.includes(qNorm)) score += 6;
    let matched = 0;
    for (const t of tokens) {
      let best = 0;
      for (const w of e.titleTokens) {
        if (w === t) best = Math.max(best, 3);
        else if (t.length >= 3 && (w.startsWith(t) || (w.length >= 4 && t.startsWith(w)))) best = Math.max(best, 2);
      }
      if (!best && e.extraTokens.some((w) => w === t || (t.length >= 4 && w.startsWith(t)))) best = 1;
      if (best) matched++;
      score += best;
    }
    if (tokens.length > 1 && matched === tokens.length) score += 2;
    if (score > 0 && e.kind === "section") score += 1;
    const { titleTokens, extraTokens, titleNorm, ...hit } = e;
    return { ...hit, score };
  });

  return scored
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Lista de seções visíveis com as abas de cada uma (para respostas do tipo "o que tem no app"). */
export async function sectionsOverview(): Promise<{ title: string; route: string; tabs: string[] }[]> {
  const entries = await getIndex();
  const secs = entries.filter((e) => e.kind === "section");
  return secs.map((s) => ({
    title: s.title,
    route: s.route,
    tabs: entries.filter((e) => e.kind === "tab" && e.route === s.route).map((t) => t.title),
  }));
}

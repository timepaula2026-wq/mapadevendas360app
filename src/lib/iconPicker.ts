import {
  Rocket, Wrench, Trophy, FileText, Gift, CreditCard, MapPin, Users, Globe,
  BarChart3, Briefcase, CalendarDays, MessageCircleHeart, DollarSign, School,
  GraduationCap, BookOpen, Award, Target, Megaphone, Heart, Star, Zap, Shield,
  Camera, Video, Music, Phone, Mail, Home, ShoppingBag, Package, Truck,
  Building2, Settings, HelpCircle, Bell, Search, Map, Compass, Sparkles,
  Lightbulb, Coffee, Smile, Gem, Crown, Flag, Bookmark, Folder, Database,
  Cloud, Lock, Key, Tag, Percent, TrendingUp, PieChart, Activity, Layers,
  Palette, Headphones, Mic, Image as ImageIcon, Film, Newspaper, Clipboard,
  CheckCircle2, FileCheck, Handshake, Wallet, Banknote, Receipt, Calculator,
} from "lucide-react";

// Mapa de nome -> componente. Usado pelo IconGrid para renderizar ícones dinâmicos.
export const DYNAMIC_ICONS: Record<string, React.ElementType> = {
  Rocket, Wrench, Trophy, FileText, Gift, CreditCard, MapPin, Users, Globe,
  BarChart3, Briefcase, CalendarDays, MessageCircleHeart, DollarSign, School,
  GraduationCap, BookOpen, Award, Target, Megaphone, Heart, Star, Zap, Shield,
  Camera, Video, Music, Phone, Mail, Home, ShoppingBag, Package, Truck,
  Building2, Settings, HelpCircle, Bell, Search, Map, Compass, Sparkles,
  Lightbulb, Coffee, Smile, Gem, Crown, Flag, Bookmark, Folder, Database,
  Cloud, Lock, Key, Tag, Percent, TrendingUp, PieChart, Activity, Layers,
  Palette, Headphones, Mic, ImageIcon, Film, Newspaper, Clipboard,
  CheckCircle2, FileCheck, Handshake, Wallet, Banknote, Receipt, Calculator,
};

// Heurística simples por palavras-chave para sugerir o ícone ideal.
const KEYWORD_RULES: Array<{ patterns: RegExp; icon: string }> = [
  { patterns: /trein|escol|curso|aula|aprend|educ/i, icon: "GraduationCap" },
  { patterns: /lider|lider|lideranç/i, icon: "School" },
  { patterns: /vend|crm|funil/i, icon: "BarChart3" },
  { patterns: /comiss|salar|paga|premio|prêmio|bonus|bônus/i, icon: "DollarSign" },
  { patterns: /carreir|trofeu|troféu|conquist/i, icon: "Trophy" },
  { patterns: /meta|objetiv|alvo|target/i, icon: "Target" },
  { patterns: /cliente|cust|cli/i, icon: "Globe" },
  { patterns: /equip|time|grupo|colaborad/i, icon: "Users" },
  { patterns: /agenda|calend|reuni/i, icon: "CalendarDays" },
  { patterns: /paula|fala|atend|suport|help|ajud/i, icon: "MessageCircleHeart" },
  { patterns: /jornad|trilh|caminho|rota|mapa/i, icon: "MapPin" },
  { patterns: /ferrament|tool|util/i, icon: "Wrench" },
  { patterns: /credit|emprest|financ/i, icon: "CreditCard" },
  { patterns: /sorte|brind|comun|aviso/i, icon: "Gift" },
  { patterns: /produt|aprese/i, icon: "FileText" },
  { patterns: /administr|gest|perform|360|bri/i, icon: "Briefcase" },
  { patterns: /loja|shop|compra|carri/i, icon: "ShoppingBag" },
  { patterns: /loca|alug|materi|pack/i, icon: "Package" },
  { patterns: /entreg|frete|logist/i, icon: "Truck" },
  { patterns: /banco|caixa|dinhei|conta/i, icon: "Wallet" },
  { patterns: /nota|receit|fiscal|fatur/i, icon: "Receipt" },
  { patterns: /calcul|simul/i, icon: "Calculator" },
  { patterns: /contr|termo|assin|document/i, icon: "FileCheck" },
  { patterns: /parcei|partner|aliad/i, icon: "Handshake" },
  { patterns: /relat|chart|analis|análi|grafic|gráfic/i, icon: "PieChart" },
  { patterns: /cresc|grow|alta|sub/i, icon: "TrendingUp" },
  { patterns: /atividad|status|live/i, icon: "Activity" },
  { patterns: /campa|market|divulg|propag|anunc|criativ/i, icon: "Megaphone" },
  { patterns: /coraç|coração|amor|paix|impact/i, icon: "Heart" },
  { patterns: /destaq|favor|estrel/i, icon: "Star" },
  { patterns: /rapid|veloz|energ|power|turb/i, icon: "Zap" },
  { patterns: /seguran|prote|shield/i, icon: "Shield" },
  { patterns: /foto|imagem|cam/i, icon: "Camera" },
  { patterns: /video|gravaç/i, icon: "Video" },
  { patterns: /audio|música|musica|podc|som/i, icon: "Music" },
  { patterns: /tel|fone|cont/i, icon: "Phone" },
  { patterns: /email|mensag|mail/i, icon: "Mail" },
  { patterns: /home|inicial|princ/i, icon: "Home" },
  { patterns: /empres|matriz|filial|unidad/i, icon: "Building2" },
  { patterns: /config|ajust|preferen/i, icon: "Settings" },
  { patterns: /ajuda|faq|duvid|dúvid/i, icon: "HelpCircle" },
  { patterns: /notif|alerta|sin/i, icon: "Bell" },
  { patterns: /busca|pesqu|search/i, icon: "Search" },
  { patterns: /local|region|terri/i, icon: "Map" },
  { patterns: /direc|nort|guia/i, icon: "Compass" },
  { patterns: /novidad|magic|spark|brilh/i, icon: "Sparkles" },
  { patterns: /ideia|tip|dica|insight/i, icon: "Lightbulb" },
  { patterns: /caf|break|pausa/i, icon: "Coffee" },
  { patterns: /satisf|feliz|smile/i, icon: "Smile" },
  { patterns: /joia|premium|vip|gem|diamant/i, icon: "Gem" },
  { patterns: /elite|topo|coro|rei/i, icon: "Crown" },
  { patterns: /bandei|flag|pais|país/i, icon: "Flag" },
  { patterns: /salv|favor|book/i, icon: "Bookmark" },
  { patterns: /pasta|arquivo|folder|biblio/i, icon: "Folder" },
  { patterns: /dado|base|database|banco de dados/i, icon: "Database" },
  { patterns: /nuvem|cloud|backup/i, icon: "Cloud" },
  { patterns: /lock|trav|bloque|priv/i, icon: "Lock" },
  { patterns: /chave|senh|key|acess/i, icon: "Key" },
  { patterns: /tag|cate|rotul/i, icon: "Tag" },
  { patterns: /desc|prom|off|porce/i, icon: "Percent" },
  { patterns: /camad|stack|nivel|nível/i, icon: "Layers" },
  { patterns: /design|cor|paleta|art/i, icon: "Palette" },
  { patterns: /ouv|escut|head|fone/i, icon: "Headphones" },
  { patterns: /microf|grav.*voz/i, icon: "Mic" },
  { patterns: /imag|galer|foto/i, icon: "ImageIcon" },
  { patterns: /film|cinema|movie/i, icon: "Film" },
  { patterns: /noti|jornal|news|blog|artig/i, icon: "Newspaper" },
  { patterns: /lista|check.?list|tarefa|todo/i, icon: "Clipboard" },
  { patterns: /feito|aprov|valid|conclu/i, icon: "CheckCircle2" },
  { patterns: /livro|leitura|manual|guia/i, icon: "BookOpen" },
  { patterns: /award|medal|hono|reconh/i, icon: "Award" },
];

/**
 * Sugere o ícone ideal a partir do nome digitado pelo admin.
 * Faz match com palavras-chave em português; cai em "Sparkles" como padrão.
 */
export function pickIconFromName(name: string): string {
  const text = (name || "").toLowerCase().trim();
  if (!text) return "Sparkles";
  for (const rule of KEYWORD_RULES) {
    if (rule.patterns.test(text)) return rule.icon;
  }
  return "Sparkles";
}

/** Gera um slug url-safe a partir de um nome. */
export function slugify(name: string): string {
  return (name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40) || `aba-${Date.now()}`;
}
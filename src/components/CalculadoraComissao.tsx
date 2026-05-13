import { Share2, Printer } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";

type PlanoInfo = {
  label: string;
  segmento: string;
  parcelas: number[]; // percentuais por mês
};

// Tabela 2025 — % de comissão por mês sobre o valor da carta
const planos: Record<string, PlanoInfo> = {
  // VEÍCULOS
  vei_lin_20: {
    segmento: "Veículos",
    label: "Linear e Reduzido (Grupos até 1621) — 2%",
    parcelas: [0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1544],
  },
  vei_lin_23: {
    segmento: "Veículos",
    label: "Linear e Reduzido (Grupos acima 1622) — 2,3%",
    parcelas: [0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1544, 0.3],
  },
  // SERVIÇOS
  serv_lin_23: {
    segmento: "Serviços",
    label: "Linear e Reduzido — 2,3%",
    parcelas: [0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1544, 0.3],
  },
  // IMÓVEIS — Grupos 530 a 790
  imo530_50: {
    segmento: "Imóveis (Grupos 530 a 790)",
    label: "Plano 50% — 2%",
    parcelas: [0.1111, 0.1111, 0.1111, 0.1111, 0.1111, 0.1111, 0.1111, 0.1111, 0.1111, 0.1111, 0.1111, 0.1111, 0.1111, 0.1111, 0.1111, 0.1111, 0.1111, 0.1113],
  },
  imo530_70: {
    segmento: "Imóveis (Grupos 530 a 790)",
    label: "Plano 70% — 2%",
    parcelas: [0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1544],
  },
  imo530_100: {
    segmento: "Imóveis (Grupos 530 a 790)",
    label: "Plano 100% — 2%",
    parcelas: [0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2],
  },
  imo530_100_tx_vista: {
    segmento: "Imóveis (Grupos 530 a 790)",
    label: "Plano 100% c/ 1% Tx. Adm. à vista — 2%",
    parcelas: [1.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
  },
  // IMÓVEIS — Grupo 800 em diante
  imo800_100_1024: {
    segmento: "Imóveis (Grupo 800 em diante)",
    label: "Plano 100% (1024) — 2,3%",
    parcelas: [0.2091, 0.2091, 0.2091, 0.2091, 0.2091, 0.2091, 0.2091, 0.2091, 0.2091, 0.2091, 0.209],
  },
  imo800_85_1025: {
    segmento: "Imóveis (Grupo 800 em diante)",
    label: "Plano 85% (1025) — 2,3%",
    parcelas: [0.1917, 0.1917, 0.1917, 0.1917, 0.1917, 0.1917, 0.1917, 0.1917, 0.1917, 0.1917, 0.1917, 0.1913],
  },
  imo800_70_1026: {
    segmento: "Imóveis (Grupo 800 em diante)",
    label: "Plano 70% (1026) — 2,3%",
    parcelas: [0.1769, 0.1769, 0.1769, 0.1769, 0.1769, 0.1769, 0.1769, 0.1769, 0.1769, 0.1769, 0.1769, 0.1769, 0.1772],
  },
  imo800_50_1027: {
    segmento: "Imóveis (Grupo 800 em diante)",
    label: "Plano 50% (1027) — 2,3%",
    parcelas: [0.1288, 0.1288, 0.1288, 0.1288, 0.1288, 0.1288, 0.1288, 0.1288, 0.1288, 0.1288, 0.2374, 0.2374, 0.2372, 0.3],
  },
  imo800_100_tx_vista_1037: {
    segmento: "Imóveis (Grupo 800 em diante)",
    label: "Plano 100% c/ 1% Tx. Adm. à vista (1037) — 2,3%",
    parcelas: [1.13, 0.13, 0.13, 0.13, 0.13, 0.13, 0.13, 0.13, 0.13, 0.13],
  },
  imo800_85_tx_vista_1038: {
    segmento: "Imóveis (Grupo 800 em diante)",
    label: "Plano 85% c/ 1% Tx. Adm. à vista (1038) — 2,3%",
    parcelas: [1.1182, 0.1182, 0.1182, 0.1182, 0.1182, 0.1182, 0.1182, 0.1182, 0.1182, 0.1182, 0.118],
  },
  imo800_70_tx_vista_1039: {
    segmento: "Imóveis (Grupo 800 em diante)",
    label: "Plano 70% c/ 1% Tx. Adm. à vista (1039) — 2,3%",
    parcelas: [1.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
  },
  imo800_100_tx4x_1040: {
    segmento: "Imóveis (Grupo 800 em diante)",
    label: "Plano 100% c/ 1% Tx. Adm. parcelada 4x (1040) — 2,3%",
    parcelas: [0.38, 0.38, 0.38, 0.38, 0.13, 0.13, 0.13, 0.13, 0.13, 0.13],
  },
  imo800_85_tx4x_1041: {
    segmento: "Imóveis (Grupo 800 em diante)",
    label: "Plano 85% c/ 1% Tx. Adm. parcelada 4x (1041) — 2,3%",
    parcelas: [0.3682, 0.3682, 0.3682, 0.3682, 0.1182, 0.1182, 0.1182, 0.1182, 0.1182, 0.1182, 0.118],
  },
  imo800_70_tx4x_1042: {
    segmento: "Imóveis (Grupo 800 em diante)",
    label: "Plano 70% c/ 1% Tx. Adm. parcelada 4x (1042) — 2,3%",
    parcelas: [0.35, 0.35, 0.35, 0.35, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
  },
  imo800_70_tx4x_1047: {
    segmento: "Imóveis (Grupo 800 em diante)",
    label: "Plano 70% c/ 1% Tx. Adm. parcelada 4x (1047) — 2,3%",
    parcelas: [0.3429, 0.3429, 0.3429, 0.3429, 0.0929, 0.0929, 0.0929, 0.0929, 0.0929, 0.0929, 0.0929, 0.0929, 0.0929, 0.0923],
  },
  imo800_100_tx4x_1043: {
    segmento: "Imóveis (Grupo 800 em diante)",
    label: "Plano 100% c/ 2% Tx. Adm. parcelada 4x (1043) — 2,3%",
    parcelas: [0.53, 0.53, 0.53, 0.53, 0.03, 0.03, 0.03, 0.03, 0.03, 0.03],
  },
  imo800_85_tx4x_1044: {
    segmento: "Imóveis (Grupo 800 em diante)",
    label: "Plano 85% c/ 2% Tx. Adm. parcelada 4x (1044) — 2,3%",
    parcelas: [0.5273, 0.5273, 0.5273, 0.5273, 0.0273, 0.0273, 0.0273, 0.0273, 0.0273, 0.0273, 0.027],
  },
  imo800_70_tx4x_1045: {
    segmento: "Imóveis (Grupo 800 em diante)",
    label: "Plano 70% c/ 2% Tx. Adm. parcelada 4x (1045) — 2,3%",
    parcelas: [0.5231, 0.5231, 0.5231, 0.5231, 0.0231, 0.0231, 0.0231, 0.0231, 0.0231, 0.0231, 0.0231, 0.0231, 0.0228],
  },
  imo800_50_tx4x_1046: {
    segmento: "Imóveis (Grupo 800 em diante)",
    label: "Plano 50% c/ 2% Tx. Adm. parcelada 4x (1046) — 2,3%",
    parcelas: [1.0929, 0.0929, 0.0929, 0.0929, 0.0929, 0.0929, 0.0929, 0.0929, 0.0929, 0.0929, 0.0929, 0.0929, 0.0929, 0.0923],
  },
};

const segmentos = Array.from(new Set(Object.values(planos).map((p) => p.segmento)));

function formatarEntrada(value: string): string {
  const v = value.replace(/\D/g, "");
  if (!v) return "";
  const num = (parseInt(v) / 100).toFixed(2);
  let formatted = num.replace(".", ",");
  formatted = formatted.replace(/(\d)(\d{3})(\d{3}),/g, "$1.$2.$3,");
  formatted = formatted.replace(/(\d)(\d{3}),/g, "$1.$2,");
  return formatted;
}

function limparValor(v: string): number {
  return parseFloat(v.replace(/\./g, "").replace(",", "."));
}

interface Parcela {
  mes: number;
  bruto: number;
  liquido: number;
}

const CalculadoraComissao = () => {
  const [valorInput, setValorInput] = useState("");
  const [plano, setPlano] = useState<string>("vei_lin_23");
  const [resultado, setResultado] = useState<{ parcelas: Parcela[]; totalBruto: number; totalLiq: number; imposto: number } | null>(null);

  const calcular = () => {
    const valorCarta = limparValor(valorInput);
    if (isNaN(valorCarta) || valorCarta <= 0) return;
    const parcPerc = planos[plano].parcelas;
    let totalBruto = 0;
    const parcelas: Parcela[] = parcPerc.map((p, i) => {
      const bruto = valorCarta * (p / 100);
      totalBruto += bruto;
      return { mes: i + 1, bruto, liquido: bruto * 0.98 };
    });
    setResultado({ parcelas, totalBruto, totalLiq: totalBruto * 0.98, imposto: totalBruto * 0.02 });
  };

  const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const gerarTexto = () => {
    if (!resultado) return "";
    let texto = `📊 Calculadora de Comissão\n`;
    texto += `Plano: ${planos[plano].label}\nValor da Carta: R$ ${valorInput}\n\n`;
    texto += `Comissão Bruta: R$ ${fmt(resultado.totalBruto)}\n`;
    texto += `Impostos (2%): - R$ ${fmt(resultado.imposto)}\n`;
    texto += `Líquido: R$ ${fmt(resultado.totalLiq)}\n\n`;
    texto += resultado.parcelas.map(p => `${p.mes}º mês: Bruto R$ ${fmt(p.bruto)} | Líq R$ ${fmt(p.liquido)}`).join("\n");
    return texto;
  };

  const compartilhar = async () => {
    const texto = gerarTexto();
    if (navigator.share) {
      try { await navigator.share({ title: "Comissão", text: texto }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(texto);
      toast.success("Resultado copiado!");
    }
  };

  const imprimir = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow || !resultado) return;
    const rows = resultado.parcelas.map(p =>
      `<tr><td>${p.mes}º</td><td>R$ ${fmt(p.bruto)}</td><td>R$ ${fmt(p.liquido)}</td></tr>`
    ).join("");
    printWindow.document.write(`<html><head><title>Comissão</title><style>
      body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse;margin-top:12px}
      th,td{border:1px solid #ccc;padding:8px;text-align:center}th{background:#f0f0f0}
      .dest{color:#d9534f;font-weight:bold}
    </style></head><body>
      <h2>Calculadora de Comissão</h2>
      <p><b>Plano:</b> ${planos[plano].label}<br><b>Valor da Carta:</b> R$ ${valorInput}</p>
      <p><b>Comissão Bruta:</b> R$ ${fmt(resultado.totalBruto)}</p>
      <p class="dest">Impostos (2%): - R$ ${fmt(resultado.imposto)}</p>
      <p><b>Recebimento Líquido: R$ ${fmt(resultado.totalLiq)}</b></p>
      <table><tr><th>Mês</th><th>Bruto</th><th>Líquido (-2%)</th></tr>${rows}</table>
    </body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-center text-lg">Calcule sua Comissão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Valor da Carta (R$)</Label>
            <Input
              value={valorInput}
              onChange={(e) => setValorInput(formatarEntrada(e.target.value))}
              placeholder="Ex: 250.000,00"
              inputMode="numeric"
            />
          </div>
          <div>
            <Label>Plano de Vendas (Tabela 2025)</Label>
            <Select value={plano} onValueChange={setPlano}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-[60vh]">
                {segmentos.map((seg) => (
                  <SelectGroup key={seg}>
                    <SelectLabel>{seg}</SelectLabel>
                    {Object.entries(planos)
                      .filter(([, p]) => p.segmento === seg)
                      .map(([key, p]) => (
                        <SelectItem key={key} value={key}>{p.label}</SelectItem>
                      ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={calcular} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold">
            Calcular Parcelado
          </Button>
        </CardContent>
      </Card>

      {resultado && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2 text-sm">
              <p><span className="font-bold">Comissão Bruta:</span> R$ {fmt(resultado.totalBruto)}</p>
              <p className="text-destructive font-bold">Impostos (2%): - R$ {fmt(resultado.imposto)}</p>
              <p className="font-bold text-base">Recebimento Líquido: R$ {fmt(resultado.totalLiq)}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border p-2 text-center">Mês</th>
                    <th className="border border-border p-2 text-center">Bruto</th>
                    <th className="border border-border p-2 text-center">Líquido (-2%)</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.parcelas.map((p) => (
                    <tr key={p.mes}>
                      <td className="border border-border p-2 text-center">{p.mes}º</td>
                      <td className="border border-border p-2 text-center">R$ {fmt(p.bruto)}</td>
                      <td className="border border-border p-2 text-center">R$ {fmt(p.liquido)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={compartilhar} variant="outline" className="flex-1 gap-2">
                <Share2 className="w-4 h-4" /> Compartilhar
              </Button>
              <Button onClick={imprimir} variant="outline" className="flex-1 gap-2">
                <Printer className="w-4 h-4" /> Imprimir
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CalculadoraComissao;
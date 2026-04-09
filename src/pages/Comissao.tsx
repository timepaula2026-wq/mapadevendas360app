import { ArrowLeft, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const tabelas: Record<string, number[]> = {
  "linear_23": [0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1544, 0.3],
  "linear_20": [0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1538, 0.1544],
  "imoveis_1024": [0.2091, 0.2091, 0.2091, 0.2091, 0.2091, 0.2091, 0.2091, 0.2091, 0.2091, 0.2091, 0.2090],
  "imoveis_50": [0.1111, 0.1111, 0.1111, 0.1111, 0.1111, 0.1111, 0.1111, 0.1111, 0.1111, 0.1111, 0.1111, 0.1111, 0.1111, 0.1111, 0.1111, 0.1111, 0.1111, 0.1113],
};

const planoLabels: Record<string, string> = {
  "linear_23": "Linear/Reduzido - 2.3%",
  "linear_20": "Linear/Reduzido - 2.0%",
  "imoveis_1024": "Plano 100% (G. 1024) - 2.3%",
  "imoveis_50": "Plano 50% (Imóveis) - 2.0%",
};

function formatarEntrada(value: string): string {
  let v = value.replace(/\D/g, "");
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

const Comissao = () => {
  const navigate = useNavigate();
  const [valorInput, setValorInput] = useState("");
  const [plano, setPlano] = useState("linear_23");
  const [resultado, setResultado] = useState<{ parcelas: Parcela[]; totalBruto: number; totalLiq: number; imposto: number } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValorInput(formatarEntrada(e.target.value));
  };

  const calcular = () => {
    const valorCarta = limparValor(valorInput);
    if (isNaN(valorCarta) || valorCarta <= 0) return;

    const parcPerc = tabelas[plano];
    let totalBruto = 0;
    const parcelas: Parcela[] = parcPerc.map((p, i) => {
      const bruto = valorCarta * (p / 100);
      totalBruto += bruto;
      return { mes: i + 1, bruto, liquido: bruto * 0.98 };
    });

    setResultado({
      parcelas,
      totalBruto,
      totalLiq: totalBruto * 0.98,
      imposto: totalBruto * 0.02,
    });
  };

  const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="bg-gradient-to-r from-[hsl(348,70%,35%)] to-[hsl(340,65%,25%)] text-white p-4 flex items-center gap-3">
        <button onClick={() => navigate("/")} className="p-1">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <DollarSign className="w-6 h-6" />
        <h1 className="text-lg font-bold">Calculadora de Comissão</h1>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-center text-lg">Calcule sua Comissão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Valor da Carta (R$)</Label>
              <Input
                value={valorInput}
                onChange={handleInputChange}
                placeholder="Ex: 250.000,00"
                inputMode="numeric"
              />
            </div>

            <div>
              <Label>Plano de Vendas (Tabela 2025)</Label>
              <Select value={plano} onValueChange={setPlano}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(planoLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
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
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Comissao;

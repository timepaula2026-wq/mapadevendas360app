import { useState } from "react";
import { Calculator, ChevronDown } from "lucide-react";
import CalculadoraComissao from "@/components/CalculadoraComissao";

const CalculadoraCollapsible = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent/50 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Calculator className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Calculadora de Comissão</p>
            <p className="text-xs text-muted-foreground">
              {open ? "Toque para esconder" : "Toque para mostrar"}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-border">
          <CalculadoraComissao />
        </div>
      )}
    </div>
  );
};

export default CalculadoraCollapsible;
import { ArrowLeft, FileText, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

const products = [
  { name: "Catálogo Digital 2026", type: "PDF", size: "2.4 MB" },
  { name: "Tabela de Preços", type: "PDF", size: "1.1 MB" },
  { name: "Apresentação Institucional", type: "PPTX", size: "5.8 MB" },
  { name: "Vídeo de Produtos", type: "MP4", size: "12 MB" },
  { name: "Material de Apoio", type: "PDF", size: "3.2 MB" },
];

const ApresentacaoProdutos = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-br from-slate-600 to-slate-800 px-5 pt-12 pb-8">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white/80 mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Voltar</span>
        </button>
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-white" />
          <h1 className="text-xl font-bold text-white">Apresentação de Produtos</h1>
        </div>
        <p className="text-white/70 text-sm mt-2">Materiais para apresentar aos seus clientes.</p>
      </div>

      <div className="px-5 mt-6 space-y-3">
        {products.map((p, i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.type} • {p.size}</p>
            </div>
            <Download className="w-4 h-4 text-muted-foreground" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApresentacaoProdutos;

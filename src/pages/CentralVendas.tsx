import { ArrowLeft, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SectionContentList from "@/components/SectionContentList";

const CentralVendas = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-br from-red-700 to-red-900 px-5 pt-12 pb-8">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white/80 mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Voltar</span>
        </button>
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-white" />
          <h1 className="text-xl font-bold text-white">CRM & Ferramentas</h1>
        </div>
        <p className="text-white/70 text-sm mt-2">Acesse seu CRM e ferramentas de apoio à venda.</p>
      </div>

      <div className="px-5 mt-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">Conteúdos</h2>
        <SectionContentList sectionId="vendas" />
      </div>
    </div>
  );
};

export default CentralVendas;

import { useEffect, useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SectionContentList from "@/components/SectionContentList";
import { DYNAMIC_ICONS } from "@/lib/iconPicker";

const CustomSection = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [info, setInfo] = useState<{ id: string; label: string; icon: string } | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      const { data } = await supabase
        .from("icon_grid_order")
        .select("id, custom_label, icon_name")
        .eq("id", slug)
        .maybeSingle();
      if (!data) setNotFound(true);
      else
        setInfo({
          id: data.id,
          label: (data as { custom_label?: string }).custom_label || data.id,
          icon: (data as { icon_name?: string }).icon_name || "Sparkles",
        });
    };
    load();
  }, [slug]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <p className="text-muted-foreground mb-4">Aba não encontrada.</p>
        <button onClick={() => navigate("/")} className="text-primary text-sm">Voltar para o início</button>
      </div>
    );
  }

  const Icon = (info && DYNAMIC_ICONS[info.icon]) || Sparkles;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-br from-[hsl(348,70%,35%)] to-[hsl(340,65%,25%)] px-5 pt-12 pb-8">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white/80 mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Voltar</span>
        </button>
        <div className="flex items-center gap-3">
          <Icon className="w-8 h-8 text-white" />
          <h1 className="text-xl font-bold text-white">{info?.label || "Carregando..."}</h1>
        </div>
      </div>

      <div className="px-5 mt-6">
        {info && <SectionContentList sectionId={info.id} />}
      </div>
    </div>
  );
};

export default CustomSection;
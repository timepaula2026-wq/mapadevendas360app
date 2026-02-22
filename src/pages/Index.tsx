import { useState } from "react";
import { Menu, Search, LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import BannerCarousel from "@/components/BannerCarousel";
import IconGrid from "@/components/IconGrid";
import BottomNav from "@/components/BottomNav";

const Index = () => {
  const { signOut, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("home");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 pt-10 pb-4">
        <button className="text-muted-foreground hover:text-foreground">
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-gradient-gold">Mapa de Vendas</h1>
        <div className="flex items-center gap-3">
          <button className="text-muted-foreground hover:text-foreground">
            <Search className="w-5 h-5" />
          </button>
          <button onClick={signOut} className="text-muted-foreground hover:text-foreground">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Banner */}
      <div className="px-4 mb-5">
        <BannerCarousel />
      </div>

      {/* Icon Grid */}
      <div className="px-4">
        <IconGrid />
      </div>

      {/* Bottom Nav */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;

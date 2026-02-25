import { useState, useEffect } from "react";
import { Menu, Search, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import BannerCarousel from "@/components/BannerCarousel";
import IconGrid from "@/components/IconGrid";
import BottomNav from "@/components/BottomNav";
import NotificationBell from "@/components/NotificationBell";
import ProfileSidebar from "@/components/ProfileSidebar";
import SearchOverlay from "@/components/SearchOverlay";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Track last active
  useEffect(() => {
    if (user) {
      supabase.from("profiles").update({ last_active_at: new Date().toISOString() }).eq("user_id", user.id).then(() => {});
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Profile Sidebar */}
      <ProfileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {/* Search Overlay */}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Top bar */}
      <header className="flex items-center justify-between px-5 pt-10 pb-4">
        <button onClick={() => setSidebarOpen(true)} className="text-white/80 hover:text-white">
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-gradient-gold">Mapa de Vendas</h1>
        <div className="flex items-center gap-1">
          <div className="w-9 h-9 flex items-center justify-center"><NotificationBell /></div>
          <button onClick={() => setSearchOpen(true)} className="w-9 h-9 flex items-center justify-center text-white/80 hover:text-white">
            <Search className="w-5 h-5" />
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

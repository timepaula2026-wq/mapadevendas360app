import { useState, useEffect } from "react";
import { Menu, Search, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import BannerCarousel from "@/components/BannerCarousel";
import IconGrid from "@/components/IconGrid";
import BottomNav from "@/components/BottomNav";
import ProfileSidebar from "@/components/ProfileSidebar";
import SearchOverlay from "@/components/SearchOverlay";
import { useAppSettings } from "@/hooks/useAppSettings";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { settings } = useAppSettings();

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
      {settings.show_header && (
        <header className="header-glass sticky top-0 z-40 flex items-center justify-between px-5 pt-8 pb-3">
          <button onClick={() => setSidebarOpen(true)} className="text-white/80 hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
          <div className={`flex-1 flex items-center gap-2 ${
            settings.header_alignment === "left" ? "justify-start ml-3" :
            settings.header_alignment === "right" ? "justify-end mr-3" : "justify-center"
          }`}>
            {settings.header_logo_url && (
              <img src={settings.header_logo_url} alt="Logo" className="w-7 h-7 object-contain" />
            )}
            <h1 className="text-lg font-light tracking-wide text-foreground">{settings.header_title}</h1>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setSearchOpen(true)} className="w-9 h-9 flex items-center justify-center text-white/80 hover:text-white">
              <Search className="w-5 h-5" />
            </button>
          </div>
        </header>
      )}

      {/* Banner — proporção 16:6 */}
      <div className="hero-radial px-4 pt-4 mb-4">
        <div
          className="rounded-2xl overflow-hidden"
          style={{ aspectRatio: "16 / 6", maxHeight: 180, minHeight: 150 }}
        >
          <BannerCarousel />
        </div>
      </div>

      {/* Icon Grid — 4 cols x 3 rows */}
      <div className="px-4 py-4">
        <IconGrid />
      </div>

      {/* Bottom Nav */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;

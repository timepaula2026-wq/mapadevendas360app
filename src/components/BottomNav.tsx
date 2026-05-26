import { useState } from "react";
import { Home, Headphones, Bot, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import SupportDialog from "@/components/SupportDialog";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [supportOpen, setSupportOpen] = useState(false);

  const tabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "chatbot", label: "IA do Consórcio", icon: Bot, route: "/chatbot" },
    { id: "support", label: "Suporte", icon: Headphones, action: () => setSupportOpen(true) },
  ];

  return (
    <>
    <nav className="fixed bottom-3 left-3 right-3 z-50 flex justify-center pointer-events-none">
      <div className="floating-dock pointer-events-auto flex items-center justify-around gap-1 px-3 py-2 max-w-md w-full">
        {tabs.map(({ id, label, icon: Icon, route, action }: any) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => {
                if (action) action();
                else if (route) navigate(route);
                else onTabChange(id);
              }}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={1.6} />
              <span className="text-[10px] font-medium">{label}</span>
              {isActive && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
        <button
          onClick={signOut}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-colors text-muted-foreground hover:text-destructive"
        >
          <LogOut className="w-5 h-5" strokeWidth={1.6} />
          <span className="text-[10px] font-medium">Sair</span>
        </button>
      </div>
    </nav>
    <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
    </>
  );
};

export default BottomNav;

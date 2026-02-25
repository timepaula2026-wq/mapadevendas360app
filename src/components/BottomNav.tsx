import { Home, Headphones, Bot, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "home", label: "Home", icon: Home },
  { id: "chatbot", label: "Assistente IA", icon: Bot, route: "/chatbot" },
  { id: "support", label: "Suporte", icon: Headphones },
];

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border">
      <div className="flex items-center justify-around max-w-md mx-auto py-2">
        {tabs.map(({ id, label, icon: Icon, route }) => (
          <button
            key={id}
            onClick={() => {
              if (route) navigate(route);
              else onTabChange(id);
            }}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-colors ${
              activeTab === id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
        <button
          onClick={signOut}
          className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-colors text-muted-foreground hover:text-destructive"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[10px] font-medium">Sair</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;

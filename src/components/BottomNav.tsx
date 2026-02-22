import { Home, PlusCircle, Headphones, Bot } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "home", label: "Home", icon: Home },
  { id: "chatbot", label: "Assistente IA", icon: Bot, route: "/chatbot" },
  { id: "add", label: "Novidades", icon: PlusCircle },
  { id: "support", label: "Suporte", icon: Headphones },
];

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const navigate = useNavigate();

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
      </div>
    </nav>
  );
};

export default BottomNav;

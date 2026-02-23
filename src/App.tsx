import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useApprovalCheck } from "@/hooks/useApprovalCheck";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import TrainingsList from "./pages/TrainingsList";
import TrainingDetail from "./pages/TrainingDetail";
import TrilhaIniciante from "./pages/TrilhaIniciante";
import CentralVendas from "./pages/CentralVendas";
import Ferramentas from "./pages/Ferramentas";
import PlanoCarreira from "./pages/PlanoCarreira";
import ApresentacaoProdutos from "./pages/ApresentacaoProdutos";
import Sorteios from "./pages/Sorteios";
import LiberacaoCredito from "./pages/LiberacaoCredito";
import JornadaImpacto from "./pages/JornadaImpacto";
import GestaoEquipe from "./pages/GestaoEquipe";
import AreaCliente from "./pages/AreaCliente";
import PlataformaAnalise from "./pages/PlataformaAnalise";
import ChatBot from "./pages/ChatBot";
import AdminPanel from "./pages/AdminPanel";
import Loja from "./pages/Loja";
import Locacao from "./pages/Locacao";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { approved, loading: approvalLoading } = useApprovalCheck();

  if (loading || approvalLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;
  if (approved === false) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-sm w-full space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-yellow-500/10 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-yellow-500" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Aguardando aprovação</h2>
        <p className="text-sm text-muted-foreground">
          Seu cadastro foi recebido e está aguardando aprovação do administrador. Você receberá acesso em breve.
        </p>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-sm text-primary hover:underline"
        >
          Sair
        </button>
      </div>
    </div>
  );
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/trainings" element={<ProtectedRoute><TrainingsList /></ProtectedRoute>} />
            <Route path="/training/:id" element={<ProtectedRoute><TrainingDetail /></ProtectedRoute>} />
            <Route path="/trilha" element={<ProtectedRoute><TrilhaIniciante /></ProtectedRoute>} />
            <Route path="/vendas" element={<ProtectedRoute><CentralVendas /></ProtectedRoute>} />
            <Route path="/ferramentas" element={<ProtectedRoute><Ferramentas /></ProtectedRoute>} />
            <Route path="/carreira" element={<ProtectedRoute><PlanoCarreira /></ProtectedRoute>} />
            <Route path="/apresentacao" element={<ProtectedRoute><ApresentacaoProdutos /></ProtectedRoute>} />
            <Route path="/sorteios" element={<ProtectedRoute><Sorteios /></ProtectedRoute>} />
            <Route path="/credito" element={<ProtectedRoute><LiberacaoCredito /></ProtectedRoute>} />
            <Route path="/jornada" element={<ProtectedRoute><JornadaImpacto /></ProtectedRoute>} />
            <Route path="/equipe" element={<ProtectedRoute><GestaoEquipe /></ProtectedRoute>} />
            <Route path="/cliente" element={<ProtectedRoute><AreaCliente /></ProtectedRoute>} />
            <Route path="/analise" element={<ProtectedRoute><PlataformaAnalise /></ProtectedRoute>} />
            <Route path="/chatbot" element={<ProtectedRoute><ChatBot /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
            <Route path="/loja" element={<ProtectedRoute><Loja /></ProtectedRoute>} />
            <Route path="/locacao" element={<ProtectedRoute><Locacao /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

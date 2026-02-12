import { useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { SubscriptionProvider, useSubscription } from "@/hooks/useSubscription";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "sonner";
import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";
import TrialExpirado from "./pages/TrialExpirado";
import Produtos from "./pages/Produtos";
import Vendas from "./pages/Vendas";
import RelatorioVendas from "./pages/RelatorioVendas";
import Caixa from "./pages/Caixa";
import Fiscal from "./pages/Fiscal";
import FiscalConfig from "./pages/FiscalConfig";
import FiscalConfigEdit from "./pages/FiscalConfigEdit";
import AssinadorDownload from "./pages/AssinadorDownload";
import AuditLogs from "./pages/AuditLogs";
import Financeiro from "./pages/Financeiro";
import Configuracoes from "./pages/Configuracoes";
import Usuarios from "./pages/Usuarios";
import Revendas from "./pages/Revendas";
import Clientes from "./pages/Clientes";
import Fornecedores from "./pages/Fornecedores";
import Funcionarios from "./pages/Funcionarios";
import Transportadoras from "./pages/Transportadoras";
import Categorias from "./pages/Categorias";
import Etiquetas from "./pages/Etiquetas";
import Auth from "./pages/Auth";
import PDV from "./pages/PDV";
import NotFound from "./pages/NotFound";
import Instalar from "./pages/Instalar";
import Termos from "./pages/Termos";
import Privacidade from "./pages/Privacidade";
import PainelLucro from "./pages/PainelLucro";
import AlertaFinanceiro from "./pages/AlertaFinanceiro";
import Empresas from "./pages/Empresas";
import DRE from "./pages/DRE";
import FluxoCaixaProjetado from "./pages/FluxoCaixaProjetado";
import CentroCusto from "./pages/CentroCusto";
import Comissoes from "./pages/Comissoes";
import ConciliacaoBancaria from "./pages/ConciliacaoBancaria";
import Inventario from "./pages/Inventario";
import CurvaABC from "./pages/CurvaABC";
import Lotes from "./pages/Lotes";
import Movimentacoes from "./pages/Movimentacoes";
import Perdas from "./pages/Perdas";
import Fidelidade from "./pages/Fidelidade";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const { companyId, loading: companyLoading } = useCompany();
  const { subscribed, trialExpired, loading: subLoading } = useSubscription();
  const hasSignedOut = useRef(false);

  useEffect(() => {
    if (!loading && !companyLoading && user && companyId === null && !hasSignedOut.current) {
      hasSignedOut.current = true;
      toast.error("Sua conta foi desativada. Entre em contato com o administrador.");
      signOut();
    }
  }, [loading, companyLoading, user, companyId, signOut]);

  useEffect(() => {
    if (!user) {
      hasSignedOut.current = false;
    }
  }, [user]);

  if (loading || companyLoading || subLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  if (!companyId) return <Navigate to="/" replace />;

  // Trial expired and no active subscription → redirect to plans
  if (trialExpired && !subscribed) {
    return <Navigate to="/trial-expirado" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public landing page for unauthenticated users */}
      <Route path="/" element={
        user ? <Navigate to="/dashboard" replace /> : <LandingPage />
      } />
      <Route path="/auth" element={
        user && !window.location.hash.includes("type=") && sessionStorage.getItem("needs-password-setup") !== "true"
          ? <Navigate to="/dashboard" replace /> 
          : <Auth />
      } />
      <Route path="/landing" element={
        user ? <Navigate to="/dashboard" replace /> : <LandingPage />
      } />
      <Route path="/install" element={<Instalar />} />
      <Route path="/termos" element={<Termos />} />
      <Route path="/privacidade" element={<Privacidade />} />
      <Route path="/trial-expirado" element={
        user ? <TrialExpirado /> : <Navigate to="/" replace />
      } />
      {/* PDV: full-screen, outside AppLayout */}
      <Route
        path="/pdv"
        element={
          <ProtectedRoute>
            <PDV />
          </ProtectedRoute>
        }
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/painel-lucro" element={<PainelLucro />} />
                <Route path="/alertas" element={<AlertaFinanceiro />} />
                <Route path="/produtos" element={<Produtos />} />
                <Route path="/vendas" element={<Vendas />} />
                <Route path="/relatorio-vendas" element={<RelatorioVendas />} />
                <Route path="/caixa" element={<Caixa />} />
                <Route path="/fiscal" element={<Fiscal />} />
                <Route path="/fiscal/config" element={<FiscalConfig />} />
                <Route path="/fiscal/config/edit" element={<FiscalConfigEdit />} />
                <Route path="/fiscal/assinador" element={<AssinadorDownload />} />
                <Route path="/fiscal/auditoria" element={<AuditLogs />} />
                <Route path="/financeiro" element={<Financeiro />} />
                <Route path="/dre" element={<DRE />} />
                <Route path="/fluxo-caixa" element={<FluxoCaixaProjetado />} />
                <Route path="/centro-custo" element={<CentroCusto />} />
                <Route path="/comissoes" element={<Comissoes />} />
                <Route path="/conciliacao" element={<ConciliacaoBancaria />} />
                <Route path="/configuracoes" element={<Configuracoes />} />
                <Route path="/usuarios" element={<Usuarios />} />
                <Route path="/revendas" element={<Revendas />} />
                <Route path="/cadastro/empresas" element={<Empresas />} />
                <Route path="/cadastro/clientes" element={<Clientes />} />
                <Route path="/cadastro/fornecedores" element={<Fornecedores />} />
                <Route path="/cadastro/funcionarios" element={<Funcionarios />} />
                <Route path="/cadastro/transportadoras" element={<Transportadoras />} />
                <Route path="/cadastro/categorias" element={<Categorias />} />
                <Route path="/estoque/movimentacoes" element={<Movimentacoes />} />
                <Route path="/estoque/inventario" element={<Inventario />} />
                <Route path="/estoque/curva-abc" element={<CurvaABC />} />
                <Route path="/estoque/lotes" element={<Lotes />} />
                <Route path="/estoque/perdas" element={<Perdas />} />
                <Route path="/fidelidade" element={<Fidelidade />} />
                <Route path="/etiquetas" element={<Etiquetas />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SubscriptionProvider>
            <AppRoutes />
          </SubscriptionProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "sonner";
import Dashboard from "./pages/Dashboard";
import Produtos from "./pages/Produtos";
import Vendas from "./pages/Vendas";
import RelatorioVendas from "./pages/RelatorioVendas";
import Caixa from "./pages/Caixa";
import Fiscal from "./pages/Fiscal";
import FiscalConfig from "./pages/FiscalConfig";
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
import Auth from "./pages/Auth";
import PDV from "./pages/PDV";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const { companyId, loading: companyLoading } = useCompany();
  const hasSignedOut = useRef(false);

  useEffect(() => {
    // Only sign out if user exists, company finished loading, and no company found
    if (!loading && !companyLoading && user && companyId === null && !hasSignedOut.current) {
      hasSignedOut.current = true;
      toast.error("Sua conta foi desativada. Entre em contato com o administrador.");
      signOut();
    }
  }, [loading, companyLoading, user, companyId, signOut]);

  // Reset the ref when user changes (e.g., logs back in)
  useEffect(() => {
    if (!user) {
      hasSignedOut.current = false;
    }
  }, [user]);

  if (loading || companyLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!companyId) return <Navigate to="/auth" replace />;

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
      <Route path="/auth" element={
        user && !window.location.hash.includes("type=") && sessionStorage.getItem("needs-password-setup") !== "true"
          ? <Navigate to="/" replace /> 
          : <Auth />
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
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/produtos" element={<Produtos />} />
                <Route path="/vendas" element={<Vendas />} />
                <Route path="/relatorio-vendas" element={<RelatorioVendas />} />
                <Route path="/caixa" element={<Caixa />} />
                <Route path="/fiscal" element={<Fiscal />} />
                <Route path="/fiscal/config" element={<FiscalConfig />} />
                <Route path="/fiscal/assinador" element={<AssinadorDownload />} />
                <Route path="/fiscal/auditoria" element={<AuditLogs />} />
                <Route path="/financeiro" element={<Financeiro />} />
                <Route path="/configuracoes" element={<Configuracoes />} />
                <Route path="/usuarios" element={<Usuarios />} />
                <Route path="/revendas" element={<Revendas />} />
                <Route path="/cadastro/clientes" element={<Clientes />} />
                <Route path="/cadastro/fornecedores" element={<Fornecedores />} />
                <Route path="/cadastro/funcionarios" element={<Funcionarios />} />
                <Route path="/cadastro/transportadoras" element={<Transportadoras />} />
                <Route path="/cadastro/categorias" element={<Categorias />} />
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
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

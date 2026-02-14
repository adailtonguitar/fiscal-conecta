import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { PlanGate } from "@/components/PlanGate";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { useAdminRole } from "@/hooks/useAdminRole";
import { SubscriptionProvider, useSubscription } from "@/hooks/useSubscription";
import { LocalDBProvider } from "@/components/providers/LocalDBProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { toast } from "sonner";

// Lazy-loaded pages for code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const TrialExpirado = lazy(() => import("./pages/TrialExpirado"));
const Produtos = lazy(() => import("./pages/Produtos"));
const Vendas = lazy(() => import("./pages/Vendas"));
const RelatorioVendas = lazy(() => import("./pages/RelatorioVendas"));
const Caixa = lazy(() => import("./pages/Caixa"));
const Fiscal = lazy(() => import("./pages/Fiscal"));
const FiscalConfig = lazy(() => import("./pages/FiscalConfig"));
const FiscalConfigEdit = lazy(() => import("./pages/FiscalConfigEdit"));
const AssinadorDownload = lazy(() => import("./pages/AssinadorDownload"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const Financeiro = lazy(() => import("./pages/Financeiro"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const Usuarios = lazy(() => import("./pages/Usuarios"));
const Revendas = lazy(() => import("./pages/Revendas"));
const Clientes = lazy(() => import("./pages/Clientes"));
const Fornecedores = lazy(() => import("./pages/Fornecedores"));
const Funcionarios = lazy(() => import("./pages/Funcionarios"));
const Transportadoras = lazy(() => import("./pages/Transportadoras"));
const Categorias = lazy(() => import("./pages/Categorias"));
const Etiquetas = lazy(() => import("./pages/Etiquetas"));
const Auth = lazy(() => import("./pages/Auth"));
const PDV = lazy(() => import("./pages/PDV"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Instalar = lazy(() => import("./pages/Instalar"));
const Termos = lazy(() => import("./pages/Termos"));
const Privacidade = lazy(() => import("./pages/Privacidade"));
const PainelLucro = lazy(() => import("./pages/PainelLucro"));
const AlertaFinanceiro = lazy(() => import("./pages/AlertaFinanceiro"));
const Empresas = lazy(() => import("./pages/Empresas"));
const DRE = lazy(() => import("./pages/DRE"));
const FluxoCaixaProjetado = lazy(() => import("./pages/FluxoCaixaProjetado"));
const CentroCusto = lazy(() => import("./pages/CentroCusto"));
const Comissoes = lazy(() => import("./pages/Comissoes"));
const ConciliacaoBancaria = lazy(() => import("./pages/ConciliacaoBancaria"));
const Inventario = lazy(() => import("./pages/Inventario"));
const CurvaABC = lazy(() => import("./pages/CurvaABC"));
const Lotes = lazy(() => import("./pages/Lotes"));
const Movimentacoes = lazy(() => import("./pages/Movimentacoes"));
const Perdas = lazy(() => import("./pages/Perdas"));
const Fidelidade = lazy(() => import("./pages/Fidelidade"));
const RelatoriosIA = lazy(() => import("./pages/RelatoriosIA"));
const Orcamentos = lazy(() => import("./pages/Orcamentos"));
const Promocoes = lazy(() => import("./pages/Promocoes"));
const Fiado = lazy(() => import("./pages/Fiado"));
const PedidosCompra = lazy(() => import("./pages/PedidosCompra"));
const Terminais = lazy(() => import("./pages/Terminais"));
const Admin = lazy(() => import("./pages/Admin"));

const queryClient = new QueryClient();

const PageSpinner = () => (
  <div className="flex items-center justify-center h-screen bg-background">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const { companyId, loading: companyLoading } = useCompany();
  const { subscribed, trialExpired, subscriptionOverdue, blocked, loading: subLoading } = useSubscription();
  const { isSuperAdmin, loading: adminLoading } = useAdminRole();
  const hasSignedOut = useRef(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [companyCheckDone, setCompanyCheckDone] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  // Safety timeout: if loading takes more than 12s, force completion
  useEffect(() => {
    const timer = setTimeout(() => {
      setTimedOut(true);
      console.warn("[ProtectedRoute] Loading timeout reached", {
        loading, companyLoading, subLoading, adminLoading, companyId, companyCheckDone
      });
    }, 12000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading && !companyLoading && user && companyId === null && !hasSignedOut.current) {
      const checkCompany = async () => {
        try {
          const { data } = await (await import("@/integrations/supabase/client")).supabase
            .from("company_users")
            .select("id")
            .eq("user_id", user.id)
            .limit(1);
          
          if (!data || data.length === 0) {
            setShowOnboarding(true);
          } else if (!companyId) {
            hasSignedOut.current = true;
            toast.error("Sua conta foi desativada. Entre em contato com o administrador.");
            signOut();
          }
        } catch (err) {
          console.error("[ProtectedRoute] Company check failed:", err);
        }
        setCompanyCheckDone(true);
      };
      checkCompany();
    } else if (companyId) {
      setCompanyCheckDone(true);
    }
  }, [loading, companyLoading, user, companyId, signOut]);

  useEffect(() => {
    if (!user) {
      hasSignedOut.current = false;
      setShowOnboarding(false);
      setCompanyCheckDone(false);
    }
  }, [user]);

  const isStillLoading = loading || companyLoading || subLoading || adminLoading || (!companyId && !companyCheckDone);

  if (isStillLoading && !timedOut) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  if (showOnboarding) {
    return <OnboardingWizard onComplete={() => window.location.reload()} />;
  }

  if (!companyId && !showOnboarding) return <Navigate to="/" replace />;

  // Kill switch or subscription block (super_admin bypasses)
  if (!isSuperAdmin && (blocked || (trialExpired && !subscribed) || subscriptionOverdue)) {
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
    <Suspense fallback={<PageSpinner />}>
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
                <Suspense fallback={<PageSpinner />}>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/painel-lucro" element={<PlanGate feature="hasProfitPanel" featureName="Painel de Lucro"><PainelLucro /></PlanGate>} />
                    <Route path="/alertas" element={<PlanGate feature="hasFinancialAlerts" featureName="Alertas Financeiros"><AlertaFinanceiro /></PlanGate>} />
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
                    <Route path="/dre" element={<PlanGate feature="hasDre" featureName="DRE"><DRE /></PlanGate>} />
                    <Route path="/fluxo-caixa" element={<PlanGate feature="hasCashFlow" featureName="Fluxo de Caixa Projetado"><FluxoCaixaProjetado /></PlanGate>} />
                    <Route path="/centro-custo" element={<PlanGate feature="hasCostCenter" featureName="Centro de Custo"><CentroCusto /></PlanGate>} />
                    <Route path="/comissoes" element={<PlanGate feature="hasCommissions" featureName="Comissões"><Comissoes /></PlanGate>} />
                    <Route path="/conciliacao" element={<PlanGate feature="hasBankReconciliation" featureName="Conciliação Bancária"><ConciliacaoBancaria /></PlanGate>} />
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
                    <Route path="/estoque/curva-abc" element={<PlanGate feature="hasAbcCurve" featureName="Curva ABC"><CurvaABC /></PlanGate>} />
                    <Route path="/estoque/lotes" element={<Lotes />} />
                    <Route path="/estoque/perdas" element={<Perdas />} />
                    <Route path="/fidelidade" element={<PlanGate feature="hasLoyalty" featureName="Programa de Fidelidade"><Fidelidade /></PlanGate>} />
                    <Route path="/relatorios-ia" element={<PlanGate feature="hasAiReports" featureName="Relatórios com IA"><RelatoriosIA /></PlanGate>} />
                    <Route path="/etiquetas" element={<Etiquetas />} />
                    <Route path="/orcamentos" element={<PlanGate feature="hasQuotes" featureName="Orçamentos"><Orcamentos /></PlanGate>} />
                    <Route path="/promocoes" element={<Promocoes />} />
                    <Route path="/fiado" element={<Fiado />} />
                    <Route path="/pedidos-compra" element={<PedidosCompra />} />
                    <Route path="/terminais" element={<Terminais />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <SubscriptionProvider>
              <LocalDBProvider>
                <AppRoutes />
              </LocalDBProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

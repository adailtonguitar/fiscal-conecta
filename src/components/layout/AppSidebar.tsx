import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ShoppingCart, LayoutDashboard, Package, FileText, Settings,
  Wifi, WifiOff, RefreshCw, ChevronLeft, ChevronRight, ChevronDown,
  Store, Receipt, Shield, ScrollText, LogOut, DollarSign, Landmark,
  Users, Building2, ClipboardList, UserCheck, Factory, Truck, Tags, BarChart3, ArrowUpDown,
  Download, Tag, TrendingUp, AlertTriangle as AlertTriangleIcon, FileSpreadsheet, GitGraph,
  Percent, ArrowRightLeft, TrendingDown, Gift, Brain, Monitor, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useSync } from "@/hooks/useSync";
import { useIsReseller } from "@/hooks/useIsReseller";
import { useAdminRole } from "@/hooks/useAdminRole";

interface NavItem {
  icon: any;
  label: string;
  path: string;
}

interface NavGroup {
  icon: any;
  label: string;
  children: NavItem[];
}

type NavEntry = NavItem | NavGroup;

function isGroup(entry: NavEntry): entry is NavGroup {
  return "children" in entry;
}

const navItems: NavEntry[] = [
  { icon: ShoppingCart, label: "PDV", path: "/pdv" },
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  {
    icon: Package,
    label: "Estoque",
    children: [
      { icon: Package, label: "Produtos", path: "/produtos" },
      { icon: ArrowUpDown, label: "Movimentações", path: "/estoque/movimentacoes" },
      { icon: ClipboardList, label: "Inventário", path: "/estoque/inventario" },
      { icon: BarChart3, label: "Curva ABC", path: "/estoque/curva-abc" },
      { icon: Tags, label: "Lotes & Validade", path: "/estoque/lotes" },
      { icon: TrendingDown, label: "Perdas", path: "/estoque/perdas" },
    ],
  },
  {
    icon: FileText,
    label: "Vendas",
    children: [
      { icon: FileText, label: "Histórico", path: "/vendas" },
      { icon: ScrollText, label: "Orçamentos", path: "/orcamentos" },
    ],
  },
  {
    icon: BarChart3,
    label: "Relatórios",
    children: [
      { icon: BarChart3, label: "Relatório Vendas", path: "/relatorio-vendas" },
      { icon: Brain, label: "Relatórios IA", path: "/relatorios-ia" },
    ],
  },
  { icon: Monitor, label: "Terminais", path: "/terminais" },
  { icon: DollarSign, label: "Caixa", path: "/caixa" },
  { icon: Landmark, label: "Financeiro", path: "/financeiro" },
  { icon: FileSpreadsheet, label: "DRE", path: "/dre" },
  { icon: GitGraph, label: "Fluxo Projetado", path: "/fluxo-caixa" },
  { icon: Building2, label: "Centro de Custo", path: "/centro-custo" },
  { icon: Percent, label: "Comissões", path: "/comissoes" },
  { icon: ArrowRightLeft, label: "Conciliação Bancária", path: "/conciliacao" },
  { icon: TrendingUp, label: "Painel de Lucro", path: "/painel-lucro" },
  { icon: AlertTriangleIcon, label: "Alertas Financeiros", path: "/alertas" },
  {
    icon: ClipboardList,
    label: "Cadastro",
    children: [
      { icon: Building2, label: "Empresa", path: "/cadastro/empresas" },
      { icon: Users, label: "Clientes", path: "/cadastro/clientes" },
      { icon: Factory, label: "Fornecedores", path: "/cadastro/fornecedores" },
      { icon: UserCheck, label: "Funcionários", path: "/cadastro/funcionarios" },
      { icon: Truck, label: "Transportadoras", path: "/cadastro/transportadoras" },
      { icon: Tags, label: "Categorias", path: "/cadastro/categorias" },
      { icon: Users, label: "Usuários", path: "/usuarios" },
    ],
  },
  { icon: Gift, label: "Fidelidade", path: "/fidelidade" },
  { icon: Tag, label: "Etiquetas", path: "/etiquetas" },
  { icon: Receipt, label: "Fiscal", path: "/fiscal" },
  { icon: Shield, label: "Config. Fiscal", path: "/fiscal/config" },
  { icon: ScrollText, label: "Auditoria", path: "/fiscal/auditoria" },
  { icon: Download, label: "Assinador Digital", path: "/fiscal/assinador" },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
  { icon: Download, label: "Instalar App", path: "/install" },
];

const resellerNavItem: NavItem = { icon: Building2, label: "Revendas", path: "/revendas" };
const adminNavItem: NavItem = { icon: ShieldCheck, label: "Admin", path: "/admin" };

export function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { isOnline, pendingCount, syncing, syncAll } = useSync();
  const { signOut } = useAuth();
  const { isReseller } = useIsReseller();
  const { isSuperAdmin } = useAdminRole();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    // Auto-open groups that have an active child on initial load
    const initial: Record<string, boolean> = {};
    navItems.forEach((entry) => {
      if (isGroup(entry)) {
        initial[entry.label] = entry.children.some((c) => location.pathname === c.path);
      }
    });
    return initial;
  });

  let visibleNavItems: NavEntry[] = isReseller
    ? [...navItems.slice(0, -1), resellerNavItem, navItems[navItems.length - 1]]
    : navItems;
  if (isSuperAdmin) {
    visibleNavItems = [...visibleNavItems, adminNavItem];
  }

  const toggleGroup = (label: string) => {
    if (collapsed) return;
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isChildActive = (group: NavGroup) =>
    group.children.some((c) => location.pathname === c.path);

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 relative z-10",
        collapsed ? "w-[72px]" : "w-[240px]"
      )}
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg brand-gradient flex items-center justify-center flex-shrink-0">
          <Store className="w-5 h-5 text-primary-foreground" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} className="overflow-hidden">
              <h1 className="text-sm font-bold text-sidebar-accent-foreground whitespace-nowrap">AnthoSystem</h1>
              <p className="text-[10px] text-sidebar-foreground whitespace-nowrap">Sistema de Vendas</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {visibleNavItems.map((entry) => {
          if (isGroup(entry)) {
            const groupOpen = !!openGroups[entry.label];
            return (
              <div key={entry.label}>
                <button
                  onClick={() => toggleGroup(entry.label)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isChildActive(entry)
                      ? "text-sidebar-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <entry.icon className="w-5 h-5 flex-shrink-0" />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap flex-1 text-left">
                        {entry.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {!collapsed && (
                    <ChevronDown className={cn("w-4 h-4 transition-transform", groupOpen && "rotate-180")} />
                  )}
                </button>
                <AnimatePresence>
                  {groupOpen && !collapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden ml-4 border-l border-sidebar-border pl-2 space-y-0.5"
                    >
                      {entry.children.map((child) => {
                        const isActive = location.pathname === child.path;
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200",
                              isActive
                                ? "bg-sidebar-accent text-sidebar-primary"
                                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            )}
                          >
                            <child.icon className={cn("w-4 h-4 flex-shrink-0", isActive && "text-sidebar-primary")} />
                            <span className="whitespace-nowrap">{child.label}</span>
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          const isActive = location.pathname === entry.path;
          return (
            <Link
              key={entry.path}
              to={entry.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <entry.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-sidebar-primary")} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
                    {entry.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-3 space-y-2">
        {pendingCount > 0 && (
          <button
            onClick={syncAll}
            disabled={syncing || !isOnline}
            className={cn("flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent w-full", collapsed && "justify-center")}
          >
            <RefreshCw className={cn("w-4 h-4 text-warning flex-shrink-0", syncing && "animate-spin")} />
            {!collapsed && <span className="text-xs text-sidebar-foreground">{pendingCount} pendentes</span>}
          </button>
        )}
        <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg", collapsed && "justify-center")}>
          {isOnline ? (
            <><Wifi className="w-4 h-4 status-online flex-shrink-0" />{!collapsed && <span className="text-xs status-online font-medium">Online</span>}</>
          ) : (
            <><WifiOff className="w-4 h-4 status-offline flex-shrink-0" />{!collapsed && <span className="text-xs status-offline font-medium">Offline</span>}</>
          )}
        </div>
        <button onClick={signOut} className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors", collapsed && "justify-center")}>
          <LogOut className="w-4 h-4 flex-shrink-0" />{!collapsed && <span className="text-xs">Sair</span>}
        </button>
        <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-center py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}

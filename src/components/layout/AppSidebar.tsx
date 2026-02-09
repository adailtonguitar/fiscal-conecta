import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ShoppingCart,
  LayoutDashboard,
  Package,
  FileText,
  Settings,
  Wifi,
  WifiOff,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Store,
  Receipt,
  Shield,
  ScrollText,
  LogOut,
  DollarSign,
  Landmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { icon: ShoppingCart, label: "PDV", path: "/" },
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Package, label: "Produtos", path: "/produtos" },
  { icon: FileText, label: "Vendas", path: "/vendas" },
  { icon: DollarSign, label: "Caixa", path: "/caixa" },
  { icon: Landmark, label: "Financeiro", path: "/financeiro" },
  { icon: Receipt, label: "Fiscal", path: "/fiscal" },
  { icon: Shield, label: "Config. Fiscal", path: "/fiscal/config" },
  { icon: ScrollText, label: "Auditoria", path: "/fiscal/auditoria" },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
];

export function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [isOnline] = useState(true);
  const [pendingSync] = useState(2);
  const { signOut } = useAuth();

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
              <h1 className="text-sm font-bold text-sidebar-accent-foreground whitespace-nowrap">PDV Fiscal</h1>
              <p className="text-[10px] text-sidebar-foreground whitespace-nowrap">Sistema de Vendas</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-sidebar-primary")} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-3 space-y-2">
        {pendingSync > 0 && (
          <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent", collapsed && "justify-center")}>
            <RefreshCw className="w-4 h-4 text-warning sync-pulse flex-shrink-0" />
            {!collapsed && <span className="text-xs text-sidebar-foreground">{pendingSync} pendentes</span>}
          </div>
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

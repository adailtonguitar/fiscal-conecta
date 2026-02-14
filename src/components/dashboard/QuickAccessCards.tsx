import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShoppingCart, Package, DollarSign, FileText, CreditCard, Users,
  Settings2, LayoutDashboard, BarChart3, Receipt, Tag, Gift,
  Landmark, ClipboardList, Truck, Factory, Brain, ArrowUpDown,
  Percent, TrendingUp, AlertTriangle, Monitor, Shield, X, Check,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface ShortcutItem {
  id: string;
  icon: any;
  label: string;
  path: string;
  color: string;
}

const ALL_SHORTCUTS: ShortcutItem[] = [
  { id: "pdv", icon: ShoppingCart, label: "PDV", path: "/pdv", color: "text-primary" },
  { id: "produtos", icon: Package, label: "Produtos", path: "/produtos", color: "text-emerald-500" },
  { id: "financeiro", icon: Landmark, label: "Financeiro", path: "/financeiro", color: "text-amber-500" },
  { id: "vendas", icon: FileText, label: "Vendas", path: "/vendas", color: "text-blue-500" },
  { id: "caixa", icon: CreditCard, label: "Caixa", path: "/caixa", color: "text-violet-500" },
  { id: "clientes", icon: Users, label: "Clientes", path: "/cadastro/clientes", color: "text-rose-500" },
  { id: "movimentacoes", icon: ArrowUpDown, label: "Movimentações", path: "/estoque/movimentacoes", color: "text-cyan-500" },
  { id: "inventario", icon: ClipboardList, label: "Inventário", path: "/estoque/inventario", color: "text-teal-500" },
  { id: "curva-abc", icon: BarChart3, label: "Curva ABC", path: "/estoque/curva-abc", color: "text-indigo-500" },
  { id: "orcamentos", icon: Receipt, label: "Orçamentos", path: "/orcamentos", color: "text-orange-500" },
  { id: "relatorio-vendas", icon: BarChart3, label: "Relatório Vendas", path: "/relatorio-vendas", color: "text-sky-500" },
  { id: "relatorios-ia", icon: Brain, label: "Relatórios IA", path: "/relatorios-ia", color: "text-purple-500" },
  { id: "terminais", icon: Monitor, label: "Terminais", path: "/terminais", color: "text-slate-500" },
  { id: "dre", icon: DollarSign, label: "DRE", path: "/dre", color: "text-lime-500" },
  { id: "comissoes", icon: Percent, label: "Comissões", path: "/comissoes", color: "text-pink-500" },
  { id: "painel-lucro", icon: TrendingUp, label: "Painel de Lucro", path: "/painel-lucro", color: "text-green-500" },
  { id: "alertas", icon: AlertTriangle, label: "Alertas", path: "/alertas", color: "text-yellow-500" },
  { id: "fornecedores", icon: Factory, label: "Fornecedores", path: "/cadastro/fornecedores", color: "text-stone-500" },
  { id: "transportadoras", icon: Truck, label: "Transportadoras", path: "/cadastro/transportadoras", color: "text-neutral-500" },
  { id: "etiquetas", icon: Tag, label: "Etiquetas", path: "/etiquetas", color: "text-fuchsia-500" },
  { id: "fidelidade", icon: Gift, label: "Fidelidade", path: "/fidelidade", color: "text-red-500" },
  { id: "fiscal", icon: Receipt, label: "Fiscal", path: "/fiscal", color: "text-zinc-500" },
  { id: "config-fiscal", icon: Shield, label: "Config. Fiscal", path: "/fiscal/config", color: "text-gray-500" },
];

const DEFAULT_IDS = ["pdv", "produtos", "financeiro", "vendas", "caixa", "clientes"];
const STORAGE_KEY = "dashboard_quick_access";
const MAX_SHORTCUTS = 8;

export function QuickAccessCards() {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_IDS;
  });
  const [tempIds, setTempIds] = useState<string[]>(selectedIds);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedIds));
  }, [selectedIds]);

  const visibleShortcuts = ALL_SHORTCUTS.filter((s) => selectedIds.includes(s.id));

  const toggleTemp = (id: string) => {
    setTempIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < MAX_SHORTCUTS ? [...prev, id] : prev
    );
  };

  const handleSave = () => {
    setSelectedIds(tempIds);
    setOpen(false);
  };

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) setTempIds(selectedIds);
    setOpen(isOpen);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground">Acesso Rápido</h2>
        <Dialog open={open} onOpenChange={handleOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Settings2 className="w-3.5 h-3.5" />
              Editar
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Personalizar Acesso Rápido</DialogTitle>
            </DialogHeader>
            <p className="text-xs text-muted-foreground mb-3">
              Selecione até {MAX_SHORTCUTS} atalhos ({tempIds.length}/{MAX_SHORTCUTS})
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto pr-1">
              {ALL_SHORTCUTS.map((item) => {
                const checked = tempIds.includes(item.id);
                const disabled = !checked && tempIds.length >= MAX_SHORTCUTS;
                return (
                  <label
                    key={item.id}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      checked ? "border-primary/50 bg-primary/5" : "border-border hover:border-muted-foreground/30"
                    } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => !disabled && toggleTemp(item.id)}
                      disabled={disabled}
                    />
                    <item.icon className={`w-4 h-4 ${item.color} flex-shrink-0`} />
                    <span className="text-xs font-medium text-foreground truncate">{item.label}</span>
                  </label>
                );
              })}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={tempIds.length === 0}>
                <Check className="w-4 h-4 mr-1" />
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {visibleShortcuts.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
          >
            <Link
              to={item.path}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-md transition-all duration-200 group"
            >
              <item.icon className={`w-6 h-6 ${item.color} group-hover:scale-110 transition-transform`} />
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{item.label}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

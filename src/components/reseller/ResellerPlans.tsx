import { useState } from "react";
import { CreditCard, Plus, Edit2, Trash2, Users, Package, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import type { ResellerPlan } from "@/hooks/useReseller";

interface Props {
  plans: ResellerPlan[];
  markupPercentage: number;
  onCreatePlan: (plan: { name: string; description?: string; max_users: number; max_products: number; base_price: number; reseller_price: number }) => Promise<void>;
  onUpdatePlan: (planId: string, updates: Partial<ResellerPlan>) => Promise<void>;
  onDeletePlan: (planId: string) => Promise<void>;
}

export function ResellerPlans({ plans, markupPercentage, onCreatePlan, onUpdatePlan, onDeletePlan }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    max_users: 1,
    max_products: 100,
    base_price: 0,
    reseller_price: 0,
  });

  const resetForm = () => {
    setForm({ name: "", description: "", max_users: 1, max_products: 100, base_price: 0, reseller_price: 0 });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!form.name) return;
    if (editingId) {
      await onUpdatePlan(editingId, form);
    } else {
      await onCreatePlan(form);
    }
    resetForm();
  };

  const startEdit = (plan: ResellerPlan) => {
    setForm({
      name: plan.name,
      description: plan.description || "",
      max_users: plan.max_users,
      max_products: plan.max_products,
      base_price: plan.base_price,
      reseller_price: plan.reseller_price,
    });
    setEditingId(plan.id);
    setShowForm(true);
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Planos & Licenças</h2>
          <p className="text-sm text-muted-foreground">Markup configurado: {markupPercentage}%</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" />
          Novo Plano
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl card-shadow border border-border p-5 space-y-4"
        >
          <h3 className="text-sm font-semibold text-foreground">{editingId ? "Editar Plano" : "Novo Plano"}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Nome</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Descrição</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Máx. Usuários</label>
              <input type="number" value={form.max_users} onChange={(e) => setForm({ ...form, max_users: +e.target.value })} className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Máx. Produtos</label>
              <input type="number" value={form.max_products} onChange={(e) => setForm({ ...form, max_products: +e.target.value })} className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Preço Base (custo)</label>
              <input type="number" step="0.01" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: +e.target.value })} className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm font-mono" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Preço de Revenda</label>
              <input type="number" step="0.01" value={form.reseller_price} onChange={(e) => setForm({ ...form, reseller_price: +e.target.value })} className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm font-mono" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
              {editingId ? "Salvar" : "Criar Plano"}
            </button>
            <button onClick={resetForm} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:opacity-90">
              Cancelar
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl card-shadow border border-border overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">{plan.name}</h3>
              </div>
              <div className="flex gap-1">
                <button onClick={() => startEdit(plan)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                  <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button onClick={() => onDeletePlan(plan.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {plan.description && <p className="text-xs text-muted-foreground">{plan.description}</p>}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Até {plan.max_users} usuários</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Package className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Até {plan.max_products} produtos</span>
                </div>
              </div>
              <div className="pt-3 border-t border-border space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Custo</span>
                  <span className="font-mono text-foreground">{formatCurrency(plan.base_price)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-foreground">Preço revenda</span>
                  <span className="font-mono text-primary">{formatCurrency(plan.reseller_price)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Margem</span>
                  <span className="font-mono text-success">{formatCurrency(plan.reseller_price - plan.base_price)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {plans.length === 0 && !showForm && (
          <div className="col-span-full text-center py-12 text-muted-foreground text-sm">
            Nenhum plano criado. Clique em "Novo Plano" para começar.
          </div>
        )}
      </div>
    </div>
  );
}

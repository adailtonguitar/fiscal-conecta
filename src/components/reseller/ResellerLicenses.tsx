import { useState } from "react";
import { Building2, Plus, Edit2, Search, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import type { ResellerLicense, ResellerPlan } from "@/hooks/useReseller";

interface Props {
  licenses: ResellerLicense[];
  plans: ResellerPlan[];
  onCreateLicense: (data: { plan_id: string; company_id: string; status?: string }) => Promise<void>;
  onUpdateLicense: (licenseId: string, updates: Partial<ResellerLicense>) => Promise<void>;
}

const statusConfig: Record<string, { label: string; icon: any; classes: string }> = {
  ativa: { label: "Ativa", icon: CheckCircle, classes: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  trial: { label: "Trial", icon: Clock, classes: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  suspensa: { label: "Suspensa", icon: AlertTriangle, classes: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  cancelada: { label: "Cancelada", icon: XCircle, classes: "bg-muted text-muted-foreground" },
};

export function ResellerLicenses({ licenses, plans, onCreateLicense, onUpdateLicense }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [form, setForm] = useState({
    company_id: "",
    plan_id: "",
    status: "trial",
  });

  const resetForm = () => {
    setForm({ company_id: "", plan_id: "", status: "trial" });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!form.company_id || !form.plan_id) return;
    if (editingId) {
      await onUpdateLicense(editingId, { plan_id: form.plan_id, status: form.status });
    } else {
      await onCreateLicense({ company_id: form.company_id, plan_id: form.plan_id, status: form.status });
    }
    resetForm();
  };

  const startEdit = (license: ResellerLicense) => {
    setForm({
      company_id: license.company_id,
      plan_id: license.plan_id,
      status: license.status,
    });
    setEditingId(license.id);
    setShowForm(true);
  };

  const getPlanName = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    return plan?.name || "Plano removido";
  };

  const filteredLicenses = licenses.filter((l) => {
    const matchesSearch = l.company_id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "todos" || l.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");

  const inputClass =
    "w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Licenças de Clientes</h2>
          <p className="text-sm text-muted-foreground">
            {licenses.length} licença{licenses.length !== 1 ? "s" : ""} • {licenses.filter((l) => l.status === "ativa").length} ativa{licenses.filter((l) => l.status === "ativa").length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" />
          Nova Licença
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por ID da empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputClass} pl-9`}
          />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={`${inputClass} w-auto min-w-[140px]`}>
          <option value="todos">Todos</option>
          <option value="ativa">Ativa</option>
          <option value="trial">Trial</option>
          <option value="suspensa">Suspensa</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </div>

      {/* New/Edit Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl card-shadow border border-border p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">{editingId ? "Editar Licença" : "Nova Licença"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">ID da Empresa *</label>
              <input
                value={form.company_id}
                onChange={(e) => setForm({ ...form, company_id: e.target.value })}
                disabled={!!editingId}
                placeholder="UUID da empresa cliente"
                className={`${inputClass} ${editingId ? "opacity-50" : ""}`}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Plano *</label>
              <select value={form.plan_id} onChange={(e) => setForm({ ...form, plan_id: e.target.value })} className={inputClass}>
                <option value="">Selecione...</option>
                {plans
                  .filter((p) => p.is_active)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
                <option value="trial">Trial</option>
                <option value="ativa">Ativa</option>
                <option value="suspensa">Suspensa</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
              {editingId ? "Salvar" : "Criar Licença"}
            </button>
            <button onClick={resetForm} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:opacity-90">
              Cancelar
            </button>
          </div>
        </motion.div>
      )}

      {/* License list */}
      <div className="bg-card rounded-xl card-shadow border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Empresa</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Plano</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Início</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Expira</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLicenses.map((license) => {
                const status = statusConfig[license.status] || statusConfig.cancelada;
                const StatusIcon = status.icon;
                return (
                  <tr key={license.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-mono text-xs text-foreground">{license.company_id.slice(0, 12)}...</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-foreground">{getPlanName(license.plan_id)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${status.classes}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDate(license.started_at)}</td>
                    <td className="px-5 py-3 text-muted-foreground">{license.expires_at ? formatDate(license.expires_at) : "—"}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => startEdit(license)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="Editar">
                        <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredLicenses.length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            {licenses.length === 0 ? "Nenhuma licença criada. Clique em \"Nova Licença\" para atribuir um plano a uma empresa." : "Nenhuma licença encontrada com os filtros aplicados."}
          </div>
        )}
      </div>
    </div>
  );
}

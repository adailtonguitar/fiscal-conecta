import { useState } from "react";
import { Building2, Plus, Edit2, Search, CheckCircle, XCircle, Clock, AlertTriangle, User, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { ResellerLicense, ResellerPlan } from "@/hooks/useReseller";
import { useCnpjLookup } from "@/hooks/useCnpjLookup";

interface Props {
  licenses: ResellerLicense[];
  plans: ResellerPlan[];
  onCreateLicense: (data: any) => Promise<void>;
  onUpdateLicense: (licenseId: string, updates: any) => Promise<void>;
}

const statusConfig: Record<string, { label: string; icon: any; classes: string }> = {
  ativa: { label: "Ativa", icon: CheckCircle, classes: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  trial: { label: "Trial", icon: Clock, classes: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  suspensa: { label: "Suspensa", icon: AlertTriangle, classes: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  cancelada: { label: "Cancelada", icon: XCircle, classes: "bg-muted text-muted-foreground" },
};

const emptyForm = {
  company_id: "",
  plan_id: "",
  status: "trial",
  client_name: "",
  client_trade_name: "",
  client_cnpj: "",
  client_email: "",
  client_phone: "",
  seller_name: "",
  seller_phone: "",
  seller_email: "",
};

export function ResellerLicenses({ licenses, plans, onCreateLicense, onUpdateLicense }: Props) {
  const { lookup: cnpjLookup, loading: cnpjLoading } = useCnpjLookup();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [form, setForm] = useState({ ...emptyForm });

  const updateField = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const resetForm = () => {
    setForm({ ...emptyForm });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!form.client_name.trim()) { toast.error("Razão Social do cliente é obrigatória"); return; }
    if (!form.client_cnpj.trim()) { toast.error("CNPJ do cliente é obrigatório"); return; }
    if (!form.client_email.trim()) { toast.error("E-mail do cliente é obrigatório"); return; }
    if (!form.client_phone.trim()) { toast.error("Telefone do cliente é obrigatório"); return; }
    if (!form.seller_name.trim()) { toast.error("Nome do vendedor é obrigatório"); return; }
    if (!form.plan_id) { toast.error("Selecione um plano"); return; }

    const payload = {
      plan_id: form.plan_id,
      company_id: form.company_id || null,
      status: form.status,
      client_name: form.client_name.trim(),
      client_trade_name: form.client_trade_name.trim() || null,
      client_cnpj: form.client_cnpj.trim(),
      client_email: form.client_email.trim(),
      client_phone: form.client_phone.trim(),
      seller_name: form.seller_name.trim(),
      seller_phone: form.seller_phone.trim() || null,
      seller_email: form.seller_email.trim() || null,
    };

    if (editingId) {
      await onUpdateLicense(editingId, payload);
    } else {
      await onCreateLicense(payload);
    }
    resetForm();
  };

  const startEdit = (license: ResellerLicense) => {
    const l = license as any;
    setForm({
      company_id: license.company_id,
      plan_id: license.plan_id,
      status: license.status,
      client_name: l.client_name || "",
      client_trade_name: l.client_trade_name || "",
      client_cnpj: l.client_cnpj || "",
      client_email: l.client_email || "",
      client_phone: l.client_phone || "",
      seller_name: l.seller_name || "",
      seller_phone: l.seller_phone || "",
      seller_email: l.seller_email || "",
    });
    setEditingId(license.id);
    setShowForm(true);
  };

  const getPlanName = (planId: string) => plans.find((p) => p.id === planId)?.name || "Plano removido";

  const filteredLicenses = licenses.filter((l) => {
    const name = (l as any).client_name || l.company_id;
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) ||
      ((l as any).client_cnpj || "").includes(search);
    const matchesStatus = filterStatus === "todos" || l.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");

  const inputClass = "w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

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
          onClick={() => { resetForm(); setShowForm(true); }}
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
            placeholder="Buscar por nome ou CNPJ..."
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

      {/* Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl card-shadow border border-border p-5 space-y-5">
          <h3 className="text-sm font-semibold text-foreground">{editingId ? "Editar Licença" : "Nova Licença"}</h3>

          {/* Dados da Empresa Cliente */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" />
              Dados da Empresa Cliente
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-foreground mb-1 block">Razão Social *</label>
                <input value={form.client_name} onChange={(e) => updateField("client_name", e.target.value)} placeholder="Empresa do Cliente LTDA" className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Nome Fantasia</label>
                <input value={form.client_trade_name} onChange={(e) => updateField("client_trade_name", e.target.value)} placeholder="Nome Fantasia" className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">CNPJ *</label>
                <div className="flex gap-2">
                  <input value={form.client_cnpj} onChange={(e) => updateField("client_cnpj", e.target.value)} placeholder="00.000.000/0001-00" className={`${inputClass} flex-1`} />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!form.client_cnpj) return;
                      const result = await cnpjLookup(form.client_cnpj);
                      if (!result) return;
                      setForm((prev) => ({
                        ...prev,
                        client_name: result.name || prev.client_name,
                        client_trade_name: result.trade_name || prev.client_trade_name,
                        client_email: result.email || prev.client_email,
                        client_phone: result.phone || prev.client_phone,
                      }));
                    }}
                    disabled={cnpjLoading || !form.client_cnpj}
                    className="shrink-0 px-3 py-2 rounded-lg border border-border bg-secondary text-secondary-foreground text-sm hover:opacity-90 transition-all disabled:opacity-50"
                    title="Buscar dados do CNPJ"
                  >
                    {cnpjLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">E-mail *</label>
                <input type="email" value={form.client_email} onChange={(e) => updateField("client_email", e.target.value)} placeholder="contato@cliente.com" className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Telefone *</label>
                <input value={form.client_phone} onChange={(e) => updateField("client_phone", e.target.value)} placeholder="(11) 99999-0000" className={inputClass} />
              </div>
            </div>
          </div>

          {/* Dados do Vendedor */}
          <div className="space-y-3 pt-3 border-t border-border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <User className="w-3.5 h-3.5" />
              Dados do Vendedor / Responsável
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Nome *</label>
                <input value={form.seller_name} onChange={(e) => updateField("seller_name", e.target.value)} placeholder="João da Silva" className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Telefone</label>
                <input value={form.seller_phone} onChange={(e) => updateField("seller_phone", e.target.value)} placeholder="(11) 99999-0000" className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">E-mail</label>
                <input type="email" value={form.seller_email} onChange={(e) => updateField("seller_email", e.target.value)} placeholder="vendedor@revenda.com" className={inputClass} />
              </div>
            </div>
          </div>

          {/* Plano e Status */}
          <div className="space-y-3 pt-3 border-t border-border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plano & Status</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Plano *</label>
                <select value={form.plan_id} onChange={(e) => updateField("plan_id", e.target.value)} className={inputClass}>
                  <option value="">Selecione...</option>
                  {plans.filter((p) => p.is_active).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Status</label>
                <select value={form.status} onChange={(e) => updateField("status", e.target.value)} className={inputClass}>
                  <option value="trial">Trial</option>
                  <option value="ativa">Ativa</option>
                  <option value="suspensa">Suspensa</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
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
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">CNPJ</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Plano</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Vendedor</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Início</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLicenses.map((license) => {
                const l = license as any;
                const status = statusConfig[license.status] || statusConfig.cancelada;
                const StatusIcon = status.icon;
                return (
                  <tr key={license.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-3">
                      <div>
                        <p className="text-foreground font-medium">{l.client_name || "—"}</p>
                        {l.client_trade_name && <p className="text-xs text-muted-foreground">{l.client_trade_name}</p>}
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{l.client_cnpj || "—"}</td>
                    <td className="px-5 py-3 text-foreground">{getPlanName(license.plan_id)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${status.classes}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{l.seller_name || "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDate(license.started_at)}</td>
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
            {licenses.length === 0 ? "Nenhuma licença criada. Clique em \"Nova Licença\" para cadastrar um cliente." : "Nenhuma licença encontrada com os filtros aplicados."}
          </div>
        )}
      </div>
    </div>
  );
}

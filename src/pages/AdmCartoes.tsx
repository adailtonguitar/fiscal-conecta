import { useState, useEffect } from "react";
import { CreditCard, Plus, Pencil, Trash2, Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CardAdmin {
  id: string;
  name: string;
  cnpj: string | null;
  debit_rate: number;
  credit_rate: number;
  credit_installment_rate: number;
  debit_settlement_days: number;
  credit_settlement_days: number;
  antecipation_rate: number | null;
  contact_phone: string | null;
  contact_email: string | null;
  notes: string | null;
  is_active: boolean;
}

const emptyForm = {
  name: "",
  cnpj: "",
  debit_rate: 0,
  credit_rate: 0,
  credit_installment_rate: 0,
  debit_settlement_days: 1,
  credit_settlement_days: 30,
  antecipation_rate: 0,
  contact_phone: "",
  contact_email: "",
  notes: "",
  is_active: true,
};

export default function AdmCartoes() {
  const { companyId } = useCompany();
  const { canEdit, canDelete } = usePermissions();
  const [items, setItems] = useState<CardAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CardAdmin | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!companyId) return;
    setLoading(true);
    const { data } = await (supabase.from("card_administrators") as any)
      .select("*")
      .eq("company_id", companyId)
      .order("name");
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [companyId]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (item: CardAdmin) => {
    setEditing(item);
    setForm({
      name: item.name,
      cnpj: item.cnpj || "",
      debit_rate: item.debit_rate,
      credit_rate: item.credit_rate,
      credit_installment_rate: item.credit_installment_rate,
      debit_settlement_days: item.debit_settlement_days,
      credit_settlement_days: item.credit_settlement_days,
      antecipation_rate: item.antecipation_rate || 0,
      contact_phone: item.contact_phone || "",
      contact_email: item.contact_email || "",
      notes: item.notes || "",
      is_active: item.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!companyId || !form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        company_id: companyId,
        name: form.name.trim(),
        cnpj: form.cnpj || null,
        debit_rate: form.debit_rate,
        credit_rate: form.credit_rate,
        credit_installment_rate: form.credit_installment_rate,
        debit_settlement_days: form.debit_settlement_days,
        credit_settlement_days: form.credit_settlement_days,
        antecipation_rate: form.antecipation_rate || null,
        contact_phone: form.contact_phone || null,
        contact_email: form.contact_email || null,
        notes: form.notes || null,
        is_active: form.is_active,
      };

      if (editing) {
        const { error } = await (supabase.from("card_administrators") as any)
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Administradora atualizada!");
      } else {
        const { error } = await (supabase.from("card_administrators") as any)
          .insert(payload);
        if (error) throw error;
        toast.success("Administradora cadastrada!");
      }
      setDialogOpen(false);
      load();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: CardAdmin) => {
    if (!confirm(`Excluir "${item.name}"?`)) return;
    const { error } = await (supabase.from("card_administrators") as any)
      .delete()
      .eq("id", item.id);
    if (error) {
      toast.error("Erro ao excluir");
    } else {
      toast.success("Excluído!");
      load();
    }
  };

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" />
            ADM de Cartões
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cadastre operadoras de cartão com taxas e prazos de recebimento
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" />
          Nova Operadora
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar operadora..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {items.length === 0 ? "Nenhuma operadora cadastrada" : "Nenhum resultado encontrado"}
        </div>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence>
            {filtered.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-card rounded-xl border border-border p-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground truncate">{item.name}</span>
                    {!item.is_active && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Inativo</span>
                    )}
                  </div>
                  {item.cnpj && (
                    <p className="text-xs text-muted-foreground mt-0.5">CNPJ: {item.cnpj}</p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                    <span>Débito: <strong className="text-foreground">{item.debit_rate}%</strong> ({item.debit_settlement_days}d)</span>
                    <span>Crédito: <strong className="text-foreground">{item.credit_rate}%</strong> ({item.credit_settlement_days}d)</span>
                    <span>Parcelado: <strong className="text-foreground">{item.credit_installment_rate}%</strong></span>
                    {item.antecipation_rate ? (
                      <span>Antecipação: <strong className="text-foreground">{item.antecipation_rate}%</strong></span>
                    ) : null}
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  {canEdit && (
                    <button onClick={() => openEdit(item)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={() => handleDelete(item)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Operadora" : "Nova Operadora"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Cielo, Stone, Rede"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">CNPJ</label>
              <input type="text" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0000-00"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>

            <div className="border-t border-border pt-3">
              <p className="text-xs font-semibold text-foreground mb-3">Taxas (%)</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Débito</label>
                  <input type="number" step="0.01" min="0" max="100" value={form.debit_rate} onChange={(e) => setForm({ ...form, debit_rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm font-mono text-right focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Crédito</label>
                  <input type="number" step="0.01" min="0" max="100" value={form.credit_rate} onChange={(e) => setForm({ ...form, credit_rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm font-mono text-right focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Parcelado</label>
                  <input type="number" step="0.01" min="0" max="100" value={form.credit_installment_rate} onChange={(e) => setForm({ ...form, credit_installment_rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm font-mono text-right focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <p className="text-xs font-semibold text-foreground mb-3">Prazos de Recebimento (dias)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Débito</label>
                  <input type="number" min="0" value={form.debit_settlement_days} onChange={(e) => setForm({ ...form, debit_settlement_days: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm font-mono text-right focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Crédito</label>
                  <input type="number" min="0" value={form.credit_settlement_days} onChange={(e) => setForm({ ...form, credit_settlement_days: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm font-mono text-right focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Taxa de Antecipação (%)</label>
              <input type="number" step="0.01" min="0" max="100" value={form.antecipation_rate} onChange={(e) => setForm({ ...form, antecipation_rate: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm font-mono text-right focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Telefone</label>
                <input type="text" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">E-mail</label>
                <input type="text" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Observações</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20" />
              <span className="text-sm text-foreground">Ativa</span>
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setDialogOpen(false)} className="px-4 py-2 rounded-xl bg-muted text-muted-foreground text-sm font-medium hover:opacity-90 transition-all">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editing ? "Salvar" : "Cadastrar"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

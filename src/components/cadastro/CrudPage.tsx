import { useState } from "react";
import { Search, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCnpjLookup } from "@/hooks/useCnpjLookup";
import { CurrencyInput } from "@/components/ui/currency-input";

export interface FieldConfig {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "email" | "tel" | "select" | "textarea" | "currency";
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  showInTable?: boolean;
  colSpan?: number; // 1 or 2
  cnpjLookup?: boolean; // enables CNPJ lookup button
}

/** Maps CNPJ result keys to form field keys. Override via cnpjFieldMap prop. */
const DEFAULT_CNPJ_MAP: Record<string, string> = {
  name: "name",
  trade_name: "trade_name",
  email: "email",
  phone: "phone",
  address_street: "address_street",
  address_number: "address_number",
  address_complement: "address_complement",
  address_neighborhood: "address_neighborhood",
  address_city: "address_city",
  address_state: "address_state",
  address_zip: "address_zip",
  address_ibge_code: "address_ibge_code",
  contact_name: "contact_name",
};

interface CrudPageProps<T extends { id: string }> {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  data: T[];
  isLoading: boolean;
  fields: FieldConfig[];
  onCreate: (item: Record<string, any>) => Promise<any>;
  onUpdate: (item: Record<string, any> & { id: string }) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  searchKeys?: (keyof T)[];
  nameKey?: keyof T;
  cnpjFieldMap?: Record<string, string>;
  /** Optional validation before save. Return error message or null. */
  onValidate?: (data: Record<string, any>) => string | null;
  /** Dynamic field config based on current form data */
  getFields?: (formData: Record<string, any>) => FieldConfig[];
  /** Extra action buttons rendered in the header */
  headerActions?: React.ReactNode;
}

export function CrudPage<T extends { id: string }>({
  title, subtitle, icon, data, isLoading, fields, onCreate, onUpdate, onDelete, searchKeys = ["name" as keyof T], nameKey = "name" as keyof T, cnpjFieldMap, onValidate, getFields, headerActions,
}: CrudPageProps<T>) {
  const { lookup: cnpjLookup, loading: cnpjLoading } = useCnpjLookup();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const activeFields = getFields ? getFields(formData) : fields;
  const tableFields = fields.filter((f) => f.showInTable !== false);

  const filtered = data.filter((item) =>
    searchKeys.some((key) => {
      const val = (item as any)[key];
      return val && String(val).toLowerCase().includes(search.toLowerCase());
    })
  );

  const openCreate = () => {
    setEditing(null);
    const defaults: Record<string, any> = {};
    fields.forEach((f) => {
      if (f.type === "select" && f.options?.length) {
        defaults[f.key] = f.options[0].value;
      } else if (f.type === "currency" || f.type === "number") {
        defaults[f.key] = 0;
      } else {
        defaults[f.key] = "";
      }
    });
    setFormData(defaults);
    setShowForm(true);
  };

  const openEdit = (item: T) => {
    setEditing(item);
    const values: Record<string, any> = {};
    fields.forEach((f) => { values[f.key] = (item as any)[f.key] ?? ""; });
    setFormData(values);
    setShowForm(true);
  };

  const handleCnpjSearch = async (cnpjFieldKey: string) => {
    const cnpjValue = formData[cnpjFieldKey];
    if (!cnpjValue) return;
    const result = await cnpjLookup(cnpjValue);
    if (!result) return;
    const map = cnpjFieldMap || DEFAULT_CNPJ_MAP;
    const updated = { ...formData };
    for (const [resultKey, formKey] of Object.entries(map)) {
      if ((result as any)[resultKey] && fields.some((f) => f.key === formKey)) {
        updated[formKey] = (result as any)[resultKey];
      }
    }
    setFormData(updated);
  };

  const handleSave = async () => {
    // Validate required fields
    const currentFields = getFields ? getFields(formData) : fields;
    const missing = currentFields.filter(
      (f) => f.required && (formData[f.key] === "" || formData[f.key] === null || formData[f.key] === undefined)
    );
    if (missing.length > 0) {
      const { toast: toastFn } = await import("sonner");
      toastFn.error(`Preencha os campos obrigatórios: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }

    if (onValidate) {
      const err = onValidate(formData);
      if (err) {
        const { toast: toastFn } = await import("sonner");
        toastFn.error(err);
        return;
      }
    }
    setSaving(true);
    try {
      if (editing) {
        await onUpdate({ ...formData, id: editing.id });
      } else {
        await onCreate(formData);
      }
      setShowForm(false);
    } catch {
      // error handled by hook
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto min-w-0 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{title}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {subtitle ?? `${data.length} registros cadastrados`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {headerActions}
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Novo
          </Button>
        </div>
      </div>

      <div className="relative max-w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {isLoading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            {data.length === 0 ? 'Nenhum registro cadastrado.' : 'Nenhum resultado encontrado.'}
          </div>
        ) : (
          filtered.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card rounded-xl border border-border p-3 space-y-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {tableFields.map((f, idx) => (
                    <div key={f.key} className={idx === 0 ? "text-sm font-medium text-foreground truncate" : "text-xs text-muted-foreground truncate"}>
                      {idx === 0 ? (
                        (item as any)[f.key] || "—"
                      ) : (
                        <>
                          <span className="text-muted-foreground/70">{f.label}: </span>
                          {(item as any)[f.key] || "—"}
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button onClick={() => openEdit(item)} title="Editar" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(item)} title="Excluir" className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl card-shadow border border-border overflow-hidden hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="border-b border-border">
                {tableFields.map((f) => (
                  <th key={f.key} className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    {f.label}
                  </th>
                ))}
                <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-5 py-3" colSpan={tableFields.length + 1}><Skeleton className="h-8 w-full" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={tableFields.length + 1} className="px-5 py-12 text-center text-muted-foreground">
                    {data.length === 0 ? 'Nenhum registro cadastrado.' : 'Nenhum resultado encontrado.'}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    {tableFields.map((f) => (
                      <td key={f.key} className="px-5 py-3 text-foreground max-w-[200px] truncate">
                        {(item as any)[f.key] || "—"}
                      </td>
                    ))}
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(item)} title="Editar" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(item)} title="Excluir" className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar" : "Novo"} {title.replace(/s$/, "")}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {activeFields.map((f) => (
               <div key={f.key} className={f.colSpan === 2 ? "md:col-span-2" : ""}>
                <Label className="text-xs">{f.label}{f.required && " *"}</Label>
                {f.type === "select" && f.options ? (
                  <select
                    value={formData[f.key] || ""}
                    onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Selecione...</option>
                    {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : f.cnpjLookup ? (
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder={f.placeholder || "00.000.000/0000-00"}
                      value={formData[f.key] || ""}
                      onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      disabled={cnpjLoading || !formData[f.key]}
                      onClick={() => handleCnpjSearch(f.key)}
                      title="Buscar dados do CNPJ"
                    >
                      {cnpjLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </Button>
                  </div>
                 ) : f.type === "textarea" ? (
                   <Textarea
                     placeholder={f.placeholder}
                     value={formData[f.key] || ""}
                     onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                     rows={3}
                   />
                 ) : f.type === "currency" ? (
                   <CurrencyInput
                     value={formData[f.key] || 0}
                     onChange={(val) => setFormData({ ...formData, [f.key]: val })}
                     placeholder={f.placeholder}
                   />
                 ) : (
                   <Input
                     type={f.type || "text"}
                     placeholder={f.placeholder}
                     value={formData[f.key] || ""}
                     onChange={(e) => setFormData({ ...formData, [f.key]: f.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value })}
                   />
                 )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteTarget ? String((deleteTarget as any)[nameKey] || deleteTarget.id) : ""}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteTarget) onDelete(deleteTarget.id); setDeleteTarget(null); }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

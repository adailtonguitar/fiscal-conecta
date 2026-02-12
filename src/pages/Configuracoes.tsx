import { useState, useEffect } from "react";
import { Download, Clock, HardDrive, Percent, Save, Loader2 } from "lucide-react";
import { TEFConfigSection } from "@/components/settings/TEFConfigSection";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  gerente: "Gerente",
  supervisor: "Supervisor",
  caixa: "Caixa",
};

function DiscountLimitsSection() {
  const { role } = usePermissions();
  const [limits, setLimits] = useState<{ id: string; role: string; max_discount_percent: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [edited, setEdited] = useState<Record<string, number>>({});

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("discount_limits").select("id, role, max_discount_percent").order("max_discount_percent", { ascending: false });
      if (data) setLimits(data);
      setLoading(false);
    };
    load();
  }, []);

  const handleChange = (id: string, value: number) => {
    setEdited((prev) => ({ ...prev, [id]: Math.min(100, Math.max(0, value)) }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [id, val] of Object.entries(edited)) {
        const { error } = await supabase.from("discount_limits").update({ max_discount_percent: val }).eq("id", id);
        if (error) throw error;
      }
      setLimits((prev) => prev.map((l) => edited[l.id] !== undefined ? { ...l, max_discount_percent: edited[l.id] } : l));
      setEdited({});
      toast.success("Limites de desconto salvos!");
    } catch {
      toast.error("Erro ao salvar limites");
    } finally {
      setSaving(false);
    }
  };

  if (role !== "admin") return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl card-shadow border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <Percent className="w-4 h-4 text-primary" />
        <h2 className="text-base font-semibold text-foreground">Limites de Desconto por Cargo</h2>
      </div>
      <div className="p-5 space-y-4">
        <p className="text-sm text-muted-foreground">Defina o percentual máximo de desconto que cada cargo pode aplicar no PDV (por item ou no total).</p>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {limits.map((limit) => {
              const val = edited[limit.id] ?? limit.max_discount_percent;
              return (
                <div key={limit.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 border border-border">
                  <span className="text-sm font-medium text-foreground">{roleLabels[limit.role] || limit.role}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={val}
                      onChange={(e) => handleChange(limit.id, Number(e.target.value))}
                      className="w-20 px-2 py-1.5 rounded-lg bg-card border border-border text-sm font-mono text-right focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {Object.keys(edited).length > 0 && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar Alterações
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function Configuracoes() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Faça login para exportar"); return; }
      const response = await supabase.functions.invoke("export-company-data", { body: {} });
      if (response.error) { toast.error("Erro ao exportar: " + response.error.message); return; }
      const result = response.data;
      if (result.success) {
        toast.success(`Backup criado! ${Object.values(result.records as Record<string, number>).reduce((a: number, b: number) => a + b, 0)} registros exportados.`);
      } else { toast.error(result.error || "Erro ao exportar"); }
    } catch { toast.error("Erro ao exportar dados"); } finally { setExporting(false); }
  };

  const handleDownloadExport = async () => {
    setExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Faça login para exportar"); return; }
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-company-data?download=true`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      });
      if (!res.ok) { toast.error("Erro ao baixar backup"); return; }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("Backup baixado!");
    } catch { toast.error("Erro ao baixar backup"); } finally { setExporting(false); }
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">Configurações gerais do sistema</p>
      </div>

      {/* Discount Limits */}
      <DiscountLimitsSection />

      {/* TEF Config */}
      <TEFConfigSection />

      {/* Backup / Export */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl card-shadow border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Backup & Exportação</h2>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-muted-foreground">Exporte todos os dados da empresa em formato JSON.</p>
          <div className="flex gap-3 flex-wrap">
            <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50">
              <Clock className={`w-4 h-4 ${exporting ? "animate-spin" : ""}`} />
              {exporting ? "Exportando..." : "Salvar Backup no Cloud"}
            </button>
            <button onClick={handleDownloadExport} disabled={exporting} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50">
              <Download className="w-4 h-4" />
              Baixar Backup (JSON)
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

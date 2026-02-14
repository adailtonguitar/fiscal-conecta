import { useState, useEffect } from "react";
import { Download, Clock, HardDrive, Percent, Save, Loader2, Crown, Check, ArrowRight } from "lucide-react";
import { TEFConfigSection } from "@/components/settings/TEFConfigSection";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";
import { useSubscription, PLANS } from "@/hooks/useSubscription";

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

const planFeatures: Record<string, string[]> = {
  essencial: ["1 terminal PDV", "Até 500 produtos", "NFC-e ilimitada", "Controle de estoque", "Financeiro básico", "Relatórios de vendas", "Suporte por e-mail"],
  profissional: ["Até 5 terminais PDV", "Produtos ilimitados", "NF-e + NFC-e", "Relatórios avançados com IA", "Programa de fidelidade", "Multi-usuários e permissões", "Orçamentos e cotações", "Curva ABC e painel de lucro", "Suporte prioritário"],
};

function MyPlanSection() {
  const { subscribed, planKey, trialActive, trialDaysLeft, subscriptionEnd, createCheckout, openCustomerPortal, loading } = useSubscription();
  const [upgrading, setUpgrading] = useState(false);

  if (loading) return null;

  const currentPlan = planKey && PLANS[planKey as keyof typeof PLANS] ? PLANS[planKey as keyof typeof PLANS] : null;
  const isEssencial = planKey === "essencial";
  const features = planKey ? planFeatures[planKey] || [] : [];

  const handleUpgrade = async () => {
    try {
      setUpgrading(true);
      await createCheckout("profissional");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao iniciar checkout");
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl card-shadow border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <Crown className="w-4 h-4 text-primary" />
        <h2 className="text-base font-semibold text-foreground">Meu Plano</h2>
      </div>
      <div className="p-5 space-y-4">
        {subscribed && currentPlan ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-lg font-bold text-foreground">{currentPlan.name}</span>
                <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">Ativo</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-foreground">R$ {currentPlan.price.toFixed(2).replace(".", ",")}</span>
                <span className="text-sm text-muted-foreground">/mês</span>
              </div>
            </div>
            {subscriptionEnd && (
              <p className="text-xs text-muted-foreground">Próxima renovação: {new Date(subscriptionEnd).toLocaleDateString("pt-BR")}</p>
            )}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="flex gap-3 flex-wrap pt-2">
              {isEssencial && (
                <button
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
                >
                  <ArrowRight className="w-4 h-4" />
                  {upgrading ? "Redirecionando..." : "Fazer upgrade para Profissional"}
                </button>
              )}
              <button
                onClick={() => window.open("/trial-expirado", "_self")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:opacity-90 transition-all"
              >
                Ver planos
              </button>
            </div>
          </>
        ) : trialActive ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-lg font-bold text-foreground">Período de Teste</span>
                <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-warning/10 text-warning">{trialDaysLeft} dia{trialDaysLeft !== 1 ? "s" : ""} restante{trialDaysLeft !== 1 ? "s" : ""}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Assine um plano para continuar usando o sistema após o período de teste.</p>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => createCheckout("essencial").catch(() => toast.error("Erro ao iniciar checkout"))}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:opacity-90 transition-all"
              >
                Essencial — R$ 149,90/mês
              </button>
              <button
                onClick={() => createCheckout("profissional").catch(() => toast.error("Erro ao iniciar checkout"))}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all"
              >
                Profissional — R$ 199,90/mês
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Você não possui uma assinatura ativa.</p>
            <button
              onClick={() => createCheckout("profissional").catch(() => toast.error("Erro ao iniciar checkout"))}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all"
            >
              Assinar agora
            </button>
          </>
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

      {/* My Plan */}
      <MyPlanSection />

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

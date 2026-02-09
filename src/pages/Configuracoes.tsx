import { useState, useEffect } from "react";
import { Store, Palette, Save, Globe, FileText, Download, Clock, HardDrive, Search, Loader2 } from "lucide-react";
import { useCnpjLookup } from "@/hooks/useCnpjLookup";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCompany } from "@/hooks/useCompany";
import { useAuth } from "@/hooks/useAuth";

export default function Configuracoes() {
  const { user } = useAuth();
  const { companyId, loading: companyLoading } = useCompany();
  const { lookup: cnpjLookup, loading: cnpjLoading } = useCnpjLookup();
  const [companyData, setCompanyData] = useState({
    name: "",
    trade_name: "",
    cnpj: "",
    ie: "",
    im: "",
    email: "",
    phone: "",
    tax_regime: "simples_nacional",
    address_street: "",
    address_number: "",
    address_complement: "",
    address_neighborhood: "",
    address_city: "",
    address_state: "SP",
    address_zip: "",
    address_ibge_code: "",
  });
  const [primaryColor, setPrimaryColor] = useState("#1a9e7a");
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!companyId) {
      setLoadingData(false);
      return;
    }
    const fetch = async () => {
      const { data } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .single();
      if (data) {
        setCompanyData({
          name: data.name || "",
          trade_name: data.trade_name || "",
          cnpj: data.cnpj || "",
          ie: data.ie || "",
          im: data.im || "",
          email: data.email || "",
          phone: data.phone || "",
          tax_regime: data.tax_regime || "simples_nacional",
          address_street: data.address_street || "",
          address_number: data.address_number || "",
          address_complement: data.address_complement || "",
          address_neighborhood: data.address_neighborhood || "",
          address_city: data.address_city || "",
          address_state: data.address_state || "SP",
          address_zip: data.address_zip || "",
          address_ibge_code: data.address_ibge_code || "",
        });
      }
      setLoadingData(false);
    };
    fetch();
  }, [companyId]);

  const handleSave = async () => {
    if (!companyData.name || !companyData.cnpj) {
      toast.error("Razão Social e CNPJ são obrigatórios");
      return;
    }
    setSaving(true);
    try {
      if (companyId) {
        // Update existing company
        const { error } = await supabase
          .from("companies")
          .update(companyData)
          .eq("id", companyId);
        if (error) throw error;
        toast.success("Dados da empresa salvos com sucesso!");
      } else {
        // Create new company (trigger auto_assign_company_admin handles company_users link)
        const { error: createError } = await supabase
          .from("companies")
          .insert(companyData);
        if (createError) throw createError;

        toast.success("Empresa criada com sucesso!");
        window.location.reload();
      }
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setCompanyData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCnpjSearch = async () => {
    const result = await cnpjLookup(companyData.cnpj);
    if (!result) return;
    setCompanyData((prev) => ({
      ...prev,
      name: result.name || prev.name,
      trade_name: result.trade_name || prev.trade_name,
      email: result.email || prev.email,
      phone: result.phone || prev.phone,
      address_street: result.address_street || prev.address_street,
      address_number: result.address_number || prev.address_number,
      address_complement: result.address_complement || prev.address_complement,
      address_neighborhood: result.address_neighborhood || prev.address_neighborhood,
      address_city: result.address_city || prev.address_city,
      address_state: result.address_state || prev.address_state,
      address_zip: result.address_zip || prev.address_zip,
      address_ibge_code: result.address_ibge_code || prev.address_ibge_code,
    }));
  };

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

  if (companyLoading || loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const inputClass = "w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dados da Empresa</h1>
        <p className="text-sm text-muted-foreground mt-1">Informações da empresa que utiliza o sistema PDV</p>
      </div>

      {/* Dados Gerais */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl card-shadow border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Store className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Dados Gerais</h2>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-foreground mb-1.5 block">Razão Social *</label>
            <input type="text" value={companyData.name} onChange={(e) => updateField("name", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Nome Fantasia</label>
            <input type="text" value={companyData.trade_name} onChange={(e) => updateField("trade_name", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">E-mail</label>
            <input type="email" value={companyData.email} onChange={(e) => updateField("email", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Telefone</label>
            <input type="text" value={companyData.phone} onChange={(e) => updateField("phone", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Regime Tributário</label>
            <select value={companyData.tax_regime} onChange={(e) => updateField("tax_regime", e.target.value)} className={inputClass}>
              <option value="simples_nacional">Simples Nacional</option>
              <option value="lucro_presumido">Lucro Presumido</option>
              <option value="lucro_real">Lucro Real</option>
              <option value="mei">MEI</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Dados Fiscais */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl card-shadow border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Dados Fiscais</h2>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">CNPJ *</label>
            <div className="flex gap-2">
              <input type="text" value={companyData.cnpj} onChange={(e) => updateField("cnpj", e.target.value)} className={inputClass} />
              <button
                type="button"
                onClick={handleCnpjSearch}
                disabled={cnpjLoading || !companyData.cnpj}
                title="Buscar dados do CNPJ"
                className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground hover:border-primary transition-all disabled:opacity-50"
              >
                {cnpjLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Inscrição Estadual</label>
            <input type="text" value={companyData.ie} onChange={(e) => updateField("ie", e.target.value)} placeholder="Isento" className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Inscrição Municipal</label>
            <input type="text" value={companyData.im} onChange={(e) => updateField("im", e.target.value)} className={inputClass} />
          </div>
        </div>
      </motion.div>

      {/* Endereço */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card rounded-xl card-shadow border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Endereço</h2>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">CEP</label>
            <input type="text" value={companyData.address_zip} onChange={(e) => updateField("address_zip", e.target.value)} className={inputClass} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-foreground mb-1.5 block">Logradouro</label>
            <input type="text" value={companyData.address_street} onChange={(e) => updateField("address_street", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Número</label>
            <input type="text" value={companyData.address_number} onChange={(e) => updateField("address_number", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Complemento</label>
            <input type="text" value={companyData.address_complement} onChange={(e) => updateField("address_complement", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Bairro</label>
            <input type="text" value={companyData.address_neighborhood} onChange={(e) => updateField("address_neighborhood", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Cidade</label>
            <input type="text" value={companyData.address_city} onChange={(e) => updateField("address_city", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Estado</label>
            <select value={companyData.address_state} onChange={(e) => updateField("address_state", e.target.value)} className={inputClass}>
              {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map((uf) => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Código IBGE</label>
            <input type="text" value={companyData.address_ibge_code} onChange={(e) => updateField("address_ibge_code", e.target.value)} className={inputClass} />
          </div>
        </div>
      </motion.div>

      {/* White Label */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-xl card-shadow border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">White Label</h2>
        </div>
        <div className="p-5">
          <label className="text-sm font-medium text-foreground mb-1.5 block">Cor Principal</label>
          <div className="flex items-center gap-3">
            <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
            <span className="text-sm font-mono text-muted-foreground">{primaryColor}</span>
          </div>
        </div>
      </motion.div>

      {/* Backup / Export */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-card rounded-xl card-shadow border border-border overflow-hidden">
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

      {/* Save */}
      <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50">
        <Save className="w-4 h-4" />
        {saving ? "Salvando..." : "Salvar Dados da Empresa"}
      </button>
    </div>
  );
}

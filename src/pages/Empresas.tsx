import { useState, useEffect, useRef } from "react";
import { Store, Save, Globe, FileText, Download, Clock, HardDrive, Search, Loader2, Upload, X, Plus, ArrowLeft, Building2, Pencil, QrCode } from "lucide-react";
import { useCnpjLookup } from "@/hooks/useCnpjLookup";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCompany } from "@/hooks/useCompany";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

interface CompanyRow {
  id: string;
  name: string;
  trade_name: string | null;
  cnpj: string;
  email: string | null;
  phone: string | null;
  address_city: string | null;
  address_state: string | null;
  logo_url: string | null;
  tax_regime: string | null;
  ie: string | null;
  im: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_zip: string | null;
  address_ibge_code: string | null;
}

const emptyCompanyData = {
  name: "",
  trade_name: "",
  cnpj: "",
  ie: "",
  im: "",
  email: "",
  phone: "",
  tax_regime: "simples_nacional",
  slogan: "",
  address_street: "",
  address_number: "",
  address_complement: "",
  address_neighborhood: "",
  address_city: "",
  address_state: "SP",
  address_zip: "",
  address_ibge_code: "",
  pix_key_type: "",
  pix_key: "",
  pix_city: "",
};

export default function Configuracoes() {
  const { user } = useAuth();
  const { companyId, logoUrl: currentLogoUrl, loading: companyLoading } = useCompany();
  const { lookup: cnpjLookup, loading: cnpjLoading } = useCnpjLookup();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [view, setView] = useState<"list" | "form">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [companyData, setCompanyData] = useState({ ...emptyCompanyData });

  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch company list
  const fetchCompanies = async () => {
    setLoadingList(true);
    const { data } = await supabase
      .from("companies")
      .select("id, name, trade_name, cnpj, email, phone, address_city, address_state, logo_url, tax_regime, ie, im, address_street, address_number, address_complement, address_neighborhood, address_zip, address_ibge_code, slogan, pix_key_type, pix_key, pix_city")
      .order("name");
    setCompanies(data || []);
    setLoadingList(false);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleNewCompany = () => {
    setEditingId(null);
    setCompanyData({ ...emptyCompanyData });
    setLogoPreview(null);
    setLogoFile(null);
    setView("form");
  };

  const handleEditCompany = (company: CompanyRow) => {
    setEditingId(company.id);
    setCompanyData({
      name: company.name || "",
      trade_name: company.trade_name || "",
      cnpj: company.cnpj || "",
      ie: company.ie || "",
      im: company.im || "",
      email: company.email || "",
      phone: company.phone || "",
      tax_regime: company.tax_regime || "simples_nacional",
      slogan: (company as any).slogan || "",
      address_street: company.address_street || "",
      address_number: company.address_number || "",
      address_complement: company.address_complement || "",
      address_neighborhood: company.address_neighborhood || "",
      address_city: company.address_city || "",
      address_state: company.address_state || "SP",
      address_zip: company.address_zip || "",
      address_ibge_code: company.address_ibge_code || "",
      pix_key_type: (company as any).pix_key_type || "",
      pix_key: (company as any).pix_key || "",
      pix_city: (company as any).pix_city || "",
    });
    setLogoPreview(company.logo_url || null);
    setLogoFile(null);
    setView("form");
  };

  const handleBackToList = () => {
    setView("list");
    setEditingId(null);
    fetchCompanies();
  };

  // Logo handlers
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Selecione um arquivo de imagem"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Imagem deve ter no máximo 2MB"); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleLogoRemove = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadLogo = async (targetCompanyId: string): Promise<string | null> => {
    if (!logoFile) return logoPreview;
    const ext = logoFile.name.split(".").pop();
    const path = `${targetCompanyId}/logo.${ext}`;
    const { error } = await supabase.storage.from("company-logos").upload(path, logoFile, { upsert: true });
    if (error) throw new Error("Erro ao enviar logo: " + error.message);
    const { data: urlData } = supabase.storage.from("company-logos").getPublicUrl(path);
    return urlData.publicUrl + "?t=" + Date.now();
  };

  /** Sync logo to Nuvem Fiscal so it appears on DANFE (NFC-e / NF-e) */
  const syncLogoToNuvemFiscal = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sessão expirada. Faça login novamente.");
        return;
      }
      toast.info("Sincronizando logotipo com o sistema fiscal...");
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nuvem-fiscal?action=upload-logo`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({}),
        }
      );
      const result = await response.json();
      if (response.ok) {
        toast.success("Logotipo sincronizado com o sistema fiscal (aparecerá nos DANFEs)");
      } else {
        console.error("Erro ao sincronizar logo fiscal:", result);
        toast.error(result?.error || "Erro ao sincronizar logotipo com fiscal");
      }
    } catch (err) {
      console.error("Erro ao sincronizar logo fiscal:", err);
      toast.error("Erro de conexão ao sincronizar logotipo com fiscal");
    }
  };

  const handleSave = async () => {
    if (!companyData.name || !companyData.cnpj) {
      toast.error("Razão Social e CNPJ são obrigatórios");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        let logoUrl: string | null | undefined;
        if (logoFile) {
          logoUrl = await uploadLogo(editingId);
        } else if (logoPreview === null) {
          logoUrl = null;
        }
        const updateData: Record<string, any> = { ...companyData };
        if (logoUrl !== undefined) updateData.logo_url = logoUrl;

        const { error } = await supabase.from("companies").update(updateData).eq("id", editingId);
        if (error) throw error;
        toast.success("Empresa atualizada com sucesso!");
        // Sync logo to fiscal system (non-blocking)
        if (logoFile) syncLogoToNuvemFiscal();
      } else {
        const { data: created, error: createError } = await supabase
          .from("companies")
          .insert(companyData as any)
          .select("id")
          .single();
        if (createError) throw createError;
        if (logoFile && created) {
          const logoUrl = await uploadLogo(created.id);
          if (logoUrl) {
            await supabase.from("companies").update({ logo_url: logoUrl }).eq("id", created.id);
          }
        }
        toast.success("Empresa criada com sucesso!");
        // Sync logo to fiscal system (non-blocking)
        if (logoFile) syncLogoToNuvemFiscal();
      }
      handleBackToList();
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

  if (companyLoading || loadingList) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const inputClass = "w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

  // ───── LIST VIEW ─────
  if (view === "list") {
    return (
      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Empresas</h1>
            <p className="text-sm text-muted-foreground mt-1">Gerencie as empresas cadastradas no sistema</p>
          </div>
          <Button onClick={handleNewCompany} className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Empresa
          </Button>
        </div>

        {companies.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl card-shadow border border-border p-12 flex flex-col items-center gap-4">
            <Building2 className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">Nenhuma empresa cadastrada</p>
            <Button onClick={handleNewCompany} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Cadastrar primeira empresa
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {companies.map((company, i) => (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleEditCompany(company)}
                className="bg-card rounded-xl card-shadow border border-border p-4 flex items-center gap-4 cursor-pointer hover:border-primary/40 transition-all group"
              >
                {company.logo_url ? (
                  <img src={company.logo_url} alt="" className="w-12 h-12 rounded-lg object-contain border border-border bg-background shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg border border-border bg-muted/50 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">{company.trade_name || company.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{company.cnpj}</p>
                  {company.address_city && (
                    <p className="text-xs text-muted-foreground truncate">{company.address_city} - {company.address_state}</p>
                  )}
                </div>
                <Pencil className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </motion.div>
            ))}
          </div>
        )}

        {/* Backup / Export */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-xl card-shadow border border-border overflow-hidden">
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

  // ───── FORM VIEW ─────
  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={handleBackToList} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{editingId ? "Editar Empresa" : "Nova Empresa"}</h1>
          <p className="text-sm text-muted-foreground mt-1">Preencha os dados da empresa</p>
        </div>
      </div>

      {/* Dados Gerais */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl card-shadow border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Store className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Dados Gerais</h2>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Logo Upload */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-foreground mb-1.5 block">Logo da Empresa</label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <div className="relative">
                  <img src={logoPreview} alt="Logo" className="w-20 h-20 rounded-xl object-contain border border-border bg-background" />
                  <button type="button" onClick={handleLogoRemove} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:opacity-90 transition-all">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div onClick={() => fileInputRef.current?.click()} className="w-20 h-20 rounded-xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground mt-1">Upload</span>
                </div>
              )}
              <div className="flex-1 space-y-2">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm text-primary hover:underline">
                  {logoPreview ? "Trocar imagem" : "Selecionar imagem"}
                </button>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG ou SVG. Máx 2MB.</p>
                {editingId && logoPreview && !logoFile && (
                  <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs" onClick={syncLogoToNuvemFiscal}>
                    <Globe className="w-3.5 h-3.5" />
                    Sincronizar logo com fiscal
                  </Button>
                )}
              </div>
            </div>
          </div>
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
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-foreground mb-1.5 block">Slogan</label>
            <input type="text" value={companyData.slogan} onChange={(e) => updateField("slogan", e.target.value)} placeholder="Ex: A melhor loja da cidade!" className={inputClass} />
            <p className="text-xs text-muted-foreground mt-1">Aparece nos cupons e comprovantes de pagamento</p>
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
              <button type="button" onClick={handleCnpjSearch} disabled={cnpjLoading || !companyData.cnpj} title="Buscar dados do CNPJ" className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground hover:border-primary transition-all disabled:opacity-50">
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

      {/* PIX */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-xl card-shadow border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <QrCode className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">PIX (QR Code Automático)</h2>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Tipo da Chave PIX</label>
            <select value={companyData.pix_key_type} onChange={(e) => updateField("pix_key_type", e.target.value)} className={inputClass}>
              <option value="">Não configurado</option>
              <option value="cpf">CPF</option>
              <option value="cnpj">CNPJ</option>
              <option value="email">E-mail</option>
              <option value="phone">Telefone</option>
              <option value="random">Chave Aleatória (EVP)</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Chave PIX</label>
            <input type="text" value={companyData.pix_key} onChange={(e) => updateField("pix_key", e.target.value)} placeholder="Digite a chave PIX" className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Cidade (para QR Code)</label>
            <input type="text" value={companyData.pix_city} onChange={(e) => updateField("pix_city", e.target.value)} placeholder={companyData.address_city || "Cidade"} className={inputClass} />
            <p className="text-xs text-muted-foreground mt-1">Usada no QR Code PIX. Se vazio, usa a cidade do endereço.</p>
          </div>
        </div>
      </motion.div>

      {/* Save */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={handleBackToList}>Cancelar</Button>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50">
          <Save className="w-4 h-4" />
          {saving ? "Salvando..." : "Salvar Empresa"}
        </button>
      </div>
    </div>
  );
}

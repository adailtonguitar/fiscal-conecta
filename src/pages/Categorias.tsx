import { useState } from "react";
import { Tags, FolderTree, Zap, AlertTriangle, CheckCircle, Info, Shield, Calculator, Plus, Trash2, Edit } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CrudPage, type FieldConfig } from "@/components/cadastro/CrudPage";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProductCategories, useCreateProductCategory, useUpdateProductCategory, useDeleteProductCategory } from "@/hooks/useProductCategories";
import { useFiscalCategories, useCreateFiscalCategory, useUpdateFiscalCategory, useDeleteFiscalCategory } from "@/hooks/useFiscalCategories";
import { useIcmsStRules, useCreateIcmsStRule, useUpdateIcmsStRule, useDeleteIcmsStRule } from "@/hooks/useIcmsStRules";
import { toast } from "sonner";
import {
  validateCstCsosn,
  getSuggestedCodes,
  CSOSN_TABLE,
  CST_ICMS_TABLE,
  type TaxRegime,
} from "@/lib/cst-csosn-validator";
import { calculateIcmsSt, calculateAdjustedMva, BRAZILIAN_UFS } from "@/lib/icms-st-engine";

const categoryFields: FieldConfig[] = [
  { key: "name", label: "Nome", required: true, showInTable: true },
  { key: "description", label: "Descrição", showInTable: true, colSpan: 2 },
];

/** Build fiscal fields dynamically based on selected regime */
function buildFiscalFields(formData: Record<string, any>): FieldConfig[] {
  const regime = (formData.regime || "simples_nacional") as TaxRegime;
  const isSN = regime === "simples_nacional";
  const productType = formData.product_type || "normal";

  // Get suggested codes for the current regime + product type
  const suggested = getSuggestedCodes(regime, productType);

  const csosnField: FieldConfig = {
    key: "csosn",
    label: "CSOSN",
    required: isSN,
    type: "select",
    options: [
      { value: "", label: "Selecione..." },
      ...CSOSN_TABLE.map((c) => ({
        value: c.code,
        label: `${c.code} — ${c.description}`,
      })),
    ],
    placeholder: isSN ? "Obrigatório para Simples Nacional" : "Não utilizar neste regime",
  };

  const cstField: FieldConfig = {
    key: "cst_icms",
    label: "CST ICMS",
    required: !isSN,
    type: "select",
    options: [
      { value: "", label: "Selecione..." },
      ...CST_ICMS_TABLE.map((c) => ({
        value: c.code,
        label: `${c.code} — ${c.description}`,
      })),
    ],
    placeholder: !isSN ? "Obrigatório para este regime" : "Não utilizar no Simples Nacional",
  };

  return [
    { key: "name", label: "Nome", required: true, showInTable: true },
    { key: "regime", label: "Regime", required: true, showInTable: true, type: "select", options: [
      { value: "simples_nacional", label: "Simples Nacional" },
      { value: "lucro_presumido", label: "Lucro Presumido" },
      { value: "lucro_real", label: "Lucro Real" },
    ]},
    { key: "operation_type", label: "Operação", required: true, showInTable: true, type: "select", options: [
      { value: "interna", label: "Interna" },
      { value: "interestadual", label: "Interestadual" },
    ]},
    { key: "product_type", label: "Tipo Produto", required: true, showInTable: true, type: "select", options: [
      { value: "normal", label: "Normal" },
      { value: "st", label: "Substituição Tributária" },
    ]},
    { key: "cfop", label: "CFOP", required: true, showInTable: true },
    { key: "ncm", label: "NCM" },
    { key: "cest", label: "CEST" },
    // Show both fields but mark the correct one as required
    csosnField,
    cstField,
    { key: "icms_rate", label: "Alíq. ICMS %", type: "number" },
    { key: "icms_st_rate", label: "Alíq. ICMS ST %", type: "number" },
    { key: "mva", label: "MVA %", type: "number" },
    { key: "pis_rate", label: "Alíq. PIS %", type: "number" },
    { key: "cofins_rate", label: "Alíq. COFINS %", type: "number" },
    { key: "ipi_rate", label: "Alíq. IPI %", type: "number" },
  ];
}

// Static fields for table display (all columns)
const fiscalTableFields: FieldConfig[] = [
  { key: "name", label: "Nome", required: true, showInTable: true },
  { key: "regime", label: "Regime", required: true, showInTable: true },
  { key: "operation_type", label: "Operação", required: true, showInTable: true },
  { key: "product_type", label: "Tipo Produto", required: true, showInTable: true },
  { key: "cfop", label: "CFOP", required: true, showInTable: true },
  { key: "ncm", label: "NCM" },
  { key: "cest", label: "CEST" },
  { key: "csosn", label: "CSOSN" },
  { key: "cst_icms", label: "CST ICMS" },
  { key: "icms_rate", label: "Alíq. ICMS %", type: "number" },
  { key: "icms_st_rate", label: "Alíq. ICMS ST %", type: "number" },
  { key: "mva", label: "MVA %", type: "number" },
  { key: "pis_rate", label: "Alíq. PIS %", type: "number" },
  { key: "cofins_rate", label: "Alíq. COFINS %", type: "number" },
  { key: "ipi_rate", label: "Alíq. IPI %", type: "number" },
];

interface FiscalTemplate {
  name: string;
  description: string;
  data: Record<string, any>;
}

const FISCAL_TEMPLATES: FiscalTemplate[] = [
  // Simples Nacional
  { name: "SN - Normal Interna", description: "Simples Nacional, mercadoria normal, operação interna (CFOP 5102, CSOSN 102)", data: { name: "SN - Normal Interna", regime: "simples_nacional", operation_type: "interna", product_type: "normal", cfop: "5102", csosn: "102", icms_rate: 0, pis_rate: 1.65, cofins_rate: 7.60 } },
  { name: "SN - Normal Interestadual", description: "Simples Nacional, mercadoria normal, operação interestadual (CFOP 6102, CSOSN 102)", data: { name: "SN - Normal Interestadual", regime: "simples_nacional", operation_type: "interestadual", product_type: "normal", cfop: "6102", csosn: "102", icms_rate: 0, pis_rate: 1.65, cofins_rate: 7.60 } },
  { name: "SN - ST Interna", description: "Simples Nacional, substituição tributária, operação interna (CFOP 5405, CSOSN 500)", data: { name: "SN - ST Interna", regime: "simples_nacional", operation_type: "interna", product_type: "st", cfop: "5405", csosn: "500", icms_rate: 0, pis_rate: 1.65, cofins_rate: 7.60 } },
  { name: "SN - ST Interestadual", description: "Simples Nacional, substituição tributária, operação interestadual (CFOP 6404, CSOSN 500)", data: { name: "SN - ST Interestadual", regime: "simples_nacional", operation_type: "interestadual", product_type: "st", cfop: "6404", csosn: "500", icms_rate: 0, pis_rate: 1.65, cofins_rate: 7.60 } },
  // Lucro Presumido
  { name: "LP - Normal Interna", description: "Lucro Presumido, mercadoria normal, operação interna (CFOP 5102, CST 00)", data: { name: "LP - Normal Interna", regime: "lucro_presumido", operation_type: "interna", product_type: "normal", cfop: "5102", cst_icms: "00", icms_rate: 18, pis_rate: 0.65, cofins_rate: 3.00 } },
  { name: "LP - Normal Interestadual", description: "Lucro Presumido, mercadoria normal, operação interestadual (CFOP 6102, CST 00)", data: { name: "LP - Normal Interestadual", regime: "lucro_presumido", operation_type: "interestadual", product_type: "normal", cfop: "6102", cst_icms: "00", icms_rate: 12, pis_rate: 0.65, cofins_rate: 3.00 } },
  { name: "LP - ST Interna", description: "Lucro Presumido, ST, operação interna (CFOP 5405, CST 60)", data: { name: "LP - ST Interna", regime: "lucro_presumido", operation_type: "interna", product_type: "st", cfop: "5405", cst_icms: "60", icms_rate: 0, pis_rate: 0.65, cofins_rate: 3.00 } },
  { name: "LP - ST Interestadual", description: "Lucro Presumido, ST, operação interestadual (CFOP 6404, CST 10)", data: { name: "LP - ST Interestadual", regime: "lucro_presumido", operation_type: "interestadual", product_type: "st", cfop: "6404", cst_icms: "10", icms_rate: 12, pis_rate: 0.65, cofins_rate: 3.00 } },
  // Lucro Real
  { name: "LR - Normal Interna", description: "Lucro Real, mercadoria normal, operação interna (CFOP 5102, CST 00)", data: { name: "LR - Normal Interna", regime: "lucro_real", operation_type: "interna", product_type: "normal", cfop: "5102", cst_icms: "00", icms_rate: 18, pis_rate: 1.65, cofins_rate: 7.60 } },
  { name: "LR - Normal Interestadual", description: "Lucro Real, mercadoria normal, operação interestadual (CFOP 6102, CST 00)", data: { name: "LR - Normal Interestadual", regime: "lucro_real", operation_type: "interestadual", product_type: "normal", cfop: "6102", cst_icms: "00", icms_rate: 12, pis_rate: 1.65, cofins_rate: 7.60 } },
  { name: "LR - ST Interna", description: "Lucro Real, ST, operação interna (CFOP 5405, CST 60)", data: { name: "LR - ST Interna", regime: "lucro_real", operation_type: "interna", product_type: "st", cfop: "5405", cst_icms: "60", icms_rate: 0, pis_rate: 1.65, cofins_rate: 7.60 } },
  { name: "LR - ST Interestadual", description: "Lucro Real, ST, operação interestadual (CFOP 6404, CST 10)", data: { name: "LR - ST Interestadual", regime: "lucro_real", operation_type: "interestadual", product_type: "st", cfop: "6404", cst_icms: "10", icms_rate: 12, pis_rate: 1.65, cofins_rate: 7.60 } },
];

export default function Categorias() {
  const [tab, setTab] = useState("product");
  const [showTemplates, setShowTemplates] = useState(false);
  const [creatingTemplate, setCreatingTemplate] = useState<string | null>(null);
  const [showStRuleForm, setShowStRuleForm] = useState(false);
  const [editingStRule, setEditingStRule] = useState<any>(null);
  const [stForm, setStForm] = useState({
    uf_origin: "SP", uf_destination: "", mva_original: 0, mva_adjusted: 0,
    icms_internal_rate: 18, icms_interstate_rate: 12, ncm: "", cest: "", description: "",
  });

  const prodCats = useProductCategories();
  const createProdCat = useCreateProductCategory();
  const updateProdCat = useUpdateProductCategory();
  const deleteProdCat = useDeleteProductCategory();

  const fiscalCats = useFiscalCategories();
  const createFiscalCat = useCreateFiscalCategory();
  const updateFiscalCat = useUpdateFiscalCategory();
  const deleteFiscalCat = useDeleteFiscalCategory();

  const stRules = useIcmsStRules();
  const createStRule = useCreateIcmsStRule();
  const updateStRule = useUpdateIcmsStRule();
  const deleteStRule = useDeleteIcmsStRule();

  const existingNames = (fiscalCats.data ?? []).map((c: any) => c.name);

  const handleCreateFromTemplate = async (template: FiscalTemplate) => {
    if (existingNames.includes(template.name)) {
      toast.info(`"${template.name}" já existe`);
      return;
    }
    setCreatingTemplate(template.name);
    try {
      await createFiscalCat.mutateAsync(template.data as any);
    } finally {
      setCreatingTemplate(null);
    }
  };

  /** Validate CST/CSOSN before saving fiscal category */
  const handleFiscalValidate = (data: Record<string, any>): string | null => {
    const regime = data.regime as TaxRegime;
    const result = validateCstCsosn({
      regime,
      csosn: data.csosn,
      cstIcms: data.cst_icms,
      productType: data.product_type,
    });

    if (!result.valid) {
      return result.errors.map((e) => e.message).join("\n");
    }

    // Show warnings as toast but don't block
    if (result.warnings.length > 0) {
      result.warnings.forEach((w) => toast.warning(w.message));
    }

    // REGRA: Tributação zerada suspeita
    const icms = Number(data.icms_rate) || 0;
    const pis = Number(data.pis_rate) || 0;
    const cofins = Number(data.cofins_rate) || 0;
    if (icms === 0 && pis === 0 && cofins === 0) {
      const csosn = data.csosn || "";
      const cst = data.cst_icms || "";
      const exemptCodes = ["40", "41", "50", "300", "400"];
      const hasExemptCode = exemptCodes.some((c) => csosn === c || cst === c);
      if (!hasExemptCode) {
        toast.warning(
          "⚠️ ICMS, PIS e COFINS todos em 0% — produto realmente possui isenção fiscal? Verifique o CST/CSOSN adequado para evitar sonegação acidental.",
          { duration: 8000 }
        );
      }
    }

    return null;
  };

  const resetStForm = () => {
    setStForm({
      uf_origin: "SP", uf_destination: "", mva_original: 0, mva_adjusted: 0,
      icms_internal_rate: 18, icms_interstate_rate: 12, ncm: "", cest: "", description: "",
    });
    setEditingStRule(null);
  };

  const handleSaveStRule = async () => {
    if (!stForm.uf_destination) {
      toast.error("UF destino obrigatória");
      return;
    }
    // Auto-calculate adjusted MVA
    const adjusted = calculateAdjustedMva(stForm.mva_original, stForm.icms_interstate_rate, stForm.icms_internal_rate);
    const payload = { ...stForm, mva_adjusted: adjusted, is_active: true, fiscal_category_id: null };

    if (editingStRule) {
      await updateStRule.mutateAsync({ id: editingStRule.id, ...payload });
    } else {
      await createStRule.mutateAsync(payload);
    }
    resetStForm();
    setShowStRuleForm(false);
  };

  const handleEditStRule = (rule: any) => {
    setStForm({
      uf_origin: rule.uf_origin, uf_destination: rule.uf_destination,
      mva_original: rule.mva_original, mva_adjusted: rule.mva_adjusted || 0,
      icms_internal_rate: rule.icms_internal_rate, icms_interstate_rate: rule.icms_interstate_rate,
      ncm: rule.ncm || "", cest: rule.cest || "", description: rule.description || "",
    });
    setEditingStRule(rule);
    setShowStRuleForm(true);
  };

  // Preview ST calculation
  const stPreview = stForm.mva_original > 0
    ? calculateIcmsSt({
        productValue: 100,
        mvaOriginal: stForm.mva_original,
        mvaAdjusted: calculateAdjustedMva(stForm.mva_original, stForm.icms_interstate_rate, stForm.icms_internal_rate),
        icmsOwnRate: stForm.icms_interstate_rate,
        icmsInternalRate: stForm.icms_internal_rate,
        icmsInterstateRate: stForm.icms_interstate_rate,
        isInterstate: stForm.uf_origin !== stForm.uf_destination,
      })
    : null;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="product" className="gap-2">
            <FolderTree className="w-4 h-4" />
            Categorias de Produto
          </TabsTrigger>
          <TabsTrigger value="fiscal" className="gap-2">
            <Tags className="w-4 h-4" />
            Categorias Fiscais
          </TabsTrigger>
          <TabsTrigger value="icms_st" className="gap-2">
            <Shield className="w-4 h-4" />
            ICMS-ST
          </TabsTrigger>
        </TabsList>

        <TabsContent value="product">
          <CrudPage
            title="Categorias de Produto"
            icon={<FolderTree className="w-5 h-5" />}
            data={prodCats.data ?? []}
            isLoading={prodCats.isLoading}
            fields={categoryFields}
            onCreate={(d) => createProdCat.mutateAsync(d as any)}
            onUpdate={(d) => updateProdCat.mutateAsync(d as any)}
            onDelete={(id) => deleteProdCat.mutateAsync(id)}
          />
        </TabsContent>

        <TabsContent value="fiscal">
          <div className="mb-4 flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setShowTemplates(true)} className="gap-2">
              <Zap className="w-4 h-4" />
              Criar a partir de modelo
            </Button>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info className="w-3.5 h-3.5" />
              <span>CST/CSOSN são validados automaticamente conforme o regime tributário</span>
            </div>
          </div>
          <CrudPage
            title="Categorias Fiscais"
            icon={<Tags className="w-5 h-5" />}
            data={fiscalCats.data ?? []}
            isLoading={fiscalCats.isLoading}
            fields={fiscalTableFields}
            getFields={buildFiscalFields}
            onValidate={handleFiscalValidate}
            onCreate={(d) => createFiscalCat.mutateAsync(d as any)}
            onUpdate={(d) => updateFiscalCat.mutateAsync(d as any)}
            onDelete={(id) => deleteFiscalCat.mutateAsync(id)}
            searchKeys={["name", "cfop"] as any}
            nameKey={"name" as any}
          />
        </TabsContent>

        <TabsContent value="icms_st">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Regras ICMS-ST por Estado</h2>
                <p className="text-sm text-muted-foreground">Cadastre MVA e alíquotas por UF para cálculo automático de ICMS-ST</p>
              </div>
              <Button size="sm" onClick={() => { resetStForm(); setShowStRuleForm(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Regra
              </Button>
            </div>

            {/* ST Rules Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Origem → Destino</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">MVA Original</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">MVA Ajustado</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">ICMS Interno</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">ICMS Inter.</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">NCM</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Descrição</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stRules.data ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                          Nenhuma regra cadastrada. Clique em "Nova Regra" para começar.
                        </td>
                      </tr>
                    ) : (
                      (stRules.data ?? []).map((rule) => (
                        <tr key={rule.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                          <td className="px-4 py-3 font-medium">{rule.uf_origin} → {rule.uf_destination}</td>
                          <td className="px-4 py-3 text-right font-mono">{rule.mva_original}%</td>
                          <td className="px-4 py-3 text-right font-mono">{rule.mva_adjusted?.toFixed(2) ?? "—"}%</td>
                          <td className="px-4 py-3 text-right font-mono">{rule.icms_internal_rate}%</td>
                          <td className="px-4 py-3 text-right font-mono">{rule.icms_interstate_rate}%</td>
                          <td className="px-4 py-3 font-mono text-xs">{rule.ncm || "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{rule.description || "—"}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => handleEditStRule(rule)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => deleteStRule.mutate(rule.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
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
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ST Rule Form Dialog */}
      <Dialog open={showStRuleForm} onOpenChange={(v) => { if (!v) resetStForm(); setShowStRuleForm(v); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingStRule ? "Editar Regra ICMS-ST" : "Nova Regra ICMS-ST"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">UF Origem</label>
                <Select value={stForm.uf_origin} onValueChange={(v) => setStForm(f => ({ ...f, uf_origin: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BRAZILIAN_UFS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">UF Destino</label>
                <Select value={stForm.uf_destination} onValueChange={(v) => setStForm(f => ({ ...f, uf_destination: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {BRAZILIAN_UFS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">MVA Original (%)</label>
                <Input type="number" step="0.01" value={stForm.mva_original} onChange={(e) => setStForm(f => ({ ...f, mva_original: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">MVA Ajustado (auto)</label>
                <Input type="number" readOnly className="bg-muted" value={calculateAdjustedMva(stForm.mva_original, stForm.icms_interstate_rate, stForm.icms_internal_rate).toFixed(2)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">ICMS Interno (%)</label>
                <Input type="number" step="0.01" value={stForm.icms_internal_rate} onChange={(e) => setStForm(f => ({ ...f, icms_internal_rate: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">ICMS Interestadual (%)</label>
                <Input type="number" step="0.01" value={stForm.icms_interstate_rate} onChange={(e) => setStForm(f => ({ ...f, icms_interstate_rate: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">NCM (opcional)</label>
                <Input placeholder="22021000" value={stForm.ncm} onChange={(e) => setStForm(f => ({ ...f, ncm: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">CEST (opcional)</label>
                <Input placeholder="0300100" value={stForm.cest} onChange={(e) => setStForm(f => ({ ...f, cest: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Descrição</label>
              <Input placeholder="Ex: Refrigerantes SP→MG" value={stForm.description} onChange={(e) => setStForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            {/* ST Calculation Preview */}
            {stPreview && (
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-2">
                  <Calculator className="w-3.5 h-3.5" />
                  Simulação (produto de R$ 100,00)
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <span className="text-muted-foreground">BC ICMS próprio:</span>
                  <span className="text-right font-mono">R$ {stPreview.bcIcmsOwn.toFixed(2)}</span>
                  <span className="text-muted-foreground">ICMS próprio:</span>
                  <span className="text-right font-mono">R$ {stPreview.icmsOwn.toFixed(2)}</span>
                  <span className="text-muted-foreground">MVA utilizado:</span>
                  <span className="text-right font-mono">{stPreview.mvaUsed.toFixed(2)}%</span>
                  <span className="text-muted-foreground">BC ICMS-ST:</span>
                  <span className="text-right font-mono">R$ {stPreview.bcIcmsSt.toFixed(2)}</span>
                  <span className="text-muted-foreground font-semibold">ICMS-ST:</span>
                  <span className="text-right font-mono font-semibold text-primary">R$ {stPreview.icmsSt.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => { resetStForm(); setShowStRuleForm(false); }}>Cancelar</Button>
              <Button onClick={handleSaveStRule} disabled={createStRule.isPending || updateStRule.isPending}>
                {editingStRule ? "Salvar" : "Criar Regra"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template selector dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modelos de Categoria Fiscal</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            Selecione um modelo para criar automaticamente com todos os campos preenchidos.
            Os modelos já utilizam o CST/CSOSN correto para cada regime.
          </p>
          <div className="space-y-2">
            {FISCAL_TEMPLATES.map((t) => {
              const alreadyExists = existingNames.includes(t.name);
              const isCreating = creatingTemplate === t.name;
              return (
                <button
                  key={t.name}
                  disabled={alreadyExists || isCreating}
                  onClick={() => handleCreateFromTemplate(t)}
                  className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-foreground">{t.name}</span>
                    {alreadyExists && <span className="text-xs text-muted-foreground">Já criada</span>}
                    {isCreating && <span className="text-xs text-primary">Criando...</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

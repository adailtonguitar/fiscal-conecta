import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Package, CheckCircle2, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import anthoLogo from "@/assets/logo-as.png";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OnboardingWizardProps {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Company form
  const [companyName, setCompanyName] = useState("");
  const [companyCnpj, setCompanyCnpj] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");

  // Product form
  const [productName, setProductName] = useState("");
  const [productSku, setProductSku] = useState("");
  const [productPrice, setProductPrice] = useState("");

  const [companyCreated, setCompanyCreated] = useState(false);
  const [productCreated, setProductCreated] = useState(false);

  const steps = [
    { icon: Building2, label: "Sua Empresa", desc: "Cadastre os dados básicos" },
    { icon: Package, label: "Primeiro Produto", desc: "Adicione um produto para começar" },
    { icon: CheckCircle2, label: "Pronto!", desc: "Tudo configurado" },
  ];

  const handleCreateCompany = async () => {
    if (!companyName.trim() || !companyCnpj.trim()) {
      toast.error("Preencha o nome e CNPJ da empresa");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("companies").insert({
        name: companyName.trim(),
        cnpj: companyCnpj.replace(/\D/g, ""),
        phone: companyPhone || null,
      });
      if (error) throw error;
      setCompanyCreated(true);
      toast.success("Empresa cadastrada!");
      setStep(1);
    } catch (err: any) {
      toast.error(err.message || "Erro ao cadastrar empresa");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!productName.trim() || !productPrice) {
      toast.error("Preencha nome e preço do produto");
      return;
    }
    setLoading(true);
    try {
      // Need to get companyId first
      const { data: cu } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id || "")
        .eq("is_active", true)
        .limit(1)
        .single();

      if (!cu) throw new Error("Empresa não encontrada");

      const sku = productSku.trim() || `PRD-${Date.now().toString(36).toUpperCase()}`;
      const { error } = await supabase.from("products").insert({
        company_id: cu.company_id,
        name: productName.trim(),
        sku,
        price: parseFloat(productPrice),
      });
      if (error) throw error;
      setProductCreated(true);
      toast.success("Produto cadastrado!");
      setStep(2);
    } catch (err: any) {
      toast.error(err.message || "Erro ao cadastrar produto");
    } finally {
      setLoading(false);
    }
  };

  const handleSkipProduct = () => setStep(2);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <img src={anthoLogo} alt="AnthoSystem" className="h-24 object-contain mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Bem-vindo ao AnthoSystem</h1>
          <p className="text-sm text-muted-foreground mt-1">Vamos configurar tudo em poucos passos</p>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 h-0.5 ${i < step ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl card-shadow border border-border p-6">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Cadastre sua Empresa</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-6">Informações básicas para começar a operar</p>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Nome da Empresa *</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Minha Loja Ltda"
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">CNPJ *</label>
                    <input
                      type="text"
                      value={companyCnpj}
                      onChange={(e) => setCompanyCnpj(e.target.value)}
                      placeholder="00.000.000/0001-00"
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Telefone</label>
                    <input
                      type="text"
                      value={companyPhone}
                      onChange={(e) => setCompanyPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <button
                    onClick={handleCreateCompany}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continuar <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Primeiro Produto</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-6">Cadastre um produto para testar o sistema</p>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Nome do Produto *</label>
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="Ex: Coca-Cola 350ml"
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">SKU</label>
                    <input
                      type="text"
                      value={productSku}
                      onChange={(e) => setProductSku(e.target.value)}
                      placeholder="Gerado automaticamente"
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Preço (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      placeholder="0,00"
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSkipProduct}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:opacity-90 transition-all"
                    >
                      Pular
                    </button>
                    <button
                      onClick={handleCreateProduct}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Cadastrar <ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-success" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Tudo Pronto!</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Sua empresa está configurada. Agora você pode começar a usar o sistema.
                </p>
                <div className="space-y-2 text-sm text-left bg-muted/50 rounded-xl p-4 mb-6">
                  <p className="font-medium text-foreground">💡 Dicas rápidas:</p>
                  <p className="text-muted-foreground">• Use o <strong>PDV</strong> para registrar vendas</p>
                  <p className="text-muted-foreground">• Cadastre mais produtos em <strong>Estoque → Produtos</strong></p>
                  <p className="text-muted-foreground">• Configure dados fiscais em <strong>Config. Fiscal</strong></p>
                </div>
                <button
                  onClick={onComplete}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all"
                >
                  Ir para o Dashboard <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

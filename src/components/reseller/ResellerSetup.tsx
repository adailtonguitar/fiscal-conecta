import { useState } from "react";
import { Building2, ArrowRight, User } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Props {
  onCreate: (data: { name: string; email?: string; cnpj?: string; phone?: string; trade_name?: string; brand_name?: string; primary_color?: string }) => Promise<void>;
}

export function ResellerSetup({ onCreate }: Props) {
  const [form, setForm] = useState({
    name: "",
    cnpj: "",
    email: "",
    phone: "",
    trade_name: "",
    seller_name: "",
    seller_phone: "",
    seller_email: "",
    brand_name: "AnthoSystem",
  });
  const [creating, setCreating] = useState(false);

  const updateField = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Razão Social é obrigatória"); return; }
    if (!form.cnpj.trim()) { toast.error("CNPJ é obrigatório"); return; }
    if (!form.email.trim()) { toast.error("E-mail da empresa é obrigatório"); return; }
    if (!form.phone.trim()) { toast.error("Telefone da empresa é obrigatório"); return; }
    if (!form.seller_name.trim()) { toast.error("Nome do vendedor é obrigatório"); return; }

    setCreating(true);
    await onCreate({
      name: form.name.trim(),
      cnpj: form.cnpj.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      trade_name: form.trade_name.trim() || null as any,
      brand_name: form.brand_name.trim() || "AnthoSystem",
    });
    setCreating(false);
  };

  const inputClass = "w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-xl card-shadow border border-border p-8 max-w-lg w-full space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-xl brand-gradient flex items-center justify-center mx-auto">
            <Building2 className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Criar Revenda</h1>
          <p className="text-sm text-muted-foreground">Configure sua revenda para começar a vender licenças do sistema.</p>
        </div>

        {/* Dados da Empresa */}
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            Dados da Empresa
          </h2>
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Razão Social *</label>
              <input value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Minha Revenda LTDA" className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Nome Fantasia</label>
              <input value={form.trade_name} onChange={(e) => updateField("trade_name", e.target.value)} placeholder="Minha Revenda" className={inputClass} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">CNPJ *</label>
                <input value={form.cnpj} onChange={(e) => updateField("cnpj", e.target.value)} placeholder="00.000.000/0001-00" className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Telefone *</label>
                <input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="(11) 99999-0000" className={inputClass} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">E-mail *</label>
              <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="contato@empresa.com" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Dados do Vendedor */}
        <div className="space-y-1 pt-2 border-t border-border">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 pt-3">
            <User className="w-4 h-4 text-primary" />
            Dados do Vendedor / Responsável
          </h2>
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Nome Completo *</label>
              <input value={form.seller_name} onChange={(e) => updateField("seller_name", e.target.value)} placeholder="João da Silva" className={inputClass} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Telefone do Vendedor</label>
                <input value={form.seller_phone} onChange={(e) => updateField("seller_phone", e.target.value)} placeholder="(11) 99999-0000" className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">E-mail do Vendedor</label>
                <input type="email" value={form.seller_email} onChange={(e) => updateField("seller_email", e.target.value)} placeholder="vendedor@empresa.com" className={inputClass} />
              </div>
            </div>
          </div>
        </div>

        {/* Marca */}
        <div className="space-y-1 pt-2 border-t border-border">
          <div className="pt-3">
            <label className="text-sm font-medium text-foreground mb-1 block">Nome da Marca (White Label)</label>
            <input value={form.brand_name} onChange={(e) => updateField("brand_name", e.target.value)} className={inputClass} />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={creating}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
        >
          {creating ? "Criando..." : "Criar Revenda"}
          {!creating && <ArrowRight className="w-4 h-4" />}
        </button>
      </motion.div>
    </div>
  );
}

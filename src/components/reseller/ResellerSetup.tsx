import { useState } from "react";
import { Building2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  onCreate: (data: { name: string; email?: string; cnpj?: string; brand_name?: string; primary_color?: string }) => Promise<void>;
}

export function ResellerSetup({ onCreate }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [brandName, setBrandName] = useState("PDV Fiscal");
  const [creating, setCreating] = useState(false);

  const handleSubmit = async () => {
    if (!name) return;
    setCreating(true);
    await onCreate({ name, email, cnpj, brand_name: brandName });
    setCreating(false);
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-xl card-shadow border border-border p-8 max-w-md w-full space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-xl brand-gradient flex items-center justify-center mx-auto">
            <Building2 className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Criar Revenda</h1>
          <p className="text-sm text-muted-foreground">Configure sua revenda para começar a vender licenças do sistema.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Nome da Empresa *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Minha Revenda LTDA" className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">E-mail</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contato@empresa.com" className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">CNPJ</label>
            <input value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0001-00" className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Nome da Marca</label>
            <input value={brandName} onChange={(e) => setBrandName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!name || creating}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
        >
          {creating ? "Criando..." : "Criar Revenda"}
          {!creating && <ArrowRight className="w-4 h-4" />}
        </button>
      </motion.div>
    </div>
  );
}

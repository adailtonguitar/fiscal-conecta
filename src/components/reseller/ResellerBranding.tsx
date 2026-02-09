import { useState } from "react";
import { Palette, Save, Globe, Upload } from "lucide-react";
import { motion } from "framer-motion";
import type { Reseller } from "@/hooks/useReseller";

interface Props {
  reseller: Reseller;
  onUpdate: (updates: Partial<Reseller>) => Promise<void>;
}

export function ResellerBranding({ reseller, onUpdate }: Props) {
  const [brandName, setBrandName] = useState(reseller.brand_name);
  const [primaryColor, setPrimaryColor] = useState(reseller.primary_color);
  const [secondaryColor, setSecondaryColor] = useState(reseller.secondary_color);
  const [customDomain, setCustomDomain] = useState(reseller.custom_domain || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onUpdate({
      brand_name: brandName,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      custom_domain: customDomain || null,
    });
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl card-shadow border border-border overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Personalização da Marca</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Nome da Marca</label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Cor Primária</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                />
                <span className="text-sm font-mono text-muted-foreground">{primaryColor}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Cor Secundária</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                />
                <span className="text-sm font-mono text-muted-foreground">{secondaryColor}</span>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Pré-visualização</label>
            <div
              className="rounded-xl p-4 border border-border"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{brandName}</p>
                  <p className="text-white/70 text-xs">Sistema de Vendas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-xl card-shadow border border-border overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Domínio Personalizado</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Domínio</label>
            <input
              type="text"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="meusistema.com.br"
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <p className="text-xs text-muted-foreground mt-1.5">Seus clientes acessarão o sistema por este domínio.</p>
          </div>
        </div>
      </motion.div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        {saving ? "Salvando..." : "Salvar Personalização"}
      </button>
    </div>
  );
}

import { useState, useRef } from "react";
import { Palette, Save, Globe, Upload, Image, Trash2, Loader2, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Reseller } from "@/hooks/useReseller";

interface Props {
  reseller: Reseller;
  onUpdate: (updates: Partial<Reseller>) => Promise<void>;
}

export function ResellerBranding({ reseller, onUpdate }: Props) {
  const [brandName, setBrandName] = useState(reseller.brand_name || "");
  const [primaryColor, setPrimaryColor] = useState(reseller.primary_color || "#1a9e7a");
  const [secondaryColor, setSecondaryColor] = useState(reseller.secondary_color || "#0f766e");
  const [customDomain, setCustomDomain] = useState(reseller.custom_domain || "");
  const [logoUrl, setLogoUrl] = useState(reseller.logo_url || "");
  const [whatsappSupport, setWhatsappSupport] = useState(reseller.whatsapp_support || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 2MB");
      return;
    }

    setUploading(true);
    try {
      // Verify auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Você precisa estar logado para enviar a logo");
        setUploading(false);
        return;
      }

      const ext = file.name.split(".").pop();
      const path = `${reseller.id}/logo.${ext}`;

      // Remove old file first to avoid conflicts
      await supabase.storage.from("reseller-logos").remove([path]);

      const { error: uploadError } = await supabase.storage
        .from("reseller-logos")
        .upload(path, file, { upsert: true, cacheControl: "0" });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("reseller-logos")
        .getPublicUrl(path);

      const url = `${data.publicUrl}?t=${Date.now()}`;
      setLogoUrl(url);
      toast.success("Logo enviado com sucesso");
    } catch (err: any) {
      toast.error(`Erro ao enviar logo: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl("");
  };

  const handleSave = async () => {
    setSaving(true);
    await onUpdate({
      brand_name: brandName,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      custom_domain: customDomain || null,
      logo_url: logoUrl || null,
      whatsapp_support: whatsappSupport || null,
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
          {/* Logo Upload */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Logo da Marca</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Image className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {uploading ? "Enviando..." : "Enviar Logo"}
                </button>
                {logoUrl && (
                  <button
                    onClick={handleRemoveLogo}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remover
                  </button>
                )}
                <p className="text-xs text-muted-foreground">PNG, JPG ou SVG. Máx. 2MB.</p>
              </div>
            </div>
          </div>

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
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center overflow-hidden">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Upload className="w-5 h-5 text-white" />
                  )}
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

      {/* WhatsApp Support */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-xl card-shadow border border-border overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">WhatsApp de Suporte</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Número do WhatsApp</label>
            <input
              type="text"
              value={whatsappSupport}
              onChange={(e) => setWhatsappSupport(e.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <p className="text-xs text-muted-foreground mt-1.5">Seus clientes verão um botão flutuante de WhatsApp direcionando para este número.</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
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

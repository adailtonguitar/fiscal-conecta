import { useState, useEffect } from "react";
import { CreditCard, Save, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useTEFConfig, TEF_PROVIDERS, type TEFProvider } from "@/hooks/useTEFConfig";
import { usePermissions } from "@/hooks/usePermissions";

export function TEFConfigSection() {
  const { role } = usePermissions();
  const { config, loading, saveConfig } = useTEFConfig();
  const [provider, setProvider] = useState<TEFProvider>("simulado");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [terminalId, setTerminalId] = useState("01");
  const [environment, setEnvironment] = useState<"sandbox" | "production">("sandbox");
  const [maxInstallments, setMaxInstallments] = useState(12);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (config) {
      setProvider(config.provider);
      setApiKey(config.api_key || "");
      setApiSecret(config.api_secret || "");
      setMerchantId(config.merchant_id || "");
      setTerminalId(config.terminal_id || "01");
      setEnvironment(config.environment);
      setMaxInstallments(config.max_installments);
      setDirty(false);
    }
  }, [config]);

  if (role !== "admin") return null;

  const selectedProvider = TEF_PROVIDERS.find((p) => p.id === provider);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await saveConfig({
      provider,
      api_key: apiKey || null,
      api_secret: apiSecret || null,
      merchant_id: merchantId || null,
      terminal_id: terminalId || "01",
      environment,
      max_installments: maxInstallments,
    });
    if (error) {
      toast.error("Erro ao salvar configuração TEF");
    } else {
      toast.success("Configuração TEF salva!");
      setDirty(false);
    }
    setSaving(false);
  };

  const markDirty = () => setDirty(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-card rounded-xl card-shadow border border-border overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <CreditCard className="w-4 h-4 text-primary" />
        <h2 className="text-base font-semibold text-foreground">Integração TEF (Maquininha)</h2>
      </div>
      <div className="p-5 space-y-5">
        <p className="text-sm text-muted-foreground">
          Configure o provedor de pagamento eletrônico para confirmação automática no PDV.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Provider selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Provedor</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TEF_PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setProvider(p.id); markDirty(); }}
                    className={`flex flex-col items-start p-3 rounded-lg border transition-all text-left ${
                      provider === p.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/30 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {provider === p.id && <CheckCircle className="w-3.5 h-3.5 text-primary" />}
                      <span className="text-sm font-medium text-foreground">{p.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground mt-0.5">{p.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Provider credentials */}
            {selectedProvider?.requiresKey && (
              <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                  <span className="text-xs text-warning font-medium">
                    Credenciais são armazenadas de forma segura no banco de dados
                  </span>
                </div>

                {provider === "mercadopago" ? (
                  <>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Access Token (Mercado Pago)</label>
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => { setApiKey(e.target.value); markDirty(); }}
                        placeholder="APP_USR-..."
                        className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Encontre em: Mercado Pago → Seu negócio → Configurações → Credenciais de produção
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Device ID (Maquininha Point)</label>
                      <input
                        type="text"
                        value={terminalId}
                        onChange={(e) => { setTerminalId(e.target.value); markDirty(); }}
                        placeholder="Ex: PAX_A910__SERIAL123"
                        className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/40"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        ID do dispositivo Point. Encontre na API ou no painel do Mercado Pago.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">API Key / Client ID</label>
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => { setApiKey(e.target.value); markDirty(); }}
                        placeholder="Cole sua API Key aqui..."
                        className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">API Secret / Client Secret</label>
                      <input
                        type="password"
                        value={apiSecret}
                        onChange={(e) => { setApiSecret(e.target.value); markDirty(); }}
                        placeholder="Cole seu Secret aqui..."
                        className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Merchant ID / Terminal</label>
                      <input
                        type="text"
                        value={merchantId}
                        onChange={(e) => { setMerchantId(e.target.value); markDirty(); }}
                        placeholder="ID do estabelecimento (opcional)"
                        className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Environment & Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Ambiente</label>
                <select
                  value={environment}
                  onChange={(e) => { setEnvironment(e.target.value as any); markDirty(); }}
                  className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
                >
                  <option value="sandbox">Sandbox (testes)</option>
                  <option value="production">Produção</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Máximo de Parcelas</label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={maxInstallments}
                  onChange={(e) => { setMaxInstallments(Number(e.target.value)); markDirty(); }}
                  className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Save button */}
            {dirty && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar Configuração TEF
              </button>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

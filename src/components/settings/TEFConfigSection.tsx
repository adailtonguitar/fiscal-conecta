import { useState, useEffect } from "react";
import { CreditCard, Save, Loader2, CheckCircle, AlertTriangle, Search, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useTEFConfig, TEF_PROVIDERS, HARDWARE_MODELS, CONNECTION_TYPE_LABELS, FEATURE_LABELS, type TEFProvider } from "@/hooks/useTEFConfig";
import { usePermissions } from "@/hooks/usePermissions";
import { useCompany } from "@/hooks/useCompany";
import { MercadoPagoTEFService } from "@/services/MercadoPagoTEFService";
import { supabase } from "@/integrations/supabase/client";

export function TEFConfigSection() {
  const { role } = usePermissions();
  const { companyId } = useCompany();
  const { config, loading, saveConfig } = useTEFConfig();
  const [testingPix, setTestingPix] = useState(false);
  const [provider, setProvider] = useState<TEFProvider>("simulado");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [terminalId, setTerminalId] = useState("01");
  const [environment, setEnvironment] = useState<"sandbox" | "production">("sandbox");
  const [maxInstallments, setMaxInstallments] = useState(12);
  const [hardwareModel, setHardwareModel] = useState<string>("");
  const [connectionType, setConnectionType] = useState<string>("usb");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [devices, setDevices] = useState<{ id: string; operating_mode: string }[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);

  useEffect(() => {
    if (config) {
      setProvider(config.provider);
      setApiKey(config.api_key || "");
      setApiSecret(config.api_secret || "");
      setMerchantId(config.merchant_id || "");
      setTerminalId(config.terminal_id || "01");
      setEnvironment(config.environment);
      setMaxInstallments(config.max_installments);
      setHardwareModel(config.hardware_model || "");
      setConnectionType(config.connection_type || "usb");
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
      hardware_model: hardwareModel || null,
      connection_type: connectionType,
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
                      <div className="flex gap-2">
                        {devices.length > 0 ? (
                          <select
                            value={terminalId}
                            onChange={(e) => { setTerminalId(e.target.value); markDirty(); }}
                            className="flex-1 px-3 py-2 rounded-lg bg-card border border-border text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/40"
                          >
                            <option value="">Selecione um dispositivo</option>
                            {devices.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.id} ({d.operating_mode})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={terminalId}
                            onChange={(e) => { setTerminalId(e.target.value); markDirty(); }}
                            placeholder="Ex: PAX_A910__SERIAL123"
                            className="flex-1 px-3 py-2 rounded-lg bg-card border border-border text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/40"
                          />
                        )}
                        <button
                          type="button"
                          disabled={!apiKey || loadingDevices}
                          onClick={async () => {
                            setLoadingDevices(true);
                            try {
                              const devs = await MercadoPagoTEFService.listDevices(apiKey);
                              setDevices(devs);
                              if (devs.length === 0) {
                                toast.info("Nenhum dispositivo Point encontrado");
                              } else {
                                toast.success(`${devs.length} dispositivo(s) encontrado(s)`);
                              }
                            } catch (err: any) {
                              toast.error(err.message || "Erro ao buscar dispositivos");
                            }
                            setLoadingDevices(false);
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-muted/50 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                        >
                          {loadingDevices ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                          Buscar
                        </button>
                    </div>

                    {/* Test PIX connection button */}
                    <div className="pt-2 border-t border-border">
                      <button
                        type="button"
                        disabled={!apiKey || testingPix || !companyId}
                        onClick={async () => {
                          setTestingPix(true);
                          try {
                            const { data: sessionData } = await supabase.auth.getSession();
                            const token = sessionData?.session?.access_token;
                            if (!token) throw new Error("Usuário não autenticado");

                            const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pix-create`;
                            const resp = await fetch(url, {
                              method: "POST",
                              headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                                apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                              },
                              body: JSON.stringify({
                                amount: 0.01,
                                description: "Teste de conexão PIX",
                                company_id: companyId,
                              }),
                            });
                            const data = await resp.json();
                            if (!resp.ok) throw new Error(data.error || `Erro ${resp.status}`);

                            if (data.qr_code) {
                              toast.success("✅ Conexão PIX OK! QR Code gerado com sucesso.");
                            } else {
                              toast.warning("Resposta recebida, mas sem QR Code. Verifique as credenciais.");
                            }
                          } catch (err: any) {
                            toast.error(`Falha no teste: ${err.message}`);
                          }
                          setTestingPix(false);
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-primary/30 bg-primary/5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                      >
                        {testingPix ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        Testar Conexão PIX
                      </button>
                      <p className="text-xs text-muted-foreground mt-1">
                        Gera um PIX de R$ 0,01 para validar que a integração está funcionando.
                      </p>
                    </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Clique em "Buscar" para listar suas maquininhas Point automaticamente.
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

            {/* Hardware Model selection */}
            {provider !== "simulado" && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Modelo da Maquininha</label>
                {(() => {
                  const models = HARDWARE_MODELS.filter((m) => m.provider === provider);
                  if (models.length === 0) return null;
                  return (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {models.map((m) => {
                          const isSelected = hardwareModel === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                setHardwareModel(m.id);
                                // Auto-set first available connection type
                                if (m.connectionTypes.length > 0 && !m.connectionTypes.includes(connectionType)) {
                                  setConnectionType(m.connectionTypes[0]);
                                }
                                markDirty();
                              }}
                              className={`flex flex-col items-start p-3 rounded-lg border transition-all text-left ${
                                isSelected
                                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                  : "border-border hover:border-primary/30 hover:bg-muted/50"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {isSelected && <CheckCircle className="w-3.5 h-3.5 text-primary" />}
                                <span className="text-sm font-medium text-foreground">{m.label}</span>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {m.features.map((f) => (
                                  <span key={f} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">
                                    {FEATURE_LABELS[f] || f}
                                  </span>
                                ))}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Connection type for selected model */}
                      {hardwareModel && (() => {
                        const selectedModel = models.find((m) => m.id === hardwareModel);
                        if (!selectedModel) return null;
                        return (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Tipo de Conexão</label>
                            <div className="flex flex-wrap gap-2">
                              {selectedModel.connectionTypes.map((ct) => (
                                <button
                                  key={ct}
                                  type="button"
                                  onClick={() => { setConnectionType(ct); markDirty(); }}
                                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                                    connectionType === ct
                                      ? "border-primary bg-primary/10 text-primary"
                                      : "border-border text-muted-foreground hover:border-primary/30"
                                  }`}
                                >
                                  {CONNECTION_TYPE_LABELS[ct] || ct}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  );
                })()}
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

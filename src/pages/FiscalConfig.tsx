import { useState, useCallback } from "react";
import {
  Shield,
  Upload,
  AlertTriangle,
  CheckCircle,
  FileKey,
  Server,
  Hash,
  Settings2,
  Cpu,
  Save,
  RefreshCw,
  Loader2,
  Usb,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { webPKIService, type CertificateInfo } from "@/services/WebPKIService";

interface FiscalConfigSection {
  docType: "nfce" | "nfe" | "sat";
  label: string;
  serie: number;
  nextNumber: number;
  environment: "homologacao" | "producao";
  cscId: string;
  cscToken: string;
  isActive: boolean;
}

const initialConfigs: FiscalConfigSection[] = [
  { docType: "nfce", label: "NFC-e", serie: 1, nextNumber: 4, environment: "homologacao", cscId: "1", cscToken: "ABC123DEF456GHI789", isActive: true },
  { docType: "nfe", label: "NF-e", serie: 1, nextNumber: 3, environment: "homologacao", cscId: "", cscToken: "", isActive: true },
  { docType: "sat", label: "SAT/CF-e", serie: 1, nextNumber: 2, environment: "producao", cscId: "", cscToken: "", isActive: false },
];

export default function FiscalConfig() {
  const [configs, setConfigs] = useState(initialConfigs);
  const [certType, setCertType] = useState<"A1" | "A3">("A1");
  const [certFile, setCertFile] = useState<string | null>(null);
  const [certExpiry, setCertExpiry] = useState("2027-06-15");
  const [a3Provider, setA3Provider] = useState("");
  const [a3SlotIndex, setA3SlotIndex] = useState("0");
  const [satSerial, setSatSerial] = useState("");
  const [satActivation, setSatActivation] = useState("");

  // Web PKI A3 state
  const [a3Certificates, setA3Certificates] = useState<CertificateInfo[]>([]);
  const [a3SelectedThumbprint, setA3SelectedThumbprint] = useState("");
  const [a3Loading, setA3Loading] = useState(false);
  const [a3Initialized, setA3Initialized] = useState(false);

  const initWebPKI = useCallback(async () => {
    setA3Loading(true);
    try {
      await webPKIService.init();
      setA3Initialized(true);
      const certs = await webPKIService.listCertificates();
      setA3Certificates(certs);
      if (certs.length === 0) {
        toast.info("Nenhum certificado digital encontrado. Verifique se o token está conectado.");
      } else {
        toast.success(`${certs.length} certificado(s) encontrado(s)`);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao inicializar Web PKI");
    } finally {
      setA3Loading(false);
    }
  }, []);

  const refreshCertificates = useCallback(async () => {
    if (!a3Initialized) return;
    setA3Loading(true);
    try {
      const certs = await webPKIService.listCertificates();
      setA3Certificates(certs);
      toast.success(`${certs.length} certificado(s) encontrado(s)`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao listar certificados");
    } finally {
      setA3Loading(false);
    }
  }, [a3Initialized]);

  const selectedCert = a3Certificates.find((c) => c.thumbprint === a3SelectedThumbprint);

  const updateConfig = (idx: number, updates: Partial<FiscalConfigSection>) => {
    setConfigs((prev) => prev.map((c, i) => (i === idx ? { ...c, ...updates } : c)));
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuração Fiscal</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Certificado digital, CSC, séries e ambiente SEFAZ
        </p>
      </div>

      {/* Certificate */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl card-shadow border border-border overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <FileKey className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Certificado Digital</h2>
        </div>
        <div className="p-5 space-y-4">
          {/* Cert type selector */}
          <div className="flex gap-2">
            {(["A1", "A3"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setCertType(type)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                  certType === type
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 text-foreground border-border hover:bg-muted"
                }`}
              >
                Certificado {type}
              </button>
            ))}
          </div>

          {certType === "A1" ? (
            <>
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                <div className="flex items-center gap-3">
                  {certFile ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-warning" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {certFile ? "Certificado A1 instalado" : "Nenhum certificado A1 instalado"}
                    </p>
                    {certFile && (
                      <p className="text-xs text-muted-foreground">
                        Validade: {new Date(certExpiry).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>
                </div>
                <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium cursor-pointer hover:opacity-90 transition-all">
                  <Upload className="w-4 h-4" />
                  {certFile ? "Trocar" : "Enviar"} .PFX
                  <input
                    type="file"
                    accept=".pfx,.p12"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setCertFile(e.target.files[0].name);
                    }}
                  />
                </label>
              </div>
              {certFile && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Senha do Certificado
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full max-w-sm px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                <Usb className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Certificado A3 (Token/Smartcard)</p>
                  <p className="text-xs text-muted-foreground">
                    Assinatura digital via Lacuna Web PKI — o token deve estar conectado
                  </p>
                </div>
              </div>

              {!a3Initialized ? (
                <button
                  onClick={initWebPKI}
                  disabled={a3Loading}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {a3Loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Shield className="w-4 h-4" />
                  )}
                  {a3Loading ? "Detectando certificados..." : "Detectar Certificados A3"}
                </button>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <select
                      value={a3SelectedThumbprint}
                      onChange={(e) => setA3SelectedThumbprint(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                      <option value="">Selecione um certificado</option>
                      {a3Certificates.map((cert) => (
                        <option key={cert.thumbprint} value={cert.thumbprint}>
                          {cert.subjectName}
                          {cert.pkiBrazil?.cnpj ? ` (CNPJ: ${cert.pkiBrazil.cnpj})` : ""}
                          {cert.pkiBrazil?.cpf ? ` (CPF: ${cert.pkiBrazil.cpf})` : ""}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={refreshCertificates}
                      disabled={a3Loading}
                      className="p-2.5 rounded-xl bg-muted border border-border hover:bg-muted/80 transition-all"
                      title="Atualizar lista"
                    >
                      <RefreshCw className={`w-4 h-4 text-foreground ${a3Loading ? "animate-spin" : ""}`} />
                    </button>
                  </div>

                  {selectedCert && (
                    <div className="p-4 rounded-xl bg-muted/50 space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span className="text-sm font-medium text-foreground">Certificado selecionado</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground">
                        <p><strong>Titular:</strong> {selectedCert.subjectName}</p>
                        <p><strong>Emissor:</strong> {selectedCert.issuerName}</p>
                        <p><strong>Válido de:</strong> {new Date(selectedCert.validFrom).toLocaleDateString("pt-BR")}</p>
                        <p><strong>Válido até:</strong> {new Date(selectedCert.validTo).toLocaleDateString("pt-BR")}</p>
                        {selectedCert.pkiBrazil?.cnpj && (
                          <p><strong>CNPJ:</strong> {selectedCert.pkiBrazil.cnpj}</p>
                        )}
                        {selectedCert.pkiBrazil?.cpf && (
                          <p><strong>CPF:</strong> {selectedCert.pkiBrazil.cpf}</p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-primary text-xs">
                <Cpu className="w-4 h-4 flex-shrink-0" />
                O certificado A3 requer o Web PKI instalado e o token/smartcard conectado durante a emissão.
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Doc type configs */}
      {configs.map((config, idx) => (
        <motion.div
          key={config.docType}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (idx + 1) * 0.1 }}
          className="bg-card rounded-xl card-shadow border border-border overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              {config.docType === "sat" ? (
                <Cpu className="w-4 h-4 text-primary" />
              ) : (
                <Settings2 className="w-4 h-4 text-primary" />
              )}
              <h2 className="text-base font-semibold text-foreground">{config.label}</h2>
            </div>
            <button
              onClick={() => updateConfig(idx, { isActive: !config.isActive })}
              className={`w-11 h-6 rounded-full relative transition-colors ${
                config.isActive ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`w-5 h-5 bg-primary-foreground rounded-full absolute top-0.5 transition-all ${
                  config.isActive ? "right-0.5" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {config.isActive && (
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Environment */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    <Server className="w-3.5 h-3.5 inline mr-1" />
                    Ambiente SEFAZ
                  </label>
                  <select
                    value={config.environment}
                    onChange={(e) => updateConfig(idx, { environment: e.target.value as any })}
                    className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    <option value="homologacao">Homologação</option>
                    <option value="producao">Produção</option>
                  </select>
                </div>

                {/* Serie */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    <Hash className="w-3.5 h-3.5 inline mr-1" />
                    Série
                  </label>
                  <input
                    type="number"
                    value={config.serie}
                    onChange={(e) => updateConfig(idx, { serie: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                  />
                </div>

                {/* Next number */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Próximo Número
                  </label>
                  <input
                    type="number"
                    value={config.nextNumber}
                    onChange={(e) => updateConfig(idx, { nextNumber: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                  />
                </div>
              </div>

              {/* CSC (NFC-e only) */}
              {config.docType === "nfce" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      <Shield className="w-3.5 h-3.5 inline mr-1" />
                      CSC ID
                    </label>
                    <input
                      type="text"
                      value={config.cscId}
                      onChange={(e) => updateConfig(idx, { cscId: e.target.value })}
                      placeholder="Número de identificação do CSC"
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      Token CSC
                    </label>
                    <input
                      type="password"
                      value={config.cscToken}
                      onChange={(e) => updateConfig(idx, { cscToken: e.target.value })}
                      placeholder="Token do Código de Segurança"
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              )}

              {/* SAT fields */}
              {config.docType === "sat" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      Número de Série SAT
                    </label>
                    <input
                      type="text"
                      value={satSerial}
                      onChange={(e) => setSatSerial(e.target.value)}
                      placeholder="900000000"
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      Código de Ativação
                    </label>
                    <input
                      type="password"
                      value={satActivation}
                      onChange={(e) => setSatActivation(e.target.value)}
                      placeholder="Código de ativação do SAT"
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Environment warning */}
              {config.environment === "producao" && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 text-warning text-xs">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  Ambiente de produção ativo. Documentos emitidos terão validade fiscal.
                </div>
              )}
            </div>
          )}
        </motion.div>
      ))}

      <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all">
        <Save className="w-4 h-4" />
        Salvar Configurações Fiscais
      </button>
    </div>
  );
}

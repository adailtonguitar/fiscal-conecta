import { useState } from "react";
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
} from "lucide-react";
import { motion } from "framer-motion";

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
  const [certFile, setCertFile] = useState<string | null>(null);
  const [certExpiry, setCertExpiry] = useState("2027-06-15");
  const [satSerial, setSatSerial] = useState("");
  const [satActivation, setSatActivation] = useState("");

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
          <h2 className="text-base font-semibold text-foreground">Certificado Digital A1</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              {certFile ? (
                <CheckCircle className="w-5 h-5 text-success" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-warning" />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">
                  {certFile ? "Certificado instalado" : "Nenhum certificado instalado"}
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
              {certFile ? "Trocar" : "Enviar"} Certificado
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

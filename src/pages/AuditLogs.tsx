import {
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  User,
  Shield,
  XCircle,
  Send,
  Settings,
  Eye,
} from "lucide-react";
import { motion } from "framer-motion";

interface AuditEntry {
  id: string;
  action: string;
  docType: string;
  docNumber?: string;
  userName: string;
  details: string;
  timestamp: string;
  severity: "info" | "warning" | "error" | "success";
}

const mockAudit: AuditEntry[] = [
  { id: "1", action: "Emissão NFC-e", docType: "NFC-e", docNumber: "000001", userName: "Maria Santos", details: "NFC-e autorizada com sucesso. Protocolo: 135260200000001", timestamp: "2026-02-09T08:30:15", severity: "success" },
  { id: "2", action: "Emissão NFC-e", docType: "NFC-e", docNumber: "000002", userName: "Maria Santos", details: "NFC-e autorizada com identificação de consumidor", timestamp: "2026-02-09T09:15:30", severity: "success" },
  { id: "3", action: "Contingência Ativada", docType: "NFC-e", userName: "Sistema", details: "Contingência automática ativada: falha na comunicação com SEFAZ (timeout 30s)", timestamp: "2026-02-09T09:55:00", severity: "warning" },
  { id: "4", action: "Emissão Contingência", docType: "NFC-e", docNumber: "000003", userName: "Maria Santos", details: "NFC-e emitida em contingência offline. Pendente transmissão", timestamp: "2026-02-09T10:00:05", severity: "warning" },
  { id: "5", action: "Contingência Resolvida", docType: "NFC-e", userName: "Sistema", details: "Comunicação com SEFAZ restabelecida. 1 documento pendente de transmissão", timestamp: "2026-02-09T10:15:00", severity: "info" },
  { id: "6", action: "Emissão NF-e", docType: "NF-e", docNumber: "000001", userName: "Carlos Oliveira", details: "NF-e autorizada. Destinatário: Empresa ABC Ltda", timestamp: "2026-02-09T11:00:20", severity: "success" },
  { id: "7", action: "Rejeição NF-e", docType: "NF-e", docNumber: "000002", userName: "Carlos Oliveira", details: "Rejeição 539: Duplicidade de NF-e. Verificar numeração", timestamp: "2026-02-09T12:00:45", severity: "error" },
  { id: "8", action: "Emissão SAT", docType: "SAT", docNumber: "000001", userName: "Ana Lima", details: "CF-e SAT emitido com sucesso via equipamento SAT 900123456", timestamp: "2026-02-09T13:00:10", severity: "success" },
  { id: "9", action: "Certificado Verificado", docType: "Sistema", userName: "Sistema", details: "Certificado A1 verificado. Validade: 15/06/2027", timestamp: "2026-02-09T06:00:00", severity: "info" },
  { id: "10", action: "Config Atualizada", docType: "Sistema", userName: "Carlos Oliveira", details: "CSC do NFC-e atualizado. Ambiente: Homologação", timestamp: "2026-02-08T18:00:00", severity: "info" },
];

const severityConfig = {
  info: { icon: Eye, className: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  success: { icon: CheckCircle, className: "bg-success/10 text-success", dot: "bg-success" },
  warning: { icon: AlertTriangle, className: "bg-warning/10 text-warning", dot: "bg-warning" },
  error: { icon: XCircle, className: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
};

const actionIcons: Record<string, React.ElementType> = {
  "Emissão NFC-e": Send,
  "Emissão NF-e": Send,
  "Emissão SAT": Send,
  "Emissão Contingência": AlertTriangle,
  "Rejeição NF-e": XCircle,
  "Contingência Ativada": AlertTriangle,
  "Contingência Resolvida": CheckCircle,
  "Certificado Verificado": Shield,
  "Config Atualizada": Settings,
};

export default function AuditLogs() {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Logs de Auditoria</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Histórico completo de operações fiscais
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

        {mockAudit.map((entry, i) => {
          const sev = severityConfig[entry.severity];
          const ActionIcon = actionIcons[entry.action] || FileText;

          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative flex gap-4 pb-6 last:pb-0"
            >
              {/* Timeline dot */}
              <div className="relative z-10 flex-shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${sev.className}`}>
                  <ActionIcon className="w-4 h-4" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 bg-card rounded-xl border border-border p-4 card-shadow">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{entry.action}</span>
                    {entry.docNumber && (
                      <span className="text-xs font-mono text-muted-foreground">#{entry.docNumber}</span>
                    )}
                    <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                      {entry.docType}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {new Date(entry.timestamp).toLocaleString("pt-BR")}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{entry.details}</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <User className="w-3 h-3" />
                  {entry.userName}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

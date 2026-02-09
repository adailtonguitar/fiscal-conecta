import { useState } from "react";
import {
  FileText,
  Search,
  Filter,
  Send,
  XCircle,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Ban,
  RotateCcw,
} from "lucide-react";
import { formatCurrency } from "@/lib/mock-data";
import { motion } from "framer-motion";

type DocType = "nfce" | "nfe" | "sat";
type DocStatus = "pendente" | "autorizada" | "cancelada" | "rejeitada" | "contingencia" | "inutilizada";

interface MockFiscalDoc {
  id: string;
  type: DocType;
  number: number;
  serie: number;
  accessKey: string;
  status: DocStatus;
  total: number;
  customerName?: string;
  customerDoc?: string;
  paymentMethod: string;
  date: string;
  isContingency: boolean;
  environment: "homologacao" | "producao";
}

const mockDocs: MockFiscalDoc[] = [
  { id: "1", type: "nfce", number: 1, serie: 1, accessKey: "35260200000000000100650010000000011000000015", status: "autorizada", total: 125.90, paymentMethod: "PIX", date: "2026-02-09T08:30:00", isContingency: false, environment: "homologacao" },
  { id: "2", type: "nfce", number: 2, serie: 1, accessKey: "35260200000000000100650010000000021000000029", status: "autorizada", total: 45.50, customerName: "João Silva", customerDoc: "123.456.789-00", paymentMethod: "Cartão Débito", date: "2026-02-09T09:15:00", isContingency: false, environment: "homologacao" },
  { id: "3", type: "nfce", number: 3, serie: 1, accessKey: "35260200000000000100650010000000031000000033", status: "contingencia", total: 89.90, paymentMethod: "Dinheiro", date: "2026-02-09T10:00:00", isContingency: true, environment: "homologacao" },
  { id: "4", type: "nfe", number: 1, serie: 1, accessKey: "35260200000000000100550010000000011000000012", status: "autorizada", total: 2500.00, customerName: "Empresa ABC Ltda", customerDoc: "12.345.678/0001-90", paymentMethod: "Boleto", date: "2026-02-09T11:00:00", isContingency: false, environment: "homologacao" },
  { id: "5", type: "nfe", number: 2, serie: 1, accessKey: "35260200000000000100550010000000021000000026", status: "rejeitada", total: 1800.00, customerName: "Comércio XYZ", customerDoc: "98.765.432/0001-10", paymentMethod: "Transferência", date: "2026-02-09T12:00:00", isContingency: false, environment: "homologacao" },
  { id: "6", type: "sat", number: 1, serie: 1, accessKey: "CFe35260200000000000100590010000000011000000017", status: "autorizada", total: 67.40, paymentMethod: "Cartão Crédito", date: "2026-02-09T13:00:00", isContingency: false, environment: "producao" },
];

const statusConfig: Record<DocStatus, { icon: React.ElementType; label: string; className: string }> = {
  pendente: { icon: Clock, label: "Pendente", className: "bg-muted text-muted-foreground" },
  autorizada: { icon: CheckCircle, label: "Autorizada", className: "bg-success/10 text-success" },
  cancelada: { icon: XCircle, label: "Cancelada", className: "bg-destructive/10 text-destructive" },
  rejeitada: { icon: Ban, label: "Rejeitada", className: "bg-destructive/10 text-destructive" },
  contingencia: { icon: AlertTriangle, label: "Contingência", className: "bg-warning/10 text-warning" },
  inutilizada: { icon: RotateCcw, label: "Inutilizada", className: "bg-muted text-muted-foreground" },
};

const typeLabels: Record<DocType, string> = { nfce: "NFC-e", nfe: "NF-e", sat: "SAT" };

export default function Fiscal() {
  const [selectedType, setSelectedType] = useState<DocType | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<MockFiscalDoc | null>(null);

  const filtered = mockDocs.filter((doc) => {
    const matchType = selectedType === "all" || doc.type === selectedType;
    const matchSearch =
      String(doc.number).includes(search) ||
      doc.accessKey.includes(search) ||
      (doc.customerName?.toLowerCase().includes(search.toLowerCase()) ?? false);
    return matchType && matchSearch;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documentos Fiscais</h1>
          <p className="text-sm text-muted-foreground mt-1">NFC-e, NF-e e SAT</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all">
            <Send className="w-4 h-4" />
            Emitir NFC-e
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por número, chave ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "nfce", "nfe", "sat"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                selectedType === type
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {type === "all" ? "Todos" : typeLabels[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Autorizadas", count: mockDocs.filter((d) => d.status === "autorizada").length, className: "text-success" },
          { label: "Pendentes", count: mockDocs.filter((d) => d.status === "pendente").length, className: "text-muted-foreground" },
          { label: "Contingência", count: mockDocs.filter((d) => d.status === "contingencia").length, className: "text-warning" },
          { label: "Rejeitadas", count: mockDocs.filter((d) => d.status === "rejeitada").length, className: "text-destructive" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4 card-shadow">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold font-mono mt-1 ${s.className}`}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* Documents list */}
      <div className="space-y-2">
        {filtered.map((doc, i) => {
          const st = statusConfig[doc.status];
          return (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-xl card-shadow border border-border p-4 hover:border-primary/30 transition-all cursor-pointer"
              onClick={() => setSelectedDoc(doc)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                    <FileText className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                        {typeLabels[doc.type]}
                      </span>
                      <span className="font-semibold text-foreground font-mono">
                        #{String(doc.number).padStart(6, "0")}
                      </span>
                      <span className="text-xs text-muted-foreground">Série {doc.serie}</span>
                      {doc.isContingency && (
                        <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate max-w-[300px]">
                      {doc.accessKey}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    {doc.customerName && (
                      <p className="text-sm text-foreground">{doc.customerName}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(doc.date).toLocaleString("pt-BR")} • {doc.paymentMethod}
                    </p>
                  </div>
                  <span className="text-lg font-bold font-mono text-primary">
                    {formatCurrency(doc.total)}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${st.className}`}>
                    <st.icon className="w-3 h-3" />
                    {st.label}
                  </span>
                  <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Detail modal */}
      {selectedDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm"
          onClick={() => setSelectedDoc(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl border border-border card-shadow w-full max-w-lg mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">
                {typeLabels[selectedDoc.type]} #{String(selectedDoc.number).padStart(6, "0")}
              </h3>
              <button onClick={() => setSelectedDoc(null)} className="p-1 rounded text-muted-foreground hover:text-foreground">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[selectedDoc.status].className}`}>
                  {statusConfig[selectedDoc.status].label}
                </span>
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">Ambiente</span><span className="text-foreground capitalize">{selectedDoc.environment}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Valor Total</span><span className="font-mono font-semibold text-primary">{formatCurrency(selectedDoc.total)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Pagamento</span><span className="text-foreground">{selectedDoc.paymentMethod}</span></div>
              {selectedDoc.customerName && (
                <div className="flex justify-between"><span className="text-muted-foreground">Cliente</span><span className="text-foreground">{selectedDoc.customerName}</span></div>
              )}
              {selectedDoc.customerDoc && (
                <div className="flex justify-between"><span className="text-muted-foreground">CPF/CNPJ</span><span className="font-mono text-foreground">{selectedDoc.customerDoc}</span></div>
              )}
              <div>
                <span className="text-muted-foreground block mb-1">Chave de Acesso</span>
                <code className="text-xs font-mono bg-muted p-2 rounded-lg block break-all text-foreground">{selectedDoc.accessKey}</code>
              </div>
              {selectedDoc.isContingency && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 text-warning text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  Documento emitido em contingência
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:opacity-90 transition-all">
                Imprimir DANFE
              </button>
              {selectedDoc.status === "autorizada" && (
                <button className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-all">
                  Cancelar
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

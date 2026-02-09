import { DollarSign, Lock, Unlock, Calendar, Eye } from "lucide-react";
import { formatCurrency } from "@/lib/mock-data";
import { motion } from "framer-motion";

interface MockCashSession {
  id: string;
  terminal: string;
  openedBy: string;
  closedBy?: string;
  status: "aberto" | "fechado";
  openingBalance: number;
  totalVendas: number;
  salesCount: number;
  totalDinheiro: number;
  totalDebito: number;
  totalCredito: number;
  totalPix: number;
  totalSangria: number;
  totalSuprimento: number;
  difference: number;
  openedAt: string;
  closedAt?: string;
}

const mockSessions: MockCashSession[] = [
  {
    id: "1", terminal: "Caixa 01", openedBy: "Maria Santos", closedBy: "Maria Santos",
    status: "fechado", openingBalance: 200, totalVendas: 1400.80, salesCount: 12,
    totalDinheiro: 345.50, totalDebito: 289.90, totalCredito: 567.00, totalPix: 198.40,
    totalSangria: 200, totalSuprimento: 100, difference: -2.30,
    openedAt: "2026-02-09T07:00:00", closedAt: "2026-02-09T18:00:00",
  },
  {
    id: "2", terminal: "Caixa 02", openedBy: "João Silva",
    status: "aberto", openingBalance: 150, totalVendas: 680.50, salesCount: 8,
    totalDinheiro: 180.00, totalDebito: 220.50, totalCredito: 180.00, totalPix: 100.00,
    totalSangria: 0, totalSuprimento: 0, difference: 0,
    openedAt: "2026-02-09T08:00:00",
  },
  {
    id: "3", terminal: "Caixa 01", openedBy: "Ana Lima", closedBy: "Ana Lima",
    status: "fechado", openingBalance: 200, totalVendas: 2100.30, salesCount: 18,
    totalDinheiro: 520.30, totalDebito: 680.00, totalCredito: 600.00, totalPix: 300.00,
    totalSangria: 300, totalSuprimento: 0, difference: 0,
    openedAt: "2026-02-08T07:00:00", closedAt: "2026-02-08T18:00:00",
  },
];

export default function Caixa() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sessões de Caixa</h1>
        <p className="text-sm text-muted-foreground mt-1">Histórico de abertura e fechamento</p>
      </div>

      <div className="space-y-3">
        {mockSessions.map((session, i) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-card rounded-xl card-shadow border border-border overflow-hidden"
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    session.status === "aberto" ? "bg-success/10" : "bg-muted"
                  }`}>
                    {session.status === "aberto" ? (
                      <Unlock className="w-5 h-5 text-success" />
                    ) : (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{session.terminal}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        session.status === "aberto"
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {session.status === "aberto" ? "Aberto" : "Fechado"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(session.openedAt).toLocaleString("pt-BR")}
                      {session.closedAt && ` — ${new Date(session.closedAt).toLocaleTimeString("pt-BR")}`}
                    </div>
                  </div>
                </div>
                <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Vendas</p>
                  <p className="text-base font-bold font-mono text-primary">{formatCurrency(session.totalVendas)}</p>
                  <p className="text-[10px] text-muted-foreground">{session.salesCount} vendas</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Dinheiro</p>
                  <p className="text-base font-bold font-mono text-foreground">{formatCurrency(session.totalDinheiro)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Cartões</p>
                  <p className="text-base font-bold font-mono text-foreground">{formatCurrency(session.totalDebito + session.totalCredito)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">PIX</p>
                  <p className="text-base font-bold font-mono text-foreground">{formatCurrency(session.totalPix)}</p>
                </div>
              </div>

              {session.status === "fechado" && (
                <div className="mt-3 flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Operador: {session.openedBy}</span>
                    <span>Sangria: {formatCurrency(session.totalSangria)}</span>
                    <span>Suprimento: {formatCurrency(session.totalSuprimento)}</span>
                  </div>
                  <span className={`text-sm font-mono font-semibold ${
                    Math.abs(session.difference) < 0.01 ? "text-success" : "text-destructive"
                  }`}>
                    Dif: {session.difference >= 0 ? "+" : ""}{formatCurrency(session.difference)}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

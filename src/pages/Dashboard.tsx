import { TrendingUp, ShoppingBag, DollarSign, AlertTriangle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatCurrency, recentSales } from "@/lib/mock-data";
import { motion } from "framer-motion";

const stats = [
  {
    title: "Vendas Hoje",
    value: formatCurrency(128.14),
    change: "+12%",
    up: true,
    icon: DollarSign,
  },
  {
    title: "Nº de Vendas",
    value: "4",
    change: "+2",
    up: true,
    icon: ShoppingBag,
  },
  {
    title: "Ticket Médio",
    value: formatCurrency(32.04),
    change: "-3%",
    up: false,
    icon: TrendingUp,
  },
  {
    title: "Pendentes Sync",
    value: "2",
    change: "",
    up: false,
    icon: AlertTriangle,
  },
];

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Resumo de vendas do dia</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-xl p-5 card-shadow border border-border"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{stat.title}</span>
              <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                <stat.icon className="w-4 h-4 text-accent-foreground" />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold font-mono text-foreground">{stat.value}</span>
              {stat.change && (
                <span
                  className={`flex items-center text-xs font-medium mb-1 ${
                    stat.up ? "text-success" : "text-destructive"
                  }`}
                >
                  {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.change}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent sales table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card rounded-xl card-shadow border border-border overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Últimas Vendas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Itens</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Pagamento</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Sync</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map((sale) => (
                <tr key={sale.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-5 py-3 font-mono text-foreground">{sale.id}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {sale.items.map((i) => i.name).join(", ")}
                  </td>
                  <td className="px-5 py-3 text-foreground">{sale.paymentMethod}</td>
                  <td className="px-5 py-3 text-right font-mono font-semibold text-primary">
                    {formatCurrency(sale.total)}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        sale.synced
                          ? "bg-success/10 text-success"
                          : "bg-warning/10 text-warning"
                      }`}
                    >
                      {sale.synced ? "Sincronizado" : "Pendente"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

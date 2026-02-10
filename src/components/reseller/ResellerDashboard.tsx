import { Building2, CreditCard, DollarSign, Users } from "lucide-react";
import { motion } from "framer-motion";
import type { ResellerPlan, ResellerLicense, ResellerCommission } from "@/hooks/useReseller";

interface Props {
  plans: ResellerPlan[];
  licenses: ResellerLicense[];
  commissions: ResellerCommission[];
}

export function ResellerDashboard({ plans, licenses, commissions }: Props) {
  const activeLicenses = licenses.filter((l) => l.status === "ativa").length;
  const trialLicenses = licenses.filter((l) => l.status === "trial").length;
  const totalRevenue = commissions.reduce((sum, c) => sum + c.markup_amount, 0);
  const pendingCommissions = commissions.filter((c) => c.status === "pendente").reduce((sum, c) => sum + c.markup_amount, 0);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const stats = [
    { icon: Building2, label: "Licenças Ativas", value: String(activeLicenses), color: "text-primary" },
    { icon: Users, label: "Em Trial", value: String(trialLicenses), color: "text-warning" },
    { icon: CreditCard, label: "Planos", value: String(plans.filter((p) => p.is_active).length), color: "text-accent-foreground" },
    { icon: DollarSign, label: "Receita Total", value: formatCurrency(totalRevenue), color: "text-success" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-xl card-shadow border border-border p-5"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-secondary">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-bold text-foreground font-mono">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent licenses */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-xl card-shadow border border-border overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Licenças Recentes</h2>
        </div>
        <div className="divide-y divide-border">
          {licenses.slice(0, 5).map((license) => (
            <div key={license.id} className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{(license as any).client_name || license.company_id?.slice(0, 8) || "Sem nome"}...</p>
                <p className="text-xs text-muted-foreground">Desde {new Date(license.started_at).toLocaleDateString("pt-BR")}</p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                license.status === "ativa" ? "bg-green-100 text-green-700" :
                license.status === "trial" ? "bg-amber-100 text-amber-700" :
                license.status === "suspensa" ? "bg-red-100 text-red-700" :
                "bg-gray-100 text-gray-700"
              }`}>
                {license.status}
              </span>
            </div>
          ))}
          {licenses.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              Nenhuma licença ainda. Crie planos e atribua a empresas.
            </div>
          )}
        </div>
      </motion.div>

      {/* Pending commissions */}
      {pendingCommissions > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl card-shadow border border-border p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Comissões Pendentes</p>
              <p className="text-2xl font-bold text-primary font-mono mt-1">{formatCurrency(pendingCommissions)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-primary/30" />
          </div>
        </motion.div>
      )}
    </div>
  );
}

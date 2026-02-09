import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency } from "@/lib/mock-data";
import type { FinancialEntry } from "@/hooks/useFinancialEntries";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  entries: FinancialEntry[];
  month: string; // YYYY-MM
}

export function CashFlowChart({ entries, month }: Props) {
  const chartData = useMemo(() => {
    const start = startOfMonth(parseISO(`${month}-01`));
    const end = endOfMonth(start);
    const days = eachDayOfInterval({ start, end });

    return days.map((day) => {
      const dayEntries = entries.filter((e) => {
        const entryDate = e.paid_date || e.due_date;
        return isSameDay(parseISO(entryDate), day);
      });

      const receber = dayEntries
        .filter((e) => e.type === "receber")
        .reduce((s, e) => s + Number(e.paid_amount || e.amount), 0);

      const pagar = dayEntries
        .filter((e) => e.type === "pagar")
        .reduce((s, e) => s + Number(e.paid_amount || e.amount), 0);

      return {
        day: format(day, "dd"),
        receber,
        pagar,
        saldo: receber - pagar,
      };
    });
  }, [entries, month]);

  return (
    <div className="bg-card rounded-xl border border-border p-5 card-shadow">
      <h3 className="text-sm font-semibold text-foreground mb-4">Fluxo de Caixa — {format(parseISO(`${month}-01`), "MMMM yyyy", { locale: ptBR })}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="day" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
          <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Bar dataKey="receber" name="Recebimentos" fill="hsl(var(--success))" radius={[3, 3, 0, 0]} />
          <Bar dataKey="pagar" name="Pagamentos" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

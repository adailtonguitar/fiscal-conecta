/**
 * useLocalCash — local-first Cash sessions & movements hook.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DataLayer, getDB } from "@/lib/local-db";
import { useCompany } from "./useCompany";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface LocalCashSession {
  id: string;
  company_id: string;
  terminal_id: string;
  status: string;
  opening_balance: number;
  closing_balance: number | null;
  opened_by: string;
  opened_at: string;
  closed_by: string | null;
  closed_at: string | null;
  sales_count: number;
  total_dinheiro: number;
  total_debito: number;
  total_credito: number;
  total_pix: number;
  total_voucher: number;
  total_outros: number;
  total_vendas: number;
  total_sangria: number;
  total_suprimento: number;
  counted_dinheiro: number | null;
  counted_debito: number | null;
  counted_credito: number | null;
  counted_pix: number | null;
  difference: number | null;
  notes: string | null;
  created_at: string;
}

export interface LocalCashMovement {
  id: string;
  company_id: string;
  session_id: string;
  type: string;
  amount: number;
  payment_method: string | null;
  sale_id: string | null;
  performed_by: string;
  description: string | null;
  created_at: string;
  synced_at: string | null;
}

/** Get the current open cash session */
export function useLocalOpenSession() {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ["local-cash-session", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const result = await DataLayer.select<LocalCashSession>("cash_sessions", {
        where: { company_id: companyId, status: "aberto" },
        limit: 1,
      });
      if (result.error) throw new Error(result.error);
      return result.data.length > 0 ? result.data[0] : null;
    },
    enabled: !!companyId,
  });
}

/** Get movements for a session */
export function useLocalCashMovements(sessionId?: string) {
  return useQuery({
    queryKey: ["local-cash-movements", sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const result = await DataLayer.select<LocalCashMovement>("cash_movements", {
        where: { session_id: sessionId },
        orderBy: "created_at DESC",
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: !!sessionId,
  });
}

/** Open a new cash session */
export function useOpenLocalSession() {
  const qc = useQueryClient();
  const { companyId } = useCompany();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: { opening_balance: number; terminal_id?: string }) => {
      if (!companyId || !user) throw new Error("Contexto inválido");
      const result = await DataLayer.insert<LocalCashSession>("cash_sessions", {
        company_id: companyId,
        terminal_id: params.terminal_id || "01",
        status: "aberto",
        opening_balance: params.opening_balance,
        opened_by: user.id,
        opened_at: new Date().toISOString(),
        sales_count: 0,
        total_dinheiro: 0,
        total_debito: 0,
        total_credito: 0,
        total_pix: 0,
        total_voucher: 0,
        total_outros: 0,
        total_vendas: 0,
        total_sangria: 0,
        total_suprimento: 0,
      });
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["local-cash-session"] });
      toast.success("Caixa aberto");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

/** Register a cash movement (sangria, suprimento, venda) */
export function useRegisterLocalCashMovement() {
  const qc = useQueryClient();
  const { companyId } = useCompany();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      session_id: string;
      type: string;
      amount: number;
      payment_method?: string;
      sale_id?: string;
      description?: string;
    }) => {
      if (!companyId || !user) throw new Error("Contexto inválido");

      const result = await DataLayer.insert<LocalCashMovement>("cash_movements", {
        company_id: companyId,
        session_id: input.session_id,
        type: input.type,
        amount: input.amount,
        payment_method: input.payment_method ?? null,
        sale_id: input.sale_id ?? null,
        performed_by: user.id,
        description: input.description ?? null,
      });
      if (result.error) throw new Error(result.error);

      // Update session totals
      const db = await getDB();
      const fieldMap: Record<string, string> = {
        dinheiro: "total_dinheiro",
        debito: "total_debito",
        credito: "total_credito",
        pix: "total_pix",
        voucher: "total_voucher",
        outros: "total_outros",
      };

      if (input.type === "venda") {
        const payField = fieldMap[input.payment_method || "outros"] || "total_outros";
        await db.run(
          `UPDATE cash_sessions SET
            ${payField} = ${payField} + ?,
            total_vendas = total_vendas + ?,
            sales_count = sales_count + 1
          WHERE id = ?`,
          [input.amount, input.amount, input.session_id]
        );
      } else if (input.type === "sangria") {
        await db.run(
          `UPDATE cash_sessions SET total_sangria = total_sangria + ? WHERE id = ?`,
          [input.amount, input.session_id]
        );
      } else if (input.type === "suprimento") {
        await db.run(
          `UPDATE cash_sessions SET total_suprimento = total_suprimento + ? WHERE id = ?`,
          [input.amount, input.session_id]
        );
      }

      return result.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["local-cash-session"] });
      qc.invalidateQueries({ queryKey: ["local-cash-movements"] });
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

/** Close the current cash session */
export function useCloseLocalSession() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      session_id: string;
      closing_balance: number;
      counted_dinheiro?: number;
      counted_debito?: number;
      counted_credito?: number;
      counted_pix?: number;
      difference?: number;
      notes?: string;
      closed_by: string;
    }) => {
      const result = await DataLayer.update("cash_sessions", params.session_id, {
        status: "fechado",
        closing_balance: params.closing_balance,
        closed_by: params.closed_by,
        closed_at: new Date().toISOString(),
        counted_dinheiro: params.counted_dinheiro ?? null,
        counted_debito: params.counted_debito ?? null,
        counted_credito: params.counted_credito ?? null,
        counted_pix: params.counted_pix ?? null,
        difference: params.difference ?? null,
        notes: params.notes ?? null,
      });
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["local-cash-session"] });
      toast.success("Caixa fechado");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

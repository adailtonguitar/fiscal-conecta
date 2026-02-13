/**
 * CashSessionService — business logic for cash register sessions.
 */
import { supabase } from "@/integrations/supabase/client";

export class CashSessionService {
  /** Open a new cash session */
  static async open(params: {
    companyId: string;
    userId: string;
    openingBalance: number;
    terminalId?: string;
  }) {
    const terminalId = params.terminalId || "01";

    // Check if there's already an open session for this terminal
    const { data: existing } = await supabase
      .from("cash_sessions")
      .select("id")
      .eq("company_id", params.companyId)
      .eq("terminal_id", terminalId)
      .eq("status", "aberto")
      .maybeSingle();

    if (existing) {
      throw new Error(`Terminal ${terminalId} já possui um caixa aberto`);
    }

    const { data, error } = await supabase
      .from("cash_sessions")
      .insert({
        company_id: params.companyId,
        opened_by: params.userId,
        opening_balance: params.openingBalance,
        terminal_id: terminalId,
        status: "aberto",
      })
      .select()
      .single();

    if (error) throw new Error(`Erro ao abrir caixa: ${error.message}`);

    // Register opening movement
    await supabase.from("cash_movements").insert({
      company_id: params.companyId,
      session_id: data.id,
      type: "abertura",
      amount: params.openingBalance,
      performed_by: params.userId,
      description: "Abertura de caixa",
    });

    return data;
  }

  /** Close current session with counted values */
  static async close(params: {
    sessionId: string;
    companyId: string;
    userId: string;
    countedDinheiro: number;
    countedDebito: number;
    countedCredito: number;
    countedPix: number;
    notes?: string;
  }) {
    // Get session totals
    const { data: session, error: sErr } = await supabase
      .from("cash_sessions")
      .select("*")
      .eq("id", params.sessionId)
      .single();

    if (sErr) throw new Error(`Sessão não encontrada: ${sErr.message}`);

    const totalCounted = params.countedDinheiro + params.countedDebito + params.countedCredito + params.countedPix;
    const totalExpected =
      Number(session.opening_balance) +
      Number(session.total_dinheiro || 0) +
      Number(session.total_debito || 0) +
      Number(session.total_credito || 0) +
      Number(session.total_pix || 0) +
      Number(session.total_suprimento || 0) -
      Number(session.total_sangria || 0);

    const { data, error } = await supabase
      .from("cash_sessions")
      .update({
        status: "fechado",
        closed_by: params.userId,
        closed_at: new Date().toISOString(),
        closing_balance: totalCounted,
        counted_dinheiro: params.countedDinheiro,
        counted_debito: params.countedDebito,
        counted_credito: params.countedCredito,
        counted_pix: params.countedPix,
        difference: totalCounted - totalExpected,
        notes: params.notes,
      })
      .eq("id", params.sessionId)
      .select()
      .single();

    if (error) throw new Error(`Erro ao fechar caixa: ${error.message}`);

    // Register closing movement
    await supabase.from("cash_movements").insert({
      company_id: params.companyId,
      session_id: params.sessionId,
      type: "fechamento",
      amount: totalCounted,
      performed_by: params.userId,
      description: `Fechamento - Diferença: ${(totalCounted - totalExpected).toFixed(2)}`,
    });

    return data;
  }

  /** Register sangria or suprimento */
  static async registerMovement(params: {
    companyId: string;
    userId: string;
    sessionId: string;
    type: "sangria" | "suprimento";
    amount: number;
    description?: string;
  }) {
    const { data, error } = await supabase
      .from("cash_movements")
      .insert({
        company_id: params.companyId,
        session_id: params.sessionId,
        type: params.type,
        amount: params.amount,
        performed_by: params.userId,
        description: params.description,
      })
      .select()
      .single();

    if (error) throw new Error(`Erro na movimentação: ${error.message}`);

    // Update session totals
    const field = params.type === "sangria" ? "total_sangria" : "total_suprimento";
    const { data: session } = await supabase
      .from("cash_sessions")
      .select(field)
      .eq("id", params.sessionId)
      .single();

    if (session) {
      await supabase
        .from("cash_sessions")
        .update({ [field]: Number(session[field] || 0) + params.amount })
        .eq("id", params.sessionId);
    }

    return data;
  }

  /** Get the current open session for a company (optionally filtered by terminal) */
  static async getCurrentSession(companyId: string, terminalId?: string) {
    let query = supabase
      .from("cash_sessions")
      .select("*")
      .eq("company_id", companyId)
      .eq("status", "aberto");

    if (terminalId) {
      query = query.eq("terminal_id", terminalId);
    }

    const { data, error } = await query
      .order("opened_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  }
}

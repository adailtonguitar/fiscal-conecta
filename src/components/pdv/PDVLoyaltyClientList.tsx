import { useState, useEffect, useMemo } from "react";
import { Search, User, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";
import type { CreditClient } from "./PDVClientSelector";

interface Props {
  onSelect: (client: CreditClient) => void;
}

export function PDVLoyaltyClientList({ onSelect }: Props) {
  const { companyId } = useCompany();
  const [clients, setClients] = useState<(CreditClient & { loyalty_points?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    supabase
      .from("clients")
      .select("id, name, cpf_cnpj, phone, credit_limit, credit_balance, loyalty_points")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => {
        setClients((data as any[]) || []);
        setLoading(false);
      });
  }, [companyId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.cpf_cnpj && c.cpf_cnpj.includes(q)) ||
        (c.phone && c.phone.includes(q))
    );
  }, [clients, search]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-5 py-3 border-b border-border">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted border border-border">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente por nome, CPF/CNPJ, telefone..."
            autoFocus
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1 max-h-[50vh]">
        {loading ? (
          <p className="text-center text-sm text-muted-foreground py-8">Carregando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">Nenhum cliente encontrado</p>
        ) : (
          filtered.map((client) => (
            <button
              key={client.id}
              onClick={() => onSelect(client)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-all text-left"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{client.name}</p>
                <p className="text-xs text-muted-foreground">
                  {client.cpf_cnpj || "Sem documento"}
                  {client.phone && ` • ${client.phone}`}
                </p>
              </div>
              {(client.loyalty_points ?? 0) > 0 && (
                <div className="flex items-center gap-1 text-right flex-shrink-0">
                  <Star className="w-3 h-3 text-warning fill-warning" />
                  <span className="text-xs font-bold text-warning">{client.loyalty_points} pts</span>
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

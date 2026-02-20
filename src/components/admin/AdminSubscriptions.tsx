import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface SubRow {
  id: string;
  company_id: string;
  plan_key: string;
  status: string;
  current_period_end: string | null;
  company_name?: string;
}

export function AdminSubscriptions() {
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const [subsRes, compRes] = await Promise.all([
        supabase.from("subscriptions").select("id, company_id, plan_key, status, current_period_end"),
        supabase.from("companies").select("id, name").limit(500),
      ]);

      const compMap = new Map((compRes.data ?? []).map((c: any) => [c.id, c.name]));

      const rows = (subsRes.data ?? []).map((s: any) => ({
        ...s,
        company_name: compMap.get(s.company_id) || s.company_id?.slice(0, 8),
      }));

      setSubs(rows);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = search.trim()
    ? subs.filter(
        (s) =>
          s.company_name?.toLowerCase().includes(search.toLowerCase()) ||
          s.plan_key?.toLowerCase().includes(search.toLowerCase())
      )
    : subs;

  const statusBadge = (status: string) => {
    if (status === "active") return <Badge className="bg-green-600">Ativa</Badge>;
    if (status === "canceled") return <Badge variant="destructive">Cancelada</Badge>;
    if (status === "past_due") return <Badge className="bg-amber-600">Atrasada</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  const planLabel = (key: string) => {
    const map: Record<string, string> = {
      free: "Grátis",
      starter: "Starter",
      professional: "Profissional",
      enterprise: "Enterprise",
    };
    return map[key] || key;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Assinaturas ({filtered.length})</span>
          <div className="flex gap-2">
            <Input
              placeholder="Buscar empresa ou plano..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <Button variant="outline" size="sm" disabled>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">Nenhuma assinatura encontrada.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Válida até</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.company_name}</TableCell>
                  <TableCell>{planLabel(s.plan_key)}</TableCell>
                  <TableCell>{statusBadge(s.status)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {s.current_period_end
                      ? new Date(s.current_period_end).toLocaleDateString("pt-BR")
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

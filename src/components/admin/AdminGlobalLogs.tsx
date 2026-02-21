import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface LogRow {
  id: string;
  user_name: string | null;
  action: string;
  module: string;
  details: string | null;
  created_at: string;
  company_id: string;
  company_name?: string;
}

export function AdminGlobalLogs() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const [logsRes, compRes] = await Promise.all([
        supabase
          .from("action_logs")
          .select("id, user_name, action, module, details, created_at, company_id")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase.from("companies").select("id, name").limit(500),
      ]);

      const compMap = new Map((compRes.data ?? []).map((c: any) => [c.id, c.name]));

      const rows = (logsRes.data ?? []).map((l: any) => ({
        ...l,
        company_name: compMap.get(l.company_id) || l.company_id?.slice(0, 8),
      }));

      setLogs(rows);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = search.trim()
    ? logs.filter(
        (l) =>
          l.action.toLowerCase().includes(search.toLowerCase()) ||
          l.module.toLowerCase().includes(search.toLowerCase()) ||
          l.company_name?.toLowerCase().includes(search.toLowerCase()) ||
          l.user_name?.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  const moduleColor: Record<string, string> = {
    vendas: "bg-blue-100 text-blue-800",
    estoque: "bg-amber-100 text-amber-800",
    fiscal: "bg-purple-100 text-purple-800",
    financeiro: "bg-green-100 text-green-800",
    cadastro: "bg-gray-100 text-gray-800",
  };

  return (
    <Card>
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="flex flex-col gap-2">
          <span className="text-base sm:text-lg">Logs de Atividade Global ({filtered.length})</span>
          <Input
            placeholder="Buscar ação, módulo, empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-72 text-sm"
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">Nenhum log encontrado.</p>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-3 sm:hidden">
              {filtered.map((l) => (
                <div key={l.id} className="border rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString("pt-BR")}</span>
                    <Badge variant="secondary" className={moduleColor[l.module] || ""}>{l.module}</Badge>
                  </div>
                  <p className="text-sm font-medium">{l.action}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="truncate">{l.company_name}</span>
                    <span className="shrink-0 ml-2">{l.user_name || "—"}</span>
                  </div>
                  {l.details && (
                    <p className="text-xs text-muted-foreground truncate">{l.details}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(l.created_at).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-sm font-medium">{l.company_name}</TableCell>
                      <TableCell className="text-sm">{l.user_name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={moduleColor[l.module] || ""}>{l.module}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{l.action}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{l.details || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

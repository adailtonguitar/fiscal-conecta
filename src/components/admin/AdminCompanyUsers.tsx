import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserRow {
  id: string;
  user_id: string;
  company_id: string;
  role: string;
  is_active: boolean;
  company_name: string;
  full_name: string;
  email: string;
}

export function AdminCompanyUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("all");

  useEffect(() => {
    const fetch = async () => {
      const [cuRes, compRes, profRes] = await Promise.all([
        supabase.from("company_users").select("id, user_id, company_id, role, is_active"),
        supabase.from("companies").select("id, name").order("name").limit(500),
        supabase.from("profiles").select("id, full_name, email").limit(1000),
      ]);

      const compMap = new Map((compRes.data ?? []).map((c: any) => [c.id, c.name]));
      const profMap = new Map((profRes.data ?? []).map((p: any) => [p.id, p]));

      const rows = (cuRes.data ?? []).map((cu: any) => {
        const prof = profMap.get(cu.user_id);
        return {
          ...cu,
          company_name: compMap.get(cu.company_id) || cu.company_id.slice(0, 8),
          full_name: prof?.full_name || "—",
          email: prof?.email || "—",
        };
      });

      setUsers(rows);
      setCompanies(compRes.data ?? []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = users.filter((u) => {
    const matchSearch =
      !search.trim() ||
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchCompany = selectedCompany === "all" || u.company_id === selectedCompany;
    return matchSearch && matchCompany;
  });

  const roleLabel: Record<string, string> = {
    admin: "Admin",
    gerente: "Gerente",
    supervisor: "Supervisor",
    caixa: "Caixa",
  };

  return (
    <Card>
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="flex flex-col gap-2">
          <span className="text-base sm:text-lg">Usuários por Empresa ({filtered.length})</span>
          <div className="flex gap-2 flex-wrap">
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger className="w-full sm:w-48 text-sm">
                <SelectValue placeholder="Todas empresas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas empresas</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Buscar nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-56 text-sm"
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-3 sm:hidden">
              {filtered.map((u) => (
                <div key={u.id} className="border rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate">{u.full_name}</p>
                    {u.is_active ? (
                      <Badge variant="outline" className="text-green-600 border-green-600 shrink-0 ml-2">Ativo</Badge>
                    ) : (
                      <Badge variant="destructive" className="shrink-0 ml-2">Inativo</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground truncate">{u.company_name}</span>
                    <Badge variant="outline" className="shrink-0 ml-2">{roleLabel[u.role] || u.role}</Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                      <TableCell className="text-sm">{u.company_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{roleLabel[u.role] || u.role}</Badge>
                      </TableCell>
                      <TableCell>
                        {u.is_active ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">Ativo</Badge>
                        ) : (
                          <Badge variant="destructive">Inativo</Badge>
                        )}
                      </TableCell>
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

import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Shield, Activity, Search, Ban, CheckCircle, LayoutDashboard, Users, CreditCard, FileText } from "lucide-react";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminSubscriptions } from "@/components/admin/AdminSubscriptions";
import { AdminCompanyUsers } from "@/components/admin/AdminCompanyUsers";
import { AdminGlobalLogs } from "@/components/admin/AdminGlobalLogs";

interface CompanyRow {
  id: string;
  name: string;
  cnpj: string;
  is_blocked: boolean;
  block_reason: string | null;
  created_at: string;
}

interface TelemetryRow {
  id: string;
  company_id: string;
  period_date: string;
  sales_count: number;
  sales_total: number;
  nfce_count: number;
  nfe_count: number;
  products_count: number;
  clients_count: number;
}

export default function Admin() {
  const { isSuperAdmin, loading: roleLoading } = useAdminRole();
  const { loading: authLoading } = useAuth();

  if (authLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <Shield className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold">Painel Administrativo</h1>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="flex-wrap">
          <TabsTrigger value="dashboard"><LayoutDashboard className="h-4 w-4 mr-1" /> Resumo</TabsTrigger>
          <TabsTrigger value="companies"><Ban className="h-4 w-4 mr-1" /> Empresas</TabsTrigger>
          <TabsTrigger value="subscriptions"><CreditCard className="h-4 w-4 mr-1" /> Assinaturas</TabsTrigger>
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-1" /> Usuários</TabsTrigger>
          <TabsTrigger value="logs"><FileText className="h-4 w-4 mr-1" /> Logs</TabsTrigger>
          <TabsTrigger value="telemetry"><Activity className="h-4 w-4 mr-1" /> Telemetria</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <AdminDashboard />
        </TabsContent>
        <TabsContent value="companies">
          <CompaniesTab />
        </TabsContent>
        <TabsContent value="subscriptions">
          <AdminSubscriptions />
        </TabsContent>
        <TabsContent value="users">
          <AdminCompanyUsers />
        </TabsContent>
        <TabsContent value="logs">
          <AdminGlobalLogs />
        </TabsContent>
        <TabsContent value="telemetry">
          <TelemetryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CompaniesTab() {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [blockReasons, setBlockReasons] = useState<Record<string, string>>({});

  const fetchCompanies = async () => {
    setLoading(true);
    let query = supabase.from("companies").select("id, name, cnpj, is_blocked, block_reason, created_at").order("name");
    if (search.trim()) {
      query = query.or(`name.ilike.%${search}%,cnpj.ilike.%${search}%`);
    }
    const { data } = await query.limit(100);
    setCompanies(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchCompanies(); }, []);

  const toggleBlock = async (company: CompanyRow) => {
    const newBlocked = !company.is_blocked;
    const reason = newBlocked ? (blockReasons[company.id] || "Bloqueado pelo administrador.") : null;

    const { error } = await supabase
      .from("companies")
      .update({ is_blocked: newBlocked, block_reason: reason })
      .eq("id", company.id);

    if (error) {
      toast.error("Erro ao atualizar: " + error.message);
      return;
    }

    toast.success(newBlocked ? `${company.name} bloqueada` : `${company.name} desbloqueada`);
    fetchCompanies();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Empresas ({companies.length})</span>
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por nome ou CNPJ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <Button variant="outline" size="sm" onClick={fetchCompanies}>
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
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Motivo bloqueio</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{c.cnpj}</TableCell>
                  <TableCell>
                    {c.is_blocked ? (
                      <Badge variant="destructive">Bloqueada</Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" /> Ativa
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {!c.is_blocked ? (
                      <Textarea
                        placeholder="Motivo do bloqueio..."
                        value={blockReasons[c.id] || ""}
                        onChange={(e) => setBlockReasons((prev) => ({ ...prev, [c.id]: e.target.value }))}
                        className="h-9 min-h-0 text-xs resize-none"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">{c.block_reason}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs text-muted-foreground">{c.is_blocked ? "Bloqueada" : "Ativa"}</span>
                      <Switch checked={c.is_blocked} onCheckedChange={() => toggleBlock(c)} />
                    </div>
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

function TelemetryTab() {
  const [telemetry, setTelemetry] = useState<TelemetryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyMap, setCompanyMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetch = async () => {
      const [telResult, compResult] = await Promise.all([
        supabase.from("telemetry").select("*").order("period_date", { ascending: false }).limit(200),
        supabase.from("companies").select("id, name").limit(500),
      ]);
      setTelemetry((telResult.data as TelemetryRow[]) ?? []);
      const map: Record<string, string> = {};
      (compResult.data ?? []).forEach((c: any) => { map[c.id] = c.name; });
      setCompanyMap(map);
      setLoading(false);
    };
    fetch();
  }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Telemetria de Uso</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : telemetry.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">Nenhum dado de telemetria disponível.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Vendas</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">NFC-e</TableHead>
                <TableHead className="text-right">NF-e</TableHead>
                <TableHead className="text-right">Produtos</TableHead>
                <TableHead className="text-right">Clientes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {telemetry.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium text-sm">{companyMap[t.company_id] || t.company_id.slice(0, 8)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{t.period_date}</TableCell>
                  <TableCell className="text-right">{t.sales_count}</TableCell>
                  <TableCell className="text-right">{fmt(t.sales_total)}</TableCell>
                  <TableCell className="text-right">{t.nfce_count}</TableCell>
                  <TableCell className="text-right">{t.nfe_count}</TableCell>
                  <TableCell className="text-right">{t.products_count}</TableCell>
                  <TableCell className="text-right">{t.clients_count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

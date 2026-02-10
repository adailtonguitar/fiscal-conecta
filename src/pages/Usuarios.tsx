import { useState } from "react";
import { motion } from "framer-motion";
import { InviteUserDialog } from "@/components/users/InviteUserDialog";
import {
  Users,
  Shield,
  Clock,
  UserCheck,
  UserX,
  ChevronDown,
  Eye,
  PenLine,
  Plus,
  Trash2,
  Search,
} from "lucide-react";
import { useCompanyUsers, type CompanyUser } from "@/hooks/useCompanyUsers";
import { usePermissions } from "@/hooks/usePermissions";
import { useActionLogs, type ActionLog } from "@/hooks/useActionLogs";
import type { Database } from "@/integrations/supabase/types";

type CompanyRole = Database["public"]["Enums"]["company_role"];

const roleLabels: Record<CompanyRole, string> = {
  admin: "Administrador",
  gerente: "Gerente",
  supervisor: "Supervisor",
  caixa: "Caixa",
};

const roleColors: Record<CompanyRole, string> = {
  admin: "bg-destructive/10 text-destructive",
  gerente: "bg-primary/10 text-primary",
  supervisor: "bg-warning/10 text-warning",
  caixa: "bg-muted text-muted-foreground",
};

const moduleLabels: Record<string, string> = {
  pdv: "PDV",
  dashboard: "Dashboard",
  produtos: "Produtos",
  vendas: "Vendas",
  caixa: "Caixa",
  financeiro: "Financeiro",
  fiscal: "Fiscal",
  configuracoes: "Configurações",
  usuarios: "Usuários",
};

export default function Usuarios() {
  const { users, isLoading, updateRole, toggleActive } = useCompanyUsers();
  const { canEdit } = usePermissions();
  const { logs, isLoading: logsLoading } = useActionLogs();
  const [tab, setTab] = useState<"users" | "permissions" | "logs">("users");
  const [searchLogs, setSearchLogs] = useState("");
  const [showInvite, setShowInvite] = useState(false);

  const canManage = canEdit("usuarios");

  const filteredLogs = logs.filter(
    (l) =>
      !searchLogs ||
      l.action.toLowerCase().includes(searchLogs.toLowerCase()) ||
      l.module.toLowerCase().includes(searchLogs.toLowerCase()) ||
      (l.user_name || "").toLowerCase().includes(searchLogs.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Controle de Usuários</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie perfis, permissões e visualize logs de ações
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" />
            Convidar Usuário
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-xl p-1 w-fit">
        {[
          { key: "users" as const, label: "Usuários", icon: Users },
          { key: "permissions" as const, label: "Permissões", icon: Shield },
          { key: "logs" as const, label: "Logs", icon: Clock },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <UsersTab
          users={users}
          isLoading={isLoading}
          canManage={canManage}
          updateRole={updateRole}
          toggleActive={toggleActive}
        />
      )}

      {tab === "permissions" && <PermissionsTab />}

      {tab === "logs" && (
        <LogsTab
          logs={filteredLogs}
          isLoading={logsLoading}
          search={searchLogs}
          onSearchChange={setSearchLogs}
        />
      )}

      <InviteUserDialog open={showInvite} onOpenChange={setShowInvite} />
    </div>
  );
}

function UsersTab({
  users,
  isLoading,
  canManage,
  updateRole,
  toggleActive,
}: {
  users: CompanyUser[];
  isLoading: boolean;
  canManage: boolean;
  updateRole: (id: string, role: CompanyRole) => Promise<void>;
  toggleActive: (id: string, isActive: boolean) => Promise<void>;
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Nenhum usuário encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {users.map((u, i) => (
        <motion.div
          key={u.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-card rounded-xl border border-border p-4 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-primary">
              {(u.profile?.full_name || u.profile?.email || "?")[0].toUpperCase()}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {u.profile?.full_name || "Sem nome"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {u.profile?.email || u.user_id}
            </p>
          </div>

          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleColors[u.role]}`}>
            {roleLabels[u.role]}
          </span>

          {canManage && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={u.role}
                  onChange={(e) => updateRole(u.id, e.target.value as CompanyRole)}
                  className="appearance-none bg-background border border-border rounded-lg pl-3 pr-7 py-1.5 text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="admin">Admin</option>
                  <option value="gerente">Gerente</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="caixa">Caixa</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
              </div>

              <button
                onClick={() => toggleActive(u.id, u.is_active)}
                className={`p-1.5 rounded-lg transition-colors ${
                  u.is_active
                    ? "text-success hover:bg-success/10"
                    : "text-destructive hover:bg-destructive/10"
                }`}
                title={u.is_active ? "Desativar" : "Ativar"}
              >
                {u.is_active ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
              </button>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function PermissionsTab() {
  const modules = Object.keys(moduleLabels);
  const roles: CompanyRole[] = ["admin", "gerente", "supervisor", "caixa"];
  const actions = [
    { key: "can_view", icon: Eye, label: "Ver" },
    { key: "can_create", icon: Plus, label: "Criar" },
    { key: "can_edit", icon: PenLine, label: "Editar" },
    { key: "can_delete", icon: Trash2, label: "Excluir" },
  ];

  // Use static data matching the seeded permissions
  const permData: Record<string, Record<string, Record<string, boolean>>> = {
    admin: Object.fromEntries(modules.map((m) => [m, { can_view: true, can_create: true, can_edit: true, can_delete: true }])),
    gerente: {
      pdv: { can_view: true, can_create: true, can_edit: true, can_delete: false },
      dashboard: { can_view: true, can_create: true, can_edit: true, can_delete: false },
      produtos: { can_view: true, can_create: true, can_edit: true, can_delete: false },
      vendas: { can_view: true, can_create: true, can_edit: false, can_delete: false },
      caixa: { can_view: true, can_create: true, can_edit: true, can_delete: false },
      financeiro: { can_view: true, can_create: true, can_edit: true, can_delete: false },
      fiscal: { can_view: true, can_create: true, can_edit: false, can_delete: false },
      configuracoes: { can_view: true, can_create: false, can_edit: false, can_delete: false },
      usuarios: { can_view: true, can_create: true, can_edit: false, can_delete: false },
    },
    supervisor: {
      pdv: { can_view: true, can_create: true, can_edit: true, can_delete: false },
      dashboard: { can_view: true, can_create: false, can_edit: false, can_delete: false },
      produtos: { can_view: true, can_create: true, can_edit: true, can_delete: false },
      vendas: { can_view: true, can_create: true, can_edit: false, can_delete: false },
      caixa: { can_view: true, can_create: true, can_edit: true, can_delete: false },
      financeiro: { can_view: true, can_create: false, can_edit: false, can_delete: false },
      fiscal: { can_view: true, can_create: false, can_edit: false, can_delete: false },
      configuracoes: { can_view: false, can_create: false, can_edit: false, can_delete: false },
      usuarios: { can_view: false, can_create: false, can_edit: false, can_delete: false },
    },
    caixa: {
      pdv: { can_view: true, can_create: true, can_edit: false, can_delete: false },
      dashboard: { can_view: false, can_create: false, can_edit: false, can_delete: false },
      produtos: { can_view: true, can_create: false, can_edit: false, can_delete: false },
      vendas: { can_view: true, can_create: false, can_edit: false, can_delete: false },
      caixa: { can_view: true, can_create: true, can_edit: false, can_delete: false },
      financeiro: { can_view: false, can_create: false, can_edit: false, can_delete: false },
      fiscal: { can_view: false, can_create: false, can_edit: false, can_delete: false },
      configuracoes: { can_view: false, can_create: false, can_edit: false, can_delete: false },
      usuarios: { can_view: false, can_create: false, can_edit: false, can_delete: false },
    },
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left p-3 font-medium text-muted-foreground">Módulo</th>
              {roles.map((r) => (
                <th key={r} colSpan={4} className="text-center p-3 font-medium text-foreground">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${roleColors[r]}`}>
                    {roleLabels[r]}
                  </span>
                </th>
              ))}
            </tr>
            <tr className="border-b border-border bg-muted/10">
              <th />
              {roles.map((r) =>
                actions.map((a) => (
                  <th key={`${r}-${a.key}`} className="p-2 text-center">
                    <a.icon className="w-3.5 h-3.5 mx-auto text-muted-foreground" />
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {modules.map((mod) => (
              <tr key={mod} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="p-3 font-medium text-foreground">{moduleLabels[mod]}</td>
                {roles.map((r) =>
                  actions.map((a) => {
                    const has = permData[r]?.[mod]?.[a.key] ?? false;
                    return (
                      <td key={`${r}-${mod}-${a.key}`} className="p-2 text-center">
                        <span
                          className={`inline-block w-5 h-5 rounded-full text-xs leading-5 ${
                            has
                              ? "bg-success/20 text-success"
                              : "bg-muted text-muted-foreground/40"
                          }`}
                        >
                          {has ? "✓" : "—"}
                        </span>
                      </td>
                    );
                  })
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LogsTab({
  logs,
  isLoading,
  search,
  onSearchChange,
}: {
  logs: ActionLog[];
  isLoading: boolean;
  search: string;
  onSearchChange: (v: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar logs..."
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum log de ação registrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="bg-card rounded-xl border border-border p-3 flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">{log.action}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                    {log.module}
                  </span>
                </div>
                {log.details && (
                  <p className="text-xs text-muted-foreground mt-0.5">{log.details}</p>
                )}
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{log.user_name || "Usuário"}</span>
                  <span>{new Date(log.created_at).toLocaleString("pt-BR")}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

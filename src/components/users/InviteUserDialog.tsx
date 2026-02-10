import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";
import { toast } from "sonner";
import { Loader2, UserPlus, Mail, User, Phone } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";

type CompanyRole = Database["public"]["Enums"]["company_role"];

const roleOptions: { value: CompanyRole; label: string }[] = [
  { value: "admin", label: "Administrador" },
  { value: "gerente", label: "Gerente" },
  { value: "supervisor", label: "Supervisor" },
  { value: "caixa", label: "Caixa" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteUserDialog({ open, onOpenChange }: Props) {
  const { companyId, loading: companyLoading } = useCompany();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<CompanyRole>("caixa");
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleSubmit called", { email, companyId, companyLoading, loading });
    if (!email.trim()) {
      toast.error("Informe o e-mail do usuário");
      return;
    }
    if (!companyId) {
      console.error("InviteUserDialog: companyId is null/undefined. companyLoading:", companyLoading);
      toast.error("Empresa não identificada. Faça login novamente.");
      return;
    }

    setLoading(true);
    setInviteLink(null);
    try {
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: {
          email: email.trim(),
          fullName: fullName.trim(),
          phone: phone.trim(),
          role,
          companyId,
        },
      });

      console.log("invite-user response data:", JSON.stringify(data), "error:", error);

      if (error) throw error;
      if (data?.error && !data?.inviteLink) throw new Error(data.error);

      setSubmitted(true);

      // Invalidate queries in a try-catch to avoid crashes
      try {
        await queryClient.invalidateQueries({ queryKey: ["company-users"] });
      } catch (e) {
        console.warn("Failed to invalidate queries:", e);
      }

      if (data?.inviteLink) {
        setInviteLink(data.inviteLink);
        if (data?.emailSent) {
          toast.success("Convite enviado por e-mail! O link também está disponível abaixo.");
        } else {
          toast.warning("Copie o link abaixo e envie ao usuário por WhatsApp.");
        }
      } else {
        toast.success(data?.message || "Usuário vinculado com sucesso!");
        setEmail("");
        setFullName("");
        setPhone("");
        setRole("caixa");
        onOpenChange(false);
      }
    } catch (err: any) {
      console.error("Invite error:", err);
      toast.error(err.message || "Erro ao convidar usuário");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast.success("Link copiado! Envie ao usuário por WhatsApp ou outro meio.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Convidar Usuário
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Nome Completo</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nome do usuário"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">E-mail *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@email.com"
                required
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Telefone / WhatsApp</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Perfil de Acesso *</label>
            <Select value={role} onValueChange={(v) => setRole(v as CompanyRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">
            O usuário receberá um e-mail de confirmação para ativar sua conta e definir a senha.
          </p>

          {inviteLink && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 space-y-2">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                📋 Link de convite gerado:
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={inviteLink}
                  className="flex-1 text-xs p-2 rounded bg-background border border-border truncate"
                />
                <Button type="button" size="sm" variant="outline" onClick={copyLink}>
                  Copiar
                </Button>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Envie este link ao usuário por WhatsApp ou outro meio.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setInviteLink(null); onOpenChange(false); }}>
              {inviteLink ? "Fechar" : "Cancelar"}
            </Button>
            {!inviteLink && !submitted && (
              <Button type="submit" disabled={loading || companyLoading || !email.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Convidar
                  </>
                )}
              </Button>
            )}
            {submitted && !inviteLink && (
              <Button type="button" variant="outline" onClick={() => {
                setSubmitted(false);
                setEmail("");
                setFullName("");
                setPhone("");
                setRole("caixa");
              }}>
                Convidar outro
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

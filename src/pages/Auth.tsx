import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Store, Mail, Lock, ArrowRight, KeyRound } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Auth() {
  const [email, setEmail] = useState(() => localStorage.getItem("remember-email") || "");
  const [password, setPassword] = useState(() => localStorage.getItem("remember-password") || "");
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem("remember-email") !== null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "set-password" | "processing">(() => {
    // Check sessionStorage first (set by useAuth or previous redirect)
    if (sessionStorage.getItem("needs-password-setup") === "true") {
      return "set-password";
    }
    // Also check URL hash directly (before Supabase consumes it)
    const hash = window.location.hash;
    if (hash) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const type = hashParams.get("type");
      if (type === "recovery" || type === "invite" || type === "magiclink") {
        sessionStorage.setItem("needs-password-setup", "true");
        return "set-password";
      }
    }
    return "processing";
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for auth state changes to detect invite/recovery flows
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth event:", event, "session:", !!session);
      
      if (event === "PASSWORD_RECOVERY") {
        sessionStorage.setItem("needs-password-setup", "true");
        setMode("set-password");
        toast.info("Defina sua senha para acessar o sistema");
        return;
      }

      // When a user clicks an invite link, Supabase fires SIGNED_IN
      // but the user hasn't set a password yet - detect this
      if (event === "SIGNED_IN" && session?.user) {
        const hash = window.location.hash;
        const hashParams = new URLSearchParams(hash.substring(1));
        const type = hashParams.get("type");

        // Check if user was invited (no password set yet)
        const userMeta = session.user.user_metadata;
        const isInvitedUser = type === "invite" || type === "magiclink" || type === "recovery";
        const hasNoPasswordLogin = !session.user.last_sign_in_at || 
          (session.user.created_at === session.user.last_sign_in_at);

        if (isInvitedUser || (hasNoPasswordLogin && hash.includes("access_token"))) {
          sessionStorage.setItem("needs-password-setup", "true");
          setMode("set-password");
          toast.info("Defina sua senha para acessar o sistema");
          return;
        }
      }
    });

    // Handle initial load - check hash for auth tokens
    const handleAuthCallback = async () => {
      const hash = window.location.hash;
      
      if (hash && (hash.includes("access_token") || hash.includes("type="))) {
        try {
          const hashParams = new URLSearchParams(hash.substring(1));
          const type = hashParams.get("type");

          // If type is in the hash, we can determine mode before session resolves
          if (type === "recovery" || type === "invite" || type === "magiclink") {
            // Wait for the session to be established by onAuthStateChange
            return;
          }

          const { data } = await supabase.auth.getSession();
          if (data.session) {
            navigate("/");
            return;
          }
        } catch (err) {
          console.error("Callback processing error:", err);
        }
      }
      
      // Only switch to login if we're NOT in set-password mode (from sessionStorage)
      if (sessionStorage.getItem("needs-password-setup") !== "true") {
        setMode("login");
      }
    };

    handleAuthCallback();

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não conferem");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      sessionStorage.removeItem("needs-password-setup");
      toast.success("Senha definida com sucesso!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Erro ao definir senha");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (rememberMe) {
        localStorage.setItem("remember-email", email);
        localStorage.setItem("remember-password", password);
      } else {
        localStorage.removeItem("remember-email");
        localStorage.removeItem("remember-password");
      }
      sessionStorage.removeItem("needs-password-setup");
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Login realizado com sucesso!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  if (mode === "processing") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl brand-gradient flex items-center justify-center mb-4 glow">
            <Store className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">PDV Fiscal</h1>
          <p className="text-sm text-muted-foreground mt-1">Sistema de Vendas</p>
        </div>

        {/* Form card */}
        <div className="bg-card rounded-2xl card-shadow border border-border p-6">
          {mode === "set-password" ? (
            <>
              <h2 className="text-lg font-semibold text-foreground mb-1">Definir Senha</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Crie uma senha para acessar o sistema
              </p>

              <form onSubmit={handleSetPassword} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Nova Senha</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Confirmar Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {loading ? "Processando..." : "Definir Senha"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-foreground mb-1">Entrar</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Acesse sua conta para continuar
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary"
                  />
                  <span className="text-sm text-muted-foreground">Manter-me conectado</span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {loading ? "Processando..." : "Entrar"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                Solicite seu acesso ao administrador da empresa
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Validate the calling user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create client with user's token to verify identity
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: callingUser }, error: authError } = await userClient.auth.getUser();
    if (authError || !callingUser) {
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, fullName, role, companyId, phone } = await req.json();

    // Validate inputs
    if (!email || !companyId || !role) {
      return new Response(JSON.stringify({ error: "E-mail, empresa e perfil são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validRoles = ["admin", "gerente", "supervisor", "caixa"];
    if (!validRoles.includes(role)) {
      return new Response(JSON.stringify({ error: "Perfil inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify calling user is admin of the company
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: callerRole } = await adminClient
      .from("company_users")
      .select("role")
      .eq("user_id", callingUser.id)
      .eq("company_id", companyId)
      .eq("is_active", true)
      .single();

    if (!callerRole || callerRole.role !== "admin") {
      return new Response(JSON.stringify({ error: "Apenas administradores podem convidar usuários" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === email);

    let userId: string;

    if (existingUser) {
      // Check if already linked to this company
      const { data: existingLink } = await adminClient
        .from("company_users")
        .select("id, is_active")
        .eq("user_id", existingUser.id)
        .eq("company_id", companyId)
        .single();

      if (existingLink) {
        if (existingLink.is_active) {
          // If user hasn't confirmed email yet, resend invite
          if (!existingUser.email_confirmed_at) {
            await adminClient.auth.admin.deleteUser(existingUser.id);
            // Will fall through to create new invite below
          } else {
            return new Response(JSON.stringify({ error: "Este usuário já está vinculado à empresa" }), {
              status: 409,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        } else {
          // Reactivate inactive user with new role
          await adminClient
            .from("company_users")
            .update({ is_active: true, role })
            .eq("id", existingLink.id);

          return new Response(
            JSON.stringify({ success: true, message: "Usuário reativado com sucesso!", userId: existingUser.id }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else if (existingUser.email_confirmed_at) {
        // User exists and confirmed but not linked to this company - just link
        userId = existingUser.id;
      } else {
        // User exists but unconfirmed and not linked - delete and re-invite
        await adminClient.auth.admin.deleteUser(existingUser.id);
      }
    }

    // Create new user via invite if needed (sends email automatically)
    if (!userId) {
      const { data: newUser, error: createError } = await adminClient.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name: fullName || "",
          phone: phone || "",
        },
        redirectTo: `${req.headers.get("origin") || "https://id-preview--e5ef5c79-efef-4e2f-b9c1-39921fc0a605.lovable.app"}/auth`,
      });

      if (createError) {
        console.error("Invite user error:", createError);
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      userId = newUser.user.id;
    }

    // Link user to company with specified role
    const { error: linkError } = await adminClient
      .from("company_users")
      .insert({
        user_id: userId,
        company_id: companyId,
        role,
        is_active: true,
      });

    if (linkError) {
      console.error("Link error:", linkError);
      return new Response(JSON.stringify({ error: "Erro ao vincular usuário à empresa" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: existingUser 
          ? "Usuário existente vinculado à empresa com sucesso" 
          : "Convite enviado! O usuário receberá um e-mail para confirmar o cadastro.",
        userId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("invite-user error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const NUVEM_FISCAL_TOKEN_URL = "https://auth.nuvemfiscal.com.br/oauth/token";
const NUVEM_FISCAL_API_URL = "https://api.nuvemfiscal.com.br";

/** Obtain an OAuth2 access token from Nuvem Fiscal (client_credentials flow). */
async function getAccessToken(scopes: string): Promise<string> {
  const clientId = Deno.env.get("NUVEM_FISCAL_CLIENT_ID");
  const clientSecret = Deno.env.get("NUVEM_FISCAL_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("Credenciais da Nuvem Fiscal não configuradas");
  }

  const resp = await fetch(NUVEM_FISCAL_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: scopes,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Erro ao obter token Nuvem Fiscal: ${resp.status} - ${text}`);
  }

  const data = await resp.json();
  return data.access_token;
}

/** Proxy a request to the Nuvem Fiscal API with auth. */
async function nuvemFiscalRequest(
  method: string,
  path: string,
  token: string,
  body?: unknown
): Promise<{ status: number; data: unknown }> {
  const opts: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };
  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    opts.body = JSON.stringify(body);
  }

  const resp = await fetch(`${NUVEM_FISCAL_API_URL}${path}`, opts);

  // PDF/XML responses return binary
  const contentType = resp.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await resp.json();
    return { status: resp.status, data };
  }

  // For binary (PDF/XML), return base64
  if (resp.ok) {
    const buf = await resp.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
    return { status: resp.status, data: { base64, content_type: contentType } };
  }

  const text = await resp.text();
  return { status: resp.status, data: { error: text } };
}

/** Build the NFC-e body for the Nuvem Fiscal API from our internal data. */
function buildNfceBody(params: {
  company: Record<string, unknown>;
  fiscalConfig: Record<string, unknown>;
  items: Array<Record<string, unknown>>;
  total: number;
  paymentMethod: string;
  customerCpf?: string;
  customerName?: string;
}) {
  const { company, fiscalConfig, items, total, paymentMethod, customerCpf } = params;
  const environment = (fiscalConfig.environment as string) === "producao" ? "producao" : "homologacao";

  // Map payment method to NFC-e code
  const paymentMap: Record<string, string> = {
    dinheiro: "01",
    debito: "04",
    credito: "03",
    pix: "17",
    voucher: "05",
    outros: "99",
  };
  const tPag = paymentMap[paymentMethod] || "99";

  // Build product items (det)
  const det = items.map((item, idx) => ({
    nItem: idx + 1,
    prod: {
      cProd: item.sku || item.product_id,
      cEAN: "SEM GTIN",
      xProd: item.name,
      NCM: item.ncm || "00000000",
      CFOP: "5102", // Venda de mercadoria
      uCom: item.unit || "UN",
      qCom: item.quantity,
      vUnCom: item.unit_price,
      vProd: Number(((item.quantity as number) * (item.unit_price as number)).toFixed(2)),
      cEANTrib: "SEM GTIN",
      uTrib: item.unit || "UN",
      qTrib: item.quantity,
      vUnTrib: item.unit_price,
      indTot: 1,
    },
    imposto: {
      ICMS: {
        ICMSSN102: {
          orig: "0",
          CSOSN: "102",
        },
      },
      PIS: {
        PISSN: {
          CST: "49",
        },
      },
      COFINS: {
        COFINSSN: {
          CST: "49",
        },
      },
    },
  }));

  const body: Record<string, unknown> = {
    ambiente: environment,
    referencia: null, // will be set after we get fiscal_document ID
    infNFe: {
      versao: "4.00",
      ide: {
        cUF: Number((company.address_ibge_code as string)?.substring(0, 2) || "35"),
        natOp: "VENDA",
        mod: 65, // NFC-e
        serie: Number(fiscalConfig.serie) || 1,
        tpNF: 1, // Saída
        idDest: 1, // Operação interna
        cMunFG: Number(company.address_ibge_code) || 3550308,
        tpImp: 4, // DANFE NFC-e
        tpEmis: 1, // Emissão normal
        tpAmb: environment === "producao" ? 1 : 2,
        finNFe: 1, // NF-e normal
        indFinal: 1, // Consumidor final
        indPres: 1, // Operação presencial
        procEmi: 0, // Emissão por aplicativo
      },
      emit: {
        CNPJ: (company.cnpj as string)?.replace(/\D/g, ""),
        xNome: company.name,
        xFant: company.trade_name || company.name,
        IE: company.ie || "ISENTO",
        CRT: 1, // Simples Nacional (default — can be adjusted)
        enderEmit: {
          xLgr: company.address_street || "Rua",
          nro: company.address_number || "S/N",
          xBairro: company.address_neighborhood || "Centro",
          cMun: Number(company.address_ibge_code) || 3550308,
          xMun: company.address_city || "São Paulo",
          UF: company.address_state || "SP",
          CEP: (company.address_zip as string)?.replace(/\D/g, "") || "01000000",
          cPais: 1058,
          xPais: "Brasil",
        },
      },
      dest: customerCpf
        ? { CPF: customerCpf.replace(/\D/g, ""), indIEDest: 9 }
        : undefined,
      det,
      total: {
        ICMSTot: {
          vBC: 0,
          vICMS: 0,
          vICMSDeson: 0,
          vFCP: 0,
          vBCST: 0,
          vST: 0,
          vFCPST: 0,
          vFCPSTRet: 0,
          vProd: total,
          vFrete: 0,
          vSeg: 0,
          vDesc: 0,
          vII: 0,
          vIPI: 0,
          vIPIDevol: 0,
          vPIS: 0,
          vCOFINS: 0,
          vOutro: 0,
          vNF: total,
        },
      },
      transp: { modFrete: 9 }, // Sem frete
      pag: {
        detPag: [{ tPag, vPag: total }],
      },
      infAdic: {
        infCpl: "Documento emitido por sistema ERP",
      },
    },
  };

  return body;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's company
    const { data: companyUser } = await supabase
      .from("company_users")
      .select("company_id, role")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (!companyUser) {
      return new Response(JSON.stringify({ error: "No company found" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const companyId = companyUser.company_id;

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // ─── ACTIONS ─────────────────────────────────────────────

    if (req.method === "POST" && action === "emitir-nfce") {
      const body = await req.json();
      const { fiscal_document_id, items, total, payment_method, customer_cpf, customer_name } = body;

      // Fetch company data
      const { data: company } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .single();

      if (!company) throw new Error("Empresa não encontrada");

      // Fetch fiscal config for NFC-e
      const { data: fiscalConfig } = await supabase
        .from("fiscal_configs")
        .select("*")
        .eq("company_id", companyId)
        .eq("doc_type", "nfce")
        .eq("is_active", true)
        .maybeSingle();

      if (!fiscalConfig) throw new Error("Configuração fiscal de NFC-e não encontrada. Configure em Fiscal > Configurações.");

      // Build payload
      const nfceBody = buildNfceBody({
        company,
        fiscalConfig,
        items,
        total,
        paymentMethod: payment_method,
        customerCpf: customer_cpf,
        customerName: customer_name,
      });

      // Set reference to our fiscal document ID
      nfceBody.referencia = fiscal_document_id;

      // Get Nuvem Fiscal token
      const nfToken = await getAccessToken("empresa nfce");

      // Emit NFC-e
      const result = await nuvemFiscalRequest("POST", "/nfce", nfToken, nfceBody);

      if (result.status >= 200 && result.status < 300) {
        const nfceData = result.data as Record<string, unknown>;

        // Update fiscal document with access key and status
        const updateData: Record<string, unknown> = {
          status: nfceData.status === "autorizada" ? "autorizada" : nfceData.status === "rejeitada" ? "rejeitada" : "pendente",
          updated_at: new Date().toISOString(),
        };

        if (nfceData.chave) updateData.access_key = nfceData.chave;
        if (nfceData.numero) updateData.number = nfceData.numero;
        if (nfceData.numero_protocolo) updateData.protocol_number = nfceData.numero_protocolo;
        if (nfceData.data_autorizacao) updateData.protocol_date = nfceData.data_autorizacao;
        if (nfceData.motivo_status) updateData.rejection_reason = nfceData.status === "rejeitada" ? nfceData.motivo_status : null;
        updateData.environment = fiscalConfig.environment;

        if (fiscal_document_id) {
          await supabase
            .from("fiscal_documents")
            .update(updateData)
            .eq("id", fiscal_document_id);
        }

        // Increment next number
        await supabase
          .from("fiscal_configs")
          .update({ next_number: (fiscalConfig.next_number || 1) + 1 })
          .eq("id", fiscalConfig.id);

        // Audit log
        await supabase.from("action_logs").insert({
          company_id: companyId,
          user_id: user.id,
          action: "nfce_emitida",
          module: "fiscal",
          details: `NFC-e ${nfceData.numero || ""} - Status: ${nfceData.status} - R$ ${total}`,
        });

        return new Response(JSON.stringify(nfceData), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        // Update fiscal doc as rejected
        if (fiscal_document_id) {
          await supabase
            .from("fiscal_documents")
            .update({
              status: "rejeitada",
              rejection_reason: JSON.stringify(result.data),
              updated_at: new Date().toISOString(),
            })
            .eq("id", fiscal_document_id);
        }

        return new Response(JSON.stringify({ error: "Erro na emissão", details: result.data }), {
          status: result.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (req.method === "POST" && action === "cancelar-nfce") {
      const body = await req.json();
      const { nuvem_fiscal_id, fiscal_document_id, justificativa } = body;

      if (!nuvem_fiscal_id || !justificativa) {
        return new Response(JSON.stringify({ error: "ID e justificativa são obrigatórios" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const nfToken = await getAccessToken("empresa nfce");
      const result = await nuvemFiscalRequest("POST", `/nfce/${nuvem_fiscal_id}/cancelamento`, nfToken, {
        justificativa,
      });

      if (result.status >= 200 && result.status < 300) {
        // Update local fiscal document
        if (fiscal_document_id) {
          await supabase
            .from("fiscal_documents")
            .update({
              status: "cancelada",
              cancel_reason: justificativa,
              canceled_at: new Date().toISOString(),
              canceled_by: user.id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", fiscal_document_id);
        }

        await supabase.from("action_logs").insert({
          company_id: companyId,
          user_id: user.id,
          action: "nfce_cancelada",
          module: "fiscal",
          details: `NFC-e cancelada: ${justificativa}`,
        });
      }

      return new Response(JSON.stringify(result.data), {
        status: result.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "GET" && action === "consultar") {
      const nuvemFiscalId = url.searchParams.get("nuvem_fiscal_id");
      const docType = url.searchParams.get("doc_type") || "nfce";

      if (!nuvemFiscalId) {
        return new Response(JSON.stringify({ error: "nuvem_fiscal_id é obrigatório" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const nfToken = await getAccessToken(`empresa ${docType}`);
      const result = await nuvemFiscalRequest("GET", `/${docType}/${nuvemFiscalId}`, nfToken);

      return new Response(JSON.stringify(result.data), {
        status: result.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "GET" && action === "pdf") {
      const nuvemFiscalId = url.searchParams.get("nuvem_fiscal_id");
      const docType = url.searchParams.get("doc_type") || "nfce";

      if (!nuvemFiscalId) {
        return new Response(JSON.stringify({ error: "nuvem_fiscal_id é obrigatório" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const nfToken = await getAccessToken(`empresa ${docType}`);
      const result = await nuvemFiscalRequest("GET", `/${docType}/${nuvemFiscalId}/pdf`, nfToken);

      return new Response(JSON.stringify(result.data), {
        status: result.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "GET" && action === "status-sefaz") {
      const docType = url.searchParams.get("doc_type") || "nfce";
      const nfToken = await getAccessToken(`empresa ${docType}`);

      // Get company CNPJ
      const { data: company } = await supabase
        .from("companies")
        .select("cnpj")
        .eq("id", companyId)
        .single();

      if (!company) throw new Error("Empresa não encontrada");

      const cnpj = (company.cnpj as string).replace(/\D/g, "");
      const result = await nuvemFiscalRequest("GET", `/${docType}/sefaz/status?cpf_cnpj=${cnpj}`, nfToken);

      return new Response(JSON.stringify(result.data), {
        status: result.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação não reconhecida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

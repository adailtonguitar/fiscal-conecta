// Nuvem Fiscal Edge Function
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
  paymentAmounts?: number[];
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
    prazo: "05", // Crédito Loja (a prazo)
    outros: "99",
  };

  // Determine indPag: 0 = à vista, 1 = a prazo
  const hasPrazo = paymentMethod === "prazo" || paymentMethod.includes("prazo");
  const indPag = hasPrazo ? 1 : 0;

  // Build detPag: support multi-payment (e.g. "prazo+dinheiro")
  const paymentMethods = paymentMethod.includes("+") ? paymentMethod.split("+") : [paymentMethod];
  const paymentAmounts = params.paymentAmounts; // optional array of amounts per method
  const detPag = paymentMethods.map((method, idx) => ({
    indPag,
    tPag: paymentMap[method.trim()] || "99",
    vPag: paymentAmounts && paymentAmounts[idx] != null
      ? paymentAmounts[idx]
      : Number((total / paymentMethods.length).toFixed(2)),
  }));

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
        detPag,
      },
      infAdic: {
        infCpl: [company.slogan, "Documento emitido por sistema ERP"].filter(Boolean).join(" | "),
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
      const { fiscal_document_id, items, total, payment_method, payment_amounts, customer_cpf, customer_name } = body;

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

      // Pre-flight checks — give clear feedback about what's missing
      const missing: string[] = [];
      if (!fiscalConfig.certificate_path && fiscalConfig.certificate_type !== "a3") {
        missing.push("Certificado digital A1 (.PFX) não cadastrado");
      }
      if (fiscalConfig.certificate_type === "a3" && !fiscalConfig.a3_thumbprint) {
        missing.push("Certificado A3 não configurado (thumbprint ausente)");
      }
      if (!Deno.env.get("NUVEM_FISCAL_CLIENT_ID") || !Deno.env.get("NUVEM_FISCAL_CLIENT_SECRET")) {
        missing.push("Credenciais da API fiscal (Client ID/Secret) não configuradas");
      }
      if (missing.length > 0) {
        return new Response(JSON.stringify({ 
          error: "Configuração fiscal incompleta", 
          missing,
          message: missing.join(". ") + ". Acesse Configurações > Fiscal para completar."
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Build payload
      const nfceBody = buildNfceBody({
        company,
        fiscalConfig,
        items,
        total,
        paymentMethod: payment_method,
        paymentAmounts: payment_amounts,
        customerCpf: customer_cpf,
        customerName: customer_name,
      });

      // Set reference to our fiscal document ID
      nfceBody.referencia = fiscal_document_id;

      // Get Nuvem Fiscal token
      let nfToken: string;
      try {
        nfToken = await getAccessToken("empresa nfce");
      } catch (tokenErr) {
        const tokenMsg = tokenErr instanceof Error ? tokenErr.message : String(tokenErr);
        const isInvalidClient = tokenMsg.includes("invalid_client") || tokenMsg.includes("401");
        return new Response(JSON.stringify({ 
          error: isInvalidClient 
            ? "Credenciais da API fiscal inválidas ou expiradas. Atualize o Client ID e Client Secret da Nuvem Fiscal." 
            : `Erro de autenticação fiscal: ${tokenMsg}`,
        }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

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

    // ─── A3 FLOW: Generate unsigned XML ─────────────────────
    if (req.method === "POST" && action === "gerar-xml") {
      const body = await req.json();
      const { fiscal_document_id, doc_type, items, total, payment_method, customer_cpf, customer_name } = body;
      const dtype = doc_type || "nfce";

      // Fetch company data
      const { data: company } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .single();

      if (!company) throw new Error("Empresa não encontrada");

      // Fetch fiscal config
      const { data: fiscalConfig } = await supabase
        .from("fiscal_configs")
        .select("*")
        .eq("company_id", companyId)
        .eq("doc_type", dtype)
        .eq("is_active", true)
        .maybeSingle();

      if (!fiscalConfig) throw new Error(`Configuração fiscal de ${dtype.toUpperCase()} não encontrada.`);

      // Build payload
      const nfBody = buildNfceBody({
        company,
        fiscalConfig,
        items,
        total,
        paymentMethod: payment_method,
        customerCpf: customer_cpf,
        customerName: customer_name,
      });
      nfBody.referencia = fiscal_document_id;

      // Request unsigned XML from Nuvem Fiscal
      const nfToken = await getAccessToken(`empresa ${dtype}`);
      const result = await nuvemFiscalRequest("POST", `/${dtype}`, nfToken, {
        ...nfBody,
        // Tell Nuvem Fiscal NOT to sign (return unsigned XML)
        assinar: false,
      });

      if (result.status >= 200 && result.status < 300) {
        const nfData = result.data as Record<string, unknown>;

        // Update fiscal document with pending status
        if (fiscal_document_id) {
          await supabase
            .from("fiscal_documents")
            .update({
              status: "pendente",
              access_key: nfData.chave || null,
              number: nfData.numero || null,
              environment: fiscalConfig.environment,
              updated_at: new Date().toISOString(),
            })
            .eq("id", fiscal_document_id);
        }

        return new Response(JSON.stringify({
          nuvem_fiscal_id: nfData.id,
          chave: nfData.chave,
          numero: nfData.numero,
          xml: nfData.xml || nfData.xml_nfe || null,
          status: nfData.status,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        return new Response(JSON.stringify({ error: "Erro ao gerar XML", details: result.data }), {
          status: result.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ─── A3 FLOW: Submit signed XML ─────────────────────────
    if (req.method === "POST" && action === "enviar-xml-assinado") {
      const body = await req.json();
      const { nuvem_fiscal_id, fiscal_document_id, doc_type, signed_xml } = body;
      const dtype = doc_type || "nfce";

      if (!signed_xml) {
        return new Response(JSON.stringify({ error: "XML assinado é obrigatório" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const nfToken = await getAccessToken(`empresa ${dtype}`);

      // Submit signed XML to Nuvem Fiscal for authorization
      const result = await nuvemFiscalRequest("POST", `/${dtype}/xml`, nfToken, {
        xml: signed_xml,
      });

      if (result.status >= 200 && result.status < 300) {
        const nfData = result.data as Record<string, unknown>;

        // Update fiscal document
        const updateData: Record<string, unknown> = {
          status: nfData.status === "autorizada" ? "autorizada" : nfData.status === "rejeitada" ? "rejeitada" : "pendente",
          updated_at: new Date().toISOString(),
        };
        if (nfData.chave) updateData.access_key = nfData.chave;
        if (nfData.numero) updateData.number = nfData.numero;
        if (nfData.numero_protocolo) updateData.protocol_number = nfData.numero_protocolo;
        if (nfData.data_autorizacao) updateData.protocol_date = nfData.data_autorizacao;
        if (nfData.motivo_status && nfData.status === "rejeitada") updateData.rejection_reason = nfData.motivo_status;

        if (fiscal_document_id) {
          await supabase
            .from("fiscal_documents")
            .update(updateData)
            .eq("id", fiscal_document_id);

          // Get fiscal config to increment number
          const { data: fiscalConfig } = await supabase
            .from("fiscal_configs")
            .select("id, next_number")
            .eq("company_id", companyId)
            .eq("doc_type", dtype)
            .eq("is_active", true)
            .maybeSingle();

          if (fiscalConfig) {
            await supabase
              .from("fiscal_configs")
              .update({ next_number: (fiscalConfig.next_number || 1) + 1 })
              .eq("id", fiscalConfig.id);
          }
        }

        // Audit log
        await supabase.from("action_logs").insert({
          company_id: companyId,
          user_id: user.id,
          action: `${dtype}_emitida_a3`,
          module: "fiscal",
          details: `${dtype.toUpperCase()} ${nfData.numero || ""} emitida com certificado A3 - Status: ${nfData.status}`,
        });

        return new Response(JSON.stringify(nfData), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
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

        return new Response(JSON.stringify({ error: "Erro ao enviar XML assinado", details: result.data }), {
          status: result.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ─── UPLOAD LOGO to Nuvem Fiscal ─────────────────────────
    if (req.method === "POST" && action === "upload-logo") {
      console.log("[UPLOAD-LOGO] Starting logo upload for company:", companyId);
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("cnpj, logo_url, name, trade_name, ie, im, email, phone, tax_regime, address_street, address_number, address_complement, address_neighborhood, address_city, address_state, address_zip, address_ibge_code")
        .eq("id", companyId)
        .single();

      if (companyError || !company) {
        console.error("[UPLOAD-LOGO] Company query error:", companyError);
        throw new Error("Empresa não encontrada");
      }
      if (!company.logo_url) {
        return new Response(JSON.stringify({ error: "Nenhum logotipo cadastrado na empresa" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const cnpj = (company.cnpj as string).replace(/\D/g, "");
      const nfToken = await getAccessToken("empresa");

      // Check if company exists in Nuvem Fiscal, if not, register it first
      console.log("[UPLOAD-LOGO] Checking if company is registered in Nuvem Fiscal...");
      const checkResp = await fetch(`${NUVEM_FISCAL_API_URL}/empresas/${cnpj}`, {
        headers: { Authorization: `Bearer ${nfToken}` },
      });

      if (checkResp.status === 404) {
        console.log("[UPLOAD-LOGO] Company not found in Nuvem Fiscal, registering...");
        const regimeMap: Record<string, number> = {
          simples_nacional: 1,
          lucro_presumido: 3,
          lucro_real: 3,
        };
        const registerBody = {
          cpf_cnpj: cnpj,
          razao_social: company.name,
          nome_fantasia: company.trade_name || company.name,
          inscricao_estadual: company.ie || "",
          inscricao_municipal: company.im || "",
          email: company.email || "",
          fone: (company.phone || "").replace(/\D/g, ""),
          optante_simples_nacional: (company.tax_regime || "simples_nacional") === "simples_nacional",
          regime_tributacao: regimeMap[company.tax_regime || "simples_nacional"] ?? 1,
          endereco: {
            logradouro: company.address_street || "",
            numero: company.address_number || "S/N",
            complemento: company.address_complement || "",
            bairro: company.address_neighborhood || "",
            codigo_municipio: company.address_ibge_code || "",
            cidade: company.address_city || "",
            uf: company.address_state || "SP",
            cep: (company.address_zip || "").replace(/\D/g, ""),
          },
        };

        const registerResp = await fetch(`${NUVEM_FISCAL_API_URL}/empresas`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${nfToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(registerBody),
        });

        if (!registerResp.ok) {
          const regErr = await registerResp.text();
          console.error("[UPLOAD-LOGO] Failed to register company:", registerResp.status, regErr);
          return new Response(JSON.stringify({ error: "Erro ao cadastrar empresa na Nuvem Fiscal. Cadastre a empresa primeiro via configuração fiscal.", details: regErr }), {
            status: registerResp.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        console.log("[UPLOAD-LOGO] Company registered successfully in Nuvem Fiscal");
      } else if (!checkResp.ok) {
        await checkResp.text(); // consume body
        console.log("[UPLOAD-LOGO] Company check returned status:", checkResp.status);
      } else {
        await checkResp.text(); // consume body
        console.log("[UPLOAD-LOGO] Company already registered in Nuvem Fiscal");
      }

      // Download logo from URL
      console.log("[UPLOAD-LOGO] Downloading logo from:", company.logo_url);
      const logoResp = await fetch(company.logo_url);
      if (!logoResp.ok) {
        console.error("[UPLOAD-LOGO] Logo download failed:", logoResp.status);
        throw new Error("Não foi possível baixar o logotipo");
      }

      const logoBuffer = await logoResp.arrayBuffer();
      const contentType = logoResp.headers.get("content-type") || "image/png";

      // PUT /empresas/{cpf_cnpj}/logotipo
      console.log("[UPLOAD-LOGO] Uploading logo to Nuvem Fiscal...");
      const uploadResp = await fetch(`${NUVEM_FISCAL_API_URL}/empresas/${cnpj}/logotipo`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${nfToken}`,
          "Content-Type": contentType,
        },
        body: logoBuffer,
      });

      if (uploadResp.ok) {
        console.log("[UPLOAD-LOGO] Logo uploaded successfully");
        await supabase.from("action_logs").insert({
          company_id: companyId,
          user_id: user.id,
          action: "logo_enviado_nuvem_fiscal",
          module: "fiscal",
          details: "Logotipo da empresa enviado para a Nuvem Fiscal (aparecerá nos DANFEs)",
        });

        return new Response(JSON.stringify({ success: true, message: "Logotipo enviado com sucesso para a Nuvem Fiscal" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        const errText = await uploadResp.text();
        console.error("[UPLOAD-LOGO] Upload failed:", uploadResp.status, errText);
        return new Response(JSON.stringify({ error: "Erro ao enviar logotipo para Nuvem Fiscal", details: errText }), {
          status: uploadResp.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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

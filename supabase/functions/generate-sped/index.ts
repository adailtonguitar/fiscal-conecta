import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── SPED Fiscal helpers ──

function pad(val: string | number, len: number, char = "0", right = false): string {
  const s = String(val ?? "");
  return right ? s.padEnd(len, char) : s.padStart(len, char);
}

function fmtDate(iso: string): string {
  if (!iso) return "00000000";
  const d = new Date(iso);
  return `${pad(d.getDate(), 2)}${pad(d.getMonth() + 1, 2)}${pad(d.getFullYear(), 4)}`;
}

function fmtVal(n: number | null | undefined, dec = 2): string {
  return (n ?? 0).toFixed(dec).replace(".", ",");
}

function line(...fields: string[]): string {
  return "|" + fields.join("|") + "|\n";
}

interface SpedContext {
  company: any;
  docs: any[];
  financials: any[];
  products: any[];
  startDate: string;
  endDate: string;
}

function generateSpedFiscal(ctx: SpedContext): string {
  let txt = "";
  const { company, docs, financials, products, startDate, endDate } = ctx;
  const cnpj = (company.cnpj || "").replace(/\D/g, "");
  const ie = (company.ie || "").replace(/\D/g, "");
  const uf = company.address_state || "SP";

  // ── BLOCO 0 (Abertura) ──
  // 0000 - Abertura
  txt += line("0000", "017", // layout 017
    "0", // finalidade: remessa regular
    fmtDate(startDate), fmtDate(endDate),
    company.name || "",
    cnpj,
    "", // CPF
    uf,
    ie,
    company.address_ibge_code || "",
    company.im || "",
    "", // SUFRAMA
    "1", // perfil A
    "1"  // atividade industrial/comércio
  );

  // 0001 - Abertura do bloco 0
  txt += line("0001", "0");

  // 0005 - Dados complementares
  txt += line("0005",
    company.trade_name || company.name || "",
    company.address_zip || "",
    company.address_street || "",
    company.address_number || "",
    company.address_complement || "",
    company.address_neighborhood || "",
    company.phone || "",
    "", // fax
    company.email || ""
  );

  // 0100 - Dados do contabilista
  txt += line("0100",
    (company.accountant_name || "CONTADOR NAO CONFIGURADO"),
    "", // CPF
    (company.accountant_crc || ""),
    "", // CNPJ
    "", // CEP
    "", // end
    "", // num
    "", // compl
    "", // bairro
    "", // fone
    "", // fax
    (company.accountant_email || ""),
    "" // cod mun
  );

  // 0150 - Clientes/fornecedores from docs
  const participants = new Map<string, any>();
  for (const doc of docs) {
    if (doc.customer_cpf_cnpj) {
      const cpfCnpj = doc.customer_cpf_cnpj.replace(/\D/g, "");
      if (!participants.has(cpfCnpj)) {
        participants.set(cpfCnpj, {
          name: doc.customer_name || "CONSUMIDOR",
          cpfCnpj,
          ie: "",
        });
      }
    }
  }

  let participantCode = 1;
  const participantCodes = new Map<string, string>();
  for (const [cpfCnpj, p] of participants) {
    const code = pad(participantCode++, 6);
    participantCodes.set(cpfCnpj, code);
    txt += line("0150", code, p.name, "",
      cpfCnpj.length === 14 ? cpfCnpj : "",
      cpfCnpj.length === 11 ? cpfCnpj : "",
      p.ie, "", "", "", "", "");
  }

  // 0200 - Produtos
  const productCodes = new Map<string, string>();
  let prodSeq = 1;
  for (const p of products) {
    const code = pad(prodSeq++, 6);
    productCodes.set(p.id, code);
    txt += line("0200", code, "",
      p.name || "",
      p.barcode || "",
      "", // cod anterior
      "", // unidade genérica
      p.unit || "UN",
      "", // fator conversão
      "", // TIPI
      p.sku || "",
      p.ncm || "",
      "", // EX IPI
      "", // gênero
      "", // serviço
      "" // alíquota ICMS
    );
  }

  // 0990 - Encerramento bloco 0
  const block0Lines = txt.split("\n").filter(l => l.startsWith("|0")).length + 1;
  txt += line("0990", String(block0Lines));

  // ── BLOCO C (Documentos Fiscais Mercadorias) ──
  txt += line("C001", "0"); // abertura com dados

  let cLineCount = 1; // C001

  for (const doc of docs) {
    if (doc.status !== "autorizada") continue;

    const isNfce = doc.doc_type === "nfce";
    const model = isNfce ? "65" : "55";
    const cpfCnpj = (doc.customer_cpf_cnpj || "").replace(/\D/g, "");
    const partCode = participantCodes.get(cpfCnpj) || "";

    // C100 - Nota Fiscal
    txt += line("C100",
      "1", // indicador: saída
      "1", // emissão própria
      partCode,
      model,
      "00", // situação regular
      pad(doc.serie || 1, 3),
      pad(doc.number || 0, 9),
      doc.access_key || "",
      fmtDate(doc.created_at),
      fmtDate(doc.created_at), // dt saída = dt emissão
      fmtVal(doc.total_value), // valor total produtos
      "", // desconto
      "", // acréscimo
      fmtVal(doc.total_value), // valor mercadorias
      "9", // frete por conta de terceiros
      "", // valor frete
      "", // valor seguro
      "", // valor outras desp
      fmtVal(doc.total_value), // valor total NF
      "1", // tipo pagamento: à vista
      "", // valor desconto
      "", // valor abatimento
      fmtVal(doc.total_value), // valor total mercadorias
      "", // ICMS
      "", // BC ICMS
      "", // valor ICMS
      "", // BC ST
      "", // valor ST
      "", // valor IPI
      "", // valor PIS
      "", // valor COFINS
      "" // valor outras
    );
    cLineCount++;

    // C170 - Itens do documento
    const items = Array.isArray(doc.items_json) ? doc.items_json : [];
    let itemSeq = 1;
    for (const item of items) {
      const prodCode = productCodes.get((item as any).product_id) || pad(itemSeq, 6);
      txt += line("C170",
        pad(itemSeq++, 3),
        prodCode,
        (item as any).name || "",
        fmtVal((item as any).quantity || 0, 3),
        (item as any).unit || "UN",
        fmtVal((item as any).unit_price || 0),
        "", // desconto
        "0", // movimentação física
        "", // CST ICMS
        "", // CFOP
        "", // COD NAT
        "", // BC ICMS
        "", // alíquota ICMS
        "", // valor ICMS
        "", // BC ST
        "", // alíquota ST
        "", // valor ST
        "", // indicador apur
        "", // CST IPI
        "", // cod enquadramento
        "", // BC IPI
        "", // alíquota IPI
        "", // valor IPI
        "", // CST PIS
        "", // BC PIS
        "", // alíquota PIS %
        "", // valor PIS
        "", // CST COFINS
        "", // BC COFINS
        "", // alíquota COFINS %
        "", // valor COFINS
        "" // cod conta
      );
      cLineCount++;
    }

    // C190 - Registro analítico
    txt += line("C190",
      "", // CST
      "", // CFOP
      "", // alíquota
      fmtVal(doc.total_value), // valor operação
      "", // BC ICMS
      "", // valor ICMS
      "", // BC ST
      "", // valor ICMS ST
      "", // valor IPI
      "" // outras
    );
    cLineCount++;
  }

  // C990
  cLineCount++; // count C990 itself
  txt += line("C990", String(cLineCount));

  // ── BLOCO D (Serviços) — sem dados ──
  txt += line("D001", "1");
  txt += line("D990", "2");

  // ── BLOCO E (Apuração ICMS) ──
  txt += line("E001", "1");
  txt += line("E990", "2");

  // ── BLOCO G (CIAP) — sem dados ──
  txt += line("G001", "1");
  txt += line("G990", "2");

  // ── BLOCO H (Inventário) — sem dados ──
  txt += line("H001", "1");
  txt += line("H990", "2");

  // ── BLOCO K (Produção) — sem dados ──
  txt += line("K001", "1");
  txt += line("K990", "2");

  // ── BLOCO 1 (Outras informações) ──
  txt += line("1001", "1");
  txt += line("1990", "2");

  // ── BLOCO 9 (Controle e encerramento) ──
  const allLines = txt.split("\n").filter(l => l.length > 0);
  txt += line("9001", "0");
  // 9900 - Registro de totais por tipo de registro
  const regCounts = new Map<string, number>();
  for (const l of allLines) {
    const reg = l.substring(1, 5);
    regCounts.set(reg, (regCounts.get(reg) || 0) + 1);
  }

  let block9Lines = 2; // 9001 + 9990
  block9Lines += regCounts.size + 2; // all 9900 + 9900 for 9001 + 9900 for 9990 + 9900 for 9999

  // Add 9900 entries
  regCounts.set("9001", 1);
  regCounts.set("9900", regCounts.size + 3); // +3 for 9001, 9990, 9999
  regCounts.set("9990", 1);
  regCounts.set("9999", 1);

  for (const [reg, count] of [...regCounts].sort()) {
    txt += line("9900", reg, String(count));
  }

  const totalLines = txt.split("\n").filter(l => l.length > 0).length + 2; // +9990 +9999
  txt += line("9990", String(block9Lines));
  txt += line("9999", String(totalLines));

  return txt;
}

// ── Main handler ──

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: companyUser } = await serviceClient
      .from("company_users")
      .select("company_id, role")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .in("role", ["admin", "gerente"])
      .limit(1)
      .single();

    if (!companyUser) {
      return new Response(JSON.stringify({ error: "Sem permissão" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const companyId = companyUser.company_id;
    const body = await req.json().catch(() => ({}));

    const now = new Date();
    const year = body.year || now.getFullYear();
    const month = body.month || now.getMonth() + 1;
    const startDate = `${year}-${pad(month, 2)}-01`;
    const endDate = new Date(year, month, 0).toISOString().slice(0, 10);

    // Create job record
    const { data: job, error: jobErr } = await serviceClient
      .from("processing_jobs")
      .insert({
        company_id: companyId,
        type: "sped",
        status: "processing",
        progress: 0,
        created_by: user.id,
        params: { year, month },
      })
      .select()
      .single();

    if (jobErr || !job) {
      return new Response(JSON.stringify({ error: "Falha ao criar job" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Process in background
    const processPromise = (async () => {
      try {
        // Fetch company
        const { data: company } = await serviceClient
          .from("companies")
          .select("*")
          .eq("id", companyId)
          .single();

        await serviceClient.from("processing_jobs").update({ progress: 20 }).eq("id", job.id);

        // Fetch fiscal docs
        const { data: docs } = await serviceClient
          .from("fiscal_documents")
          .select("*")
          .eq("company_id", companyId)
          .gte("created_at", startDate)
          .lte("created_at", endDate + "T23:59:59")
          .order("created_at", { ascending: true });

        await serviceClient.from("processing_jobs").update({ progress: 50 }).eq("id", job.id);

        // Fetch products
        const { data: products } = await serviceClient
          .from("products")
          .select("id, name, sku, barcode, ncm, unit")
          .eq("company_id", companyId);

        // Fetch financial entries
        const { data: financials } = await serviceClient
          .from("financial_entries")
          .select("*")
          .eq("company_id", companyId)
          .gte("due_date", startDate)
          .lte("due_date", endDate);

        await serviceClient.from("processing_jobs").update({ progress: 70 }).eq("id", job.id);

        // Generate SPED
        const spedContent = generateSpedFiscal({
          company: company || {},
          docs: docs || [],
          financials: financials || [],
          products: products || [],
          startDate,
          endDate,
        });

        await serviceClient.from("processing_jobs").update({ progress: 90 }).eq("id", job.id);

        // Upload to storage
        const fileName = `${companyId}/SPED_${year}_${pad(month, 2)}.txt`;
        const fileBytes = new TextEncoder().encode(spedContent);

        await serviceClient.storage
          .from("company-backups")
          .upload(fileName, fileBytes, {
            contentType: "text/plain",
            upsert: true,
          });

        await serviceClient.from("processing_jobs").update({
          status: "completed",
          progress: 100,
          result: {
            file_path: fileName,
            file_size: fileBytes.length,
            period: `${pad(month, 2)}/${year}`,
            docs_count: (docs || []).filter(d => d.status === "autorizada").length,
            products_count: (products || []).length,
          },
        }).eq("id", job.id);

      } catch (err) {
        console.error("SPED generation error:", err);
        await serviceClient.from("processing_jobs").update({
          status: "failed",
          error: String(err),
        }).eq("id", job.id);
      }
    })();

    // Use EdgeRuntime.waitUntil if available, otherwise await
    if (typeof (globalThis as any).EdgeRuntime !== "undefined" && (globalThis as any).EdgeRuntime.waitUntil) {
      (globalThis as any).EdgeRuntime.waitUntil(processPromise);
    } else {
      await processPromise;
    }

    return new Response(JSON.stringify({
      success: true,
      job_id: job.id,
      period: `${pad(month, 2)}/${year}`,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("SPED error:", err);
    return new Response(JSON.stringify({ error: "Erro interno", details: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

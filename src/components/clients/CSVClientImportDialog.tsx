import { useRef, useState } from "react";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCreateClient } from "@/hooks/useClients";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedClient {
  name: string;
  cpf_cnpj?: string;
  tipo_pessoa: string;
  email?: string;
  phone?: string;
  phone2?: string;
  trade_name?: string;
  ie?: string;
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  notes?: string;
}

export function CSVClientImportDialog({ open, onOpenChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedClient[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const createClient = useCreateClient();

  const parseCSV = (text: string) => {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      setErrors(["Arquivo vazio ou sem dados"]);
      return;
    }

    const header = lines[0].toLowerCase().split(";").map(h => h.trim());

    const nameIdx = header.findIndex(h => h.includes("nome") || h.includes("razao") || h === "name");
    const docIdx = header.findIndex(h => h.includes("cpf") || h.includes("cnpj") || h.includes("documento"));
    const emailIdx = header.findIndex(h => h.includes("email") || h.includes("e-mail"));
    const phoneIdx = header.findIndex(h => h.includes("telefone") || h.includes("phone") || h.includes("celular") || h.includes("fone"));
    const phone2Idx = header.findIndex(h => h.includes("telefone2") || h.includes("phone2") || h.includes("fone2"));
    const tradeIdx = header.findIndex(h => h.includes("fantasia") || h.includes("apelido") || h.includes("trade"));
    const ieIdx = header.findIndex(h => h.includes("ie") || h.includes("inscricao"));
    const streetIdx = header.findIndex(h => h.includes("rua") || h.includes("endereco") || h.includes("logradouro") || h.includes("street"));
    const numIdx = header.findIndex(h => h.includes("numero") || h.includes("nro") || h === "num");
    const compIdx = header.findIndex(h => h.includes("complemento") || h.includes("compl"));
    const neighIdx = header.findIndex(h => h.includes("bairro") || h.includes("neighborhood"));
    const cityIdx = header.findIndex(h => h.includes("cidade") || h.includes("municipio") || h.includes("city"));
    const stateIdx = header.findIndex(h => h.includes("uf") || h.includes("estado") || h.includes("state"));
    const zipIdx = header.findIndex(h => h.includes("cep") || h.includes("zip"));
    const notesIdx = header.findIndex(h => h.includes("obs") || h.includes("nota") || h.includes("notes"));
    const tipoIdx = header.findIndex(h => h.includes("tipo") || h.includes("pessoa"));

    if (nameIdx === -1) {
      setErrors(["Coluna obrigatória não encontrada: nome"]);
      return;
    }

    const parsed: ParsedClient[] = [];
    const errs: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(";").map(c => c.trim());
      const name = cols[nameIdx];
      if (!name) {
        errs.push(`Linha ${i + 1}: nome vazio`);
        continue;
      }

      const doc = docIdx >= 0 ? cols[docIdx]?.replace(/\D/g, "") : undefined;
      let tipo_pessoa = "pf";
      if (tipoIdx >= 0) {
        const tipoVal = cols[tipoIdx]?.toLowerCase();
        tipo_pessoa = tipoVal?.includes("pj") || tipoVal?.includes("juridica") ? "pj" : "pf";
      } else if (doc && doc.length === 14) {
        tipo_pessoa = "pj";
      }

      parsed.push({
        name,
        cpf_cnpj: doc || undefined,
        tipo_pessoa,
        email: emailIdx >= 0 ? cols[emailIdx] || undefined : undefined,
        phone: phoneIdx >= 0 ? cols[phoneIdx] || undefined : undefined,
        phone2: phone2Idx >= 0 ? cols[phone2Idx] || undefined : undefined,
        trade_name: tradeIdx >= 0 ? cols[tradeIdx] || undefined : undefined,
        ie: ieIdx >= 0 ? cols[ieIdx] || undefined : undefined,
        address_street: streetIdx >= 0 ? cols[streetIdx] || undefined : undefined,
        address_number: numIdx >= 0 ? cols[numIdx] || undefined : undefined,
        address_complement: compIdx >= 0 ? cols[compIdx] || undefined : undefined,
        address_neighborhood: neighIdx >= 0 ? cols[neighIdx] || undefined : undefined,
        address_city: cityIdx >= 0 ? cols[cityIdx] || undefined : undefined,
        address_state: stateIdx >= 0 ? cols[stateIdx] || undefined : undefined,
        address_zip: zipIdx >= 0 ? cols[zipIdx]?.replace(/\D/g, "") || undefined : undefined,
        notes: notesIdx >= 0 ? cols[notesIdx] || undefined : undefined,
      });
    }

    setRows(parsed);
    setErrors(errs);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRows([]);
    setErrors([]);
    setDone(false);
    const reader = new FileReader();
    reader.onload = (ev) => parseCSV(ev.target?.result as string);
    reader.readAsText(file, "UTF-8");
  };

  const handleImport = async () => {
    setImporting(true);
    let success = 0;
    const errs: string[] = [];
    for (const row of rows) {
      try {
        await createClient.mutateAsync(row);
        success++;
      } catch (e: any) {
        errs.push(`${row.name}: ${e.message}`);
      }
    }
    setImporting(false);
    setDone(true);
    if (errs.length) setErrors(errs);
    toast.success(`${success} de ${rows.length} clientes importados`);
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      setRows([]);
      setErrors([]);
      setDone(false);
    }
    onOpenChange(v);
  };

  const downloadTemplate = () => {
    const BOM = "\uFEFF"; // BOM para Excel abrir com acentos corretos
    const header = "tipo_pessoa;nome;nome_fantasia;cpf_cnpj;inscricao_estadual;email;telefone;telefone2;rua;numero;complemento;bairro;cidade;uf;cep;observacoes";
    const examples = [
      "pf;João da Silva;Joãozinho;12345678901;;joao@email.com;(11) 99999-8888;;Rua das Flores;100;Apto 12;Centro;São Paulo;SP;01001000;Cliente fiel",
      "pj;Comércio ABC Ltda;ABC Materiais;12345678000199;123456789;contato@abc.com.br;(11) 3333-4444;(11) 3333-5555;Av. Paulista;1000;Sala 501;Bela Vista;São Paulo;SP;01310100;Atacado",
      "pf;Maria Oliveira;;98765432100;;maria@gmail.com;(21) 98888-7777;;Rua do Catete;200;;Catete;Rio de Janeiro;RJ;22220000;",
    ];
    const content = BOM + header + "\n" + examples.join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo_clientes.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar Clientes (CSV)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border-2 border-dashed border-border p-6 text-center">
            <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Arquivo CSV separado por <code className="bg-muted px-1 rounded">;</code>
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Colunas: nome; cpf_cnpj; email; telefone; cidade; uf; rua; numero; bairro; cep; observações
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Selecionar Arquivo
              </Button>
              <Button variant="ghost" size="sm" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Modelo CSV
              </Button>
            </div>
            <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
          </div>

          {rows.length > 0 && !done && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm font-medium text-foreground">{rows.length} clientes encontrados</p>
              <p className="text-xs text-muted-foreground mt-1">
                Prévia: {rows.slice(0, 3).map(r => r.name).join(", ")}{rows.length > 3 ? "..." : ""}
              </p>
              <Button className="mt-3 w-full" onClick={handleImport} disabled={importing}>
                {importing ? "Importando..." : `Importar ${rows.length} Clientes`}
              </Button>
            </div>
          )}

          {done && (
            <div className="flex items-center gap-2 rounded-lg bg-accent p-3">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <p className="text-sm font-medium text-foreground">Importação concluída!</p>
            </div>
          )}

          {errors.length > 0 && (
            <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3 max-h-32 overflow-y-auto">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <span className="text-xs font-medium text-destructive">{errors.length} erros</span>
              </div>
              {errors.map((e, i) => (
                <p key={i} className="text-xs text-muted-foreground">{e}</p>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

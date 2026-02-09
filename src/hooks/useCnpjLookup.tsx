import { useState } from "react";
import { toast } from "sonner";

interface CnpjData {
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  email: string;
  ddd_telefone_1: string;
  codigo_ibge_municipio?: string;
  // QSA fields
  qsa?: { nome_socio: string }[];
}

export interface CnpjResult {
  name: string;
  trade_name: string;
  cnpj: string;
  email: string;
  phone: string;
  address_street: string;
  address_number: string;
  address_complement: string;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  address_ibge_code: string;
  contact_name: string;
}

function cleanCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, "");
}

export function useCnpjLookup() {
  const [loading, setLoading] = useState(false);

  const lookup = async (cnpj: string): Promise<CnpjResult | null> => {
    const clean = cleanCnpj(cnpj);
    if (clean.length !== 14) {
      toast.error("CNPJ deve ter 14 dígitos");
      return null;
    }

    setLoading(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`);
      if (!res.ok) {
        toast.error("CNPJ não encontrado");
        return null;
      }
      const data: CnpjData = await res.json();

      const result: CnpjResult = {
        name: data.razao_social || "",
        trade_name: data.nome_fantasia || "",
        cnpj: clean,
        email: data.email || "",
        phone: data.ddd_telefone_1 || "",
        address_street: data.logradouro || "",
        address_number: data.numero || "",
        address_complement: data.complemento || "",
        address_neighborhood: data.bairro || "",
        address_city: data.municipio || "",
        address_state: data.uf || "",
        address_zip: data.cep || "",
        address_ibge_code: data.codigo_ibge_municipio ? String(data.codigo_ibge_municipio) : "",
        contact_name: data.qsa?.[0]?.nome_socio || "",
      };

      toast.success("Dados do CNPJ carregados!");
      return result;
    } catch {
      toast.error("Erro ao consultar CNPJ");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { lookup, loading };
}

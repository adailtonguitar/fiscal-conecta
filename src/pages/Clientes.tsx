import { Users } from "lucide-react";
import { CrudPage, type FieldConfig } from "@/components/cadastro/CrudPage";
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from "@/hooks/useClients";
import { useCallback } from "react";

const baseFields: FieldConfig[] = [
  {
    key: "tipo_pessoa",
    label: "Tipo de Pessoa",
    type: "select",
    required: true,
    options: [
      { value: "pf", label: "Pessoa Física" },
      { value: "pj", label: "Pessoa Jurídica" },
    ],
    showInTable: false,
  },
  { key: "name", label: "Nome / Razão Social", required: true, showInTable: true, colSpan: 2 },
  { key: "trade_name", label: "Nome Fantasia" },
  { key: "cpf_cnpj", label: "CPF", required: true, showInTable: true },
  { key: "ie", label: "Inscrição Estadual" },
  { key: "email", label: "E-mail", type: "email", showInTable: true },
  { key: "phone", label: "Telefone", type: "tel", showInTable: true },
  { key: "phone2", label: "Telefone 2", type: "tel" },
  { key: "credit_limit", label: "Limite de Crédito (R$)", type: "number" },
  { key: "credit_balance", label: "Saldo Devedor (R$)", type: "number", showInTable: true },
  { key: "address_street", label: "Rua" },
  { key: "address_number", label: "Número" },
  { key: "address_complement", label: "Complemento" },
  { key: "address_neighborhood", label: "Bairro" },
  { key: "address_city", label: "Cidade", showInTable: true },
  { key: "address_state", label: "UF" },
  { key: "address_zip", label: "CEP" },
  { key: "notes", label: "Observações", type: "textarea", colSpan: 2, showInTable: true },
];

function cleanDoc(value: string) {
  return (value || "").replace(/\D/g, "");
}

export default function Clientes() {
  const { data = [], isLoading } = useClients();
  const create = useCreateClient();
  const update = useUpdateClient();
  const del = useDeleteClient();

  const getFields = useCallback((formData: Record<string, any>): FieldConfig[] => {
    const isPJ = formData.tipo_pessoa === "pj";
    return baseFields.map((f) => {
      if (f.key === "cpf_cnpj") {
        return {
          ...f,
          label: isPJ ? "CNPJ" : "CPF",
          placeholder: isPJ ? "00.000.000/0000-00" : "000.000.000-00",
          cnpjLookup: isPJ,
        };
      }
      if (f.key === "name") {
        return { ...f, label: isPJ ? "Razão Social" : "Nome Completo" };
      }
      if (f.key === "trade_name") {
        return { ...f, label: isPJ ? "Nome Fantasia" : "Apelido" };
      }
      return f;
    });
  }, []);

  const onValidate = useCallback((data: Record<string, any>): string | null => {
    const isPJ = data.tipo_pessoa === "pj";
    const doc = cleanDoc(data.cpf_cnpj);
    if (isPJ && doc.length !== 14) {
      return "CNPJ deve ter 14 dígitos";
    }
    if (!isPJ && doc.length !== 11) {
      return "CPF deve ter 11 dígitos";
    }
    return null;
  }, []);

  return (
    <CrudPage
      title="Clientes"
      icon={<Users className="w-5 h-5" />}
      data={data}
      isLoading={isLoading}
      fields={baseFields}
      getFields={getFields}
      onValidate={onValidate}
      onCreate={(d) => create.mutateAsync(d as any)}
      onUpdate={(d) => update.mutateAsync(d as any)}
      onDelete={(id) => del.mutateAsync(id)}
      searchKeys={["name", "cpf_cnpj", "email"] as any}
      cnpjFieldMap={{ name: "name", trade_name: "trade_name", email: "email", phone: "phone", address_street: "address_street", address_number: "address_number", address_complement: "address_complement", address_neighborhood: "address_neighborhood", address_city: "address_city", address_state: "address_state", address_zip: "address_zip" }}
    />
  );
}

import { Users } from "lucide-react";
import { CrudPage, type FieldConfig } from "@/components/cadastro/CrudPage";
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from "@/hooks/useClients";

const fields: FieldConfig[] = [
  { key: "name", label: "Nome / Razão Social", required: true, showInTable: true, colSpan: 2 },
  { key: "trade_name", label: "Nome Fantasia" },
  { key: "cpf_cnpj", label: "CPF / CNPJ", showInTable: true, cnpjLookup: true },
  { key: "ie", label: "Inscrição Estadual" },
  { key: "email", label: "E-mail", type: "email", showInTable: true },
  { key: "phone", label: "Telefone", type: "tel", showInTable: true },
  { key: "phone2", label: "Telefone 2", type: "tel" },
  { key: "address_street", label: "Rua" },
  { key: "address_number", label: "Número" },
  { key: "address_complement", label: "Complemento" },
  { key: "address_neighborhood", label: "Bairro" },
  { key: "address_city", label: "Cidade", showInTable: true },
  { key: "address_state", label: "UF" },
  { key: "address_zip", label: "CEP" },
  { key: "notes", label: "Observações", colSpan: 2 },
];

export default function Clientes() {
  const { data = [], isLoading } = useClients();
  const create = useCreateClient();
  const update = useUpdateClient();
  const del = useDeleteClient();

  return (
    <CrudPage
      title="Clientes"
      icon={<Users className="w-5 h-5" />}
      data={data}
      isLoading={isLoading}
      fields={fields}
      onCreate={(d) => create.mutateAsync(d as any)}
      onUpdate={(d) => update.mutateAsync(d as any)}
      onDelete={(id) => del.mutateAsync(id)}
      searchKeys={["name", "cpf_cnpj", "email"] as any}
      cnpjFieldMap={{ name: "name", trade_name: "trade_name", email: "email", phone: "phone", address_street: "address_street", address_number: "address_number", address_complement: "address_complement", address_neighborhood: "address_neighborhood", address_city: "address_city", address_state: "address_state", address_zip: "address_zip" }}
    />
  );
}

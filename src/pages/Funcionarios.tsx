import { UserCheck } from "lucide-react";
import { CrudPage, type FieldConfig } from "@/components/cadastro/CrudPage";
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from "@/hooks/useEmployees";
import { useCallback } from "react";
import { validateDoc } from "@/lib/cpf-cnpj-validator";

const fields: FieldConfig[] = [
  { key: "name", label: "Nome Completo", required: true, showInTable: true, colSpan: 2 },
  { key: "cpf", label: "CPF", showInTable: true },
  { key: "rg", label: "RG" },
  { key: "role", label: "Cargo", showInTable: true },
  { key: "department", label: "Departamento", showInTable: true },
  { key: "email", label: "E-mail", type: "email" },
  { key: "phone", label: "Telefone", type: "tel", showInTable: true },
  { key: "admission_date", label: "Data de Admissão", type: "date" },
  { key: "salary", label: "Salário (R$)", type: "currency" },
  { key: "commission_rate", label: "Comissão (%)", type: "number" },
  { key: "address_street", label: "Rua" },
  { key: "address_number", label: "Número" },
  { key: "address_city", label: "Cidade" },
  { key: "address_state", label: "UF" },
  { key: "address_zip", label: "CEP" },
  { key: "notes", label: "Observações", colSpan: 2 },
];

export default function Funcionarios() {
  const { data = [], isLoading } = useEmployees();
  const create = useCreateEmployee();
  const update = useUpdateEmployee();
  const del = useDeleteEmployee();

  const onValidate = useCallback((data: Record<string, any>): string | null => {
    const cpf = (data.cpf || "").replace(/\D/g, "");
    if (!cpf) return null;
    const result = validateDoc(cpf);
    if (!result.valid) return result.error || "CPF inválido";
    return null;
  }, []);

  return (
    <CrudPage
      title="Funcionários"
      icon={<UserCheck className="w-5 h-5" />}
      data={data}
      isLoading={isLoading}
      fields={fields}
      onValidate={onValidate}
      onCreate={(d) => create.mutateAsync(d as any)}
      onUpdate={(d) => update.mutateAsync(d as any)}
      onDelete={(id) => del.mutateAsync(id)}
      searchKeys={["name", "cpf", "role"] as any}
    />
  );
}

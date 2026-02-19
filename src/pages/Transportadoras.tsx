import { Truck } from "lucide-react";
import { CrudPage, type FieldConfig } from "@/components/cadastro/CrudPage";
import { useCarriers, useCreateCarrier, useUpdateCarrier, useDeleteCarrier } from "@/hooks/useCarriers";
import { useCallback } from "react";
import { validateDoc } from "@/lib/cpf-cnpj-validator";

const fields: FieldConfig[] = [
  { key: "name", label: "Razão Social", required: true, showInTable: true, colSpan: 2 },
  { key: "trade_name", label: "Nome Fantasia" },
  { key: "cnpj", label: "CNPJ", showInTable: true, cnpjLookup: true },
  { key: "ie", label: "Inscrição Estadual" },
  { key: "email", label: "E-mail", type: "email" },
  { key: "phone", label: "Telefone", type: "tel", showInTable: true },
  { key: "antt_code", label: "Código ANTT", showInTable: true },
  { key: "vehicle_plate", label: "Placa do Veículo", showInTable: true },
  { key: "address_street", label: "Rua" },
  { key: "address_city", label: "Cidade" },
  { key: "address_state", label: "UF" },
  { key: "address_zip", label: "CEP" },
  { key: "notes", label: "Observações", colSpan: 2 },
];

export default function Transportadoras() {
  const { data = [], isLoading } = useCarriers();
  const create = useCreateCarrier();
  const update = useUpdateCarrier();
  const del = useDeleteCarrier();

  const onValidate = useCallback((data: Record<string, any>): string | null => {
    const cnpj = (data.cnpj || "").replace(/\D/g, "");
    if (!cnpj) return null;
    const result = validateDoc(cnpj);
    if (!result.valid) return result.error || "CNPJ inválido";
    return null;
  }, []);

  return (
    <CrudPage
      title="Transportadoras"
      icon={<Truck className="w-5 h-5" />}
      data={data}
      isLoading={isLoading}
      fields={fields}
      onValidate={onValidate}
      onCreate={(d) => create.mutateAsync(d as any)}
      onUpdate={(d) => update.mutateAsync(d as any)}
      onDelete={(id) => del.mutateAsync(id)}
      searchKeys={["name", "cnpj", "antt_code"] as any}
    />
  );
}

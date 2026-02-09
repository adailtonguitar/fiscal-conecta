import { Truck } from "lucide-react";
import { CrudPage, type FieldConfig } from "@/components/cadastro/CrudPage";
import { useCarriers, useCreateCarrier, useUpdateCarrier, useDeleteCarrier } from "@/hooks/useCarriers";

const fields: FieldConfig[] = [
  { key: "name", label: "Razão Social", required: true, showInTable: true, colSpan: 2 },
  { key: "trade_name", label: "Nome Fantasia" },
  { key: "cnpj", label: "CNPJ", showInTable: true },
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

  return (
    <CrudPage
      title="Transportadoras"
      icon={<Truck className="w-5 h-5" />}
      data={data}
      isLoading={isLoading}
      fields={fields}
      onCreate={(d) => create.mutateAsync(d as any)}
      onUpdate={(d) => update.mutateAsync(d as any)}
      onDelete={(id) => del.mutateAsync(id)}
      searchKeys={["name", "cnpj", "antt_code"] as any}
    />
  );
}

import { useState } from "react";
import { Tags, FolderTree } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CrudPage, type FieldConfig } from "@/components/cadastro/CrudPage";
import { useProductCategories, useCreateProductCategory, useUpdateProductCategory, useDeleteProductCategory } from "@/hooks/useProductCategories";
import { useFiscalCategories, useCreateFiscalCategory, useUpdateFiscalCategory, useDeleteFiscalCategory } from "@/hooks/useFiscalCategories";

const categoryFields: FieldConfig[] = [
  { key: "name", label: "Nome", required: true, showInTable: true },
  { key: "description", label: "Descrição", showInTable: true, colSpan: 2 },
];

const fiscalFields: FieldConfig[] = [
  { key: "name", label: "Nome", required: true, showInTable: true },
  { key: "regime", label: "Regime", required: true, showInTable: true, type: "select", options: [
    { value: "simples_nacional", label: "Simples Nacional" },
    { value: "lucro_presumido", label: "Lucro Presumido" },
    { value: "lucro_real", label: "Lucro Real" },
  ]},
  { key: "operation_type", label: "Operação", required: true, showInTable: true, type: "select", options: [
    { value: "interna", label: "Interna" },
    { value: "interestadual", label: "Interestadual" },
  ]},
  { key: "product_type", label: "Tipo Produto", required: true, showInTable: true, type: "select", options: [
    { value: "normal", label: "Normal" },
    { value: "st", label: "Substituição Tributária" },
  ]},
  { key: "cfop", label: "CFOP", required: true, showInTable: true },
  { key: "ncm", label: "NCM" },
  { key: "cest", label: "CEST" },
  { key: "csosn", label: "CSOSN" },
  { key: "cst_icms", label: "CST ICMS" },
  { key: "icms_rate", label: "Alíq. ICMS %", type: "number" },
  { key: "icms_st_rate", label: "Alíq. ICMS ST %", type: "number" },
  { key: "mva", label: "MVA %", type: "number" },
  { key: "pis_rate", label: "Alíq. PIS %", type: "number" },
  { key: "cofins_rate", label: "Alíq. COFINS %", type: "number" },
  { key: "ipi_rate", label: "Alíq. IPI %", type: "number" },
];

export default function Categorias() {
  const [tab, setTab] = useState("product");

  const prodCats = useProductCategories();
  const createProdCat = useCreateProductCategory();
  const updateProdCat = useUpdateProductCategory();
  const deleteProdCat = useDeleteProductCategory();

  const fiscalCats = useFiscalCategories();
  const createFiscalCat = useCreateFiscalCategory();
  const updateFiscalCat = useUpdateFiscalCategory();
  const deleteFiscalCat = useDeleteFiscalCategory();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="product" className="gap-2">
            <FolderTree className="w-4 h-4" />
            Categorias de Produto
          </TabsTrigger>
          <TabsTrigger value="fiscal" className="gap-2">
            <Tags className="w-4 h-4" />
            Categorias Fiscais
          </TabsTrigger>
        </TabsList>

        <TabsContent value="product">
          <CrudPage
            title="Categorias de Produto"
            icon={<FolderTree className="w-5 h-5" />}
            data={prodCats.data ?? []}
            isLoading={prodCats.isLoading}
            fields={categoryFields}
            onCreate={(d) => createProdCat.mutateAsync(d as any)}
            onUpdate={(d) => updateProdCat.mutateAsync(d as any)}
            onDelete={(id) => deleteProdCat.mutateAsync(id)}
          />
        </TabsContent>

        <TabsContent value="fiscal">
          <CrudPage
            title="Categorias Fiscais"
            icon={<Tags className="w-5 h-5" />}
            data={fiscalCats.data ?? []}
            isLoading={fiscalCats.isLoading}
            fields={fiscalFields}
            onCreate={(d) => createFiscalCat.mutateAsync(d as any)}
            onUpdate={(d) => updateFiscalCat.mutateAsync(d as any)}
            onDelete={(id) => deleteFiscalCat.mutateAsync(id)}
            searchKeys={["name", "cfop"] as any}
            nameKey={"name" as any}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

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
  { key: "type", label: "Tipo", required: true, showInTable: true, type: "select", options: [
    { value: "ncm", label: "NCM" },
    { value: "cfop", label: "CFOP" },
    { value: "cst_icms", label: "CST ICMS" },
    { value: "cst_pis", label: "CST PIS" },
    { value: "cst_cofins", label: "CST COFINS" },
    { value: "csosn", label: "CSOSN" },
  ]},
  { key: "code", label: "Código", required: true, showInTable: true },
  { key: "description", label: "Descrição", required: true, showInTable: true, colSpan: 2 },
  { key: "tax_rate", label: "Alíquota %", type: "number", showInTable: true },
  { key: "notes", label: "Observações", colSpan: 2 },
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
            searchKeys={["code", "description"] as any}
            nameKey={"description" as any}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

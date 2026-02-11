import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import type { ProductLabel } from "@/hooks/useProductLabels";

interface LabelPreviewProps {
  labels: ProductLabel[];
  onPrintDone: (ids: string[]) => void;
}

export function LabelPreview({ labels, onPrintDone }: LabelPreviewProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Permita pop-ups para imprimir.");
      return;
    }

    printWindow.document.write(`
      <html>
      <head>
        <title>Etiquetas de Gôndola</title>
        <style>
          @page { margin: 4mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, Helvetica, sans-serif; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; }
          .label {
            border: 1px solid #000;
            padding: 3mm;
            text-align: center;
            page-break-inside: avoid;
            min-height: 28mm;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .name { font-size: 10pt; font-weight: bold; line-height: 1.2; margin-bottom: 2mm; }
          .price { font-size: 18pt; font-weight: bold; }
          .unit { font-size: 8pt; color: #555; }
          .barcode { font-size: 7pt; color: #888; margin-top: 1mm; }
        </style>
      </head>
      <body>
        <div class="grid">
          ${labels.map((l) => {
            const p = l.product;
            if (!p) return "";
            return `
              <div class="label">
                <div class="name">${p.name}</div>
                <div class="price">R$ ${p.price.toFixed(2).replace(".", ",")}</div>
                <div class="unit">${p.unit}</div>
                ${p.barcode ? `<div class="barcode">${p.barcode}</div>` : ""}
              </div>
            `;
          }).join("")}
        </div>
        <script>window.onload = () => { window.print(); window.close(); }<\/script>
      </body>
      </html>
    `);
    printWindow.document.close();

    onPrintDone(labels.map((l) => l.id));
  };

  if (labels.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {labels.length} etiqueta(s) selecionada(s)
        </p>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="w-4 h-4" />
          Imprimir Etiquetas
        </Button>
      </div>

      {/* Visual preview */}
      <div ref={printRef} className="grid grid-cols-3 gap-2 max-h-[400px] overflow-auto border rounded-lg p-3 bg-white">
        {labels.map((l) => {
          const p = l.product;
          if (!p) return null;
          return (
            <div
              key={l.id}
              className="border border-foreground/30 rounded p-2 text-center flex flex-col justify-center min-h-[90px]"
            >
              <p className="text-[10px] font-bold leading-tight text-foreground">{p.name}</p>
              <p className="text-lg font-bold text-foreground mt-1">
                R$ {p.price.toFixed(2).replace(".", ",")}
              </p>
              <p className="text-[8px] text-muted-foreground">{p.unit}</p>
              {p.barcode && (
                <p className="text-[7px] text-muted-foreground mt-0.5">{p.barcode}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer } from "lucide-react";
import type { ProductLabel } from "@/hooks/useProductLabels";

type LabelFormat = "gondola" | "adesiva" | "prateleira" | "balanca";

const formatInfo: Record<LabelFormat, { name: string; desc: string; cols: number }> = {
  gondola: { name: "Gôndola", desc: "Padrão (3 colunas)", cols: 3 },
  adesiva: { name: "Adesiva 26×12mm", desc: "Pequena, colar no produto", cols: 5 },
  prateleira: { name: "Prateleira 65×30mm", desc: "Régua horizontal", cols: 2 },
  balanca: { name: "Balança 40×60mm", desc: "Pesáveis, com código de barras", cols: 3 },
};

interface LabelPreviewProps {
  labels: ProductLabel[];
  onPrintDone: (ids: string[]) => void;
}

function buildPrintStyles(format: LabelFormat): string {
  const base = `
    @page { margin: 4mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; }
  `;

  switch (format) {
    case "gondola":
      return `${base}
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; }
        .label { border: 1px solid #000; padding: 3mm; text-align: center; page-break-inside: avoid; min-height: 28mm; display: flex; flex-direction: column; justify-content: center; }
        .name { font-size: 10pt; font-weight: bold; line-height: 1.2; margin-bottom: 2mm; }
        .price { font-size: 18pt; font-weight: bold; }
        .unit { font-size: 8pt; color: #555; }
        .barcode { font-size: 7pt; color: #888; margin-top: 1mm; }
      `;
    case "adesiva":
      return `${base}
        .grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 2mm; }
        .label { border: 1px dashed #999; padding: 1.5mm; text-align: center; page-break-inside: avoid; min-height: 12mm; display: flex; flex-direction: column; justify-content: center; }
        .name { font-size: 6pt; font-weight: bold; line-height: 1.1; margin-bottom: 0.5mm; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
        .price { font-size: 10pt; font-weight: bold; }
        .unit { display: none; }
        .barcode { font-size: 5pt; color: #888; margin-top: 0.5mm; }
      `;
    case "prateleira":
      return `${base}
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 3mm; }
        .label { border: 1px solid #000; padding: 2mm 4mm; page-break-inside: avoid; min-height: 30mm; display: flex; flex-direction: row; align-items: center; justify-content: space-between; gap: 3mm; }
        .label-left { flex: 1; text-align: left; }
        .name { font-size: 9pt; font-weight: bold; line-height: 1.2; }
        .unit { font-size: 7pt; color: #555; margin-top: 1mm; }
        .barcode { font-size: 6pt; color: #888; margin-top: 1mm; }
        .price { font-size: 20pt; font-weight: bold; white-space: nowrap; }
      `;
    case "balanca":
      return `${base}
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; }
        .label { border: 1px solid #000; padding: 2.5mm; text-align: center; page-break-inside: avoid; min-height: 40mm; display: flex; flex-direction: column; justify-content: center; }
        .name { font-size: 9pt; font-weight: bold; line-height: 1.2; margin-bottom: 1.5mm; }
        .price { font-size: 16pt; font-weight: bold; }
        .unit { font-size: 8pt; color: #555; margin-top: 0.5mm; }
        .barcode { font-size: 8pt; color: #333; margin-top: 2mm; font-family: monospace; letter-spacing: 1px; }
        .sku { font-size: 6pt; color: #888; margin-top: 1mm; }
      `;
  }
}

function buildLabelHTML(label: ProductLabel, format: LabelFormat): string {
  const p = label.product;
  if (!p) return "";
  const priceStr = `R$ ${p.price.toFixed(2).replace(".", ",")}`;

  switch (format) {
    case "gondola":
      return `<div class="label">
        <div class="name">${p.name}</div>
        <div class="price">${priceStr}</div>
        <div class="unit">${p.unit}</div>
        ${p.barcode ? `<div class="barcode">${p.barcode}</div>` : ""}
      </div>`;
    case "adesiva":
      return `<div class="label">
        <div class="name">${p.name}</div>
        <div class="price">${priceStr}</div>
        ${p.barcode ? `<div class="barcode">${p.barcode}</div>` : ""}
      </div>`;
    case "prateleira":
      return `<div class="label">
        <div class="label-left">
          <div class="name">${p.name}</div>
          <div class="unit">${p.unit}</div>
          ${p.barcode ? `<div class="barcode">${p.barcode}</div>` : ""}
        </div>
        <div class="price">${priceStr}</div>
      </div>`;
    case "balanca":
      return `<div class="label">
        <div class="name">${p.name}</div>
        <div class="price">${priceStr}</div>
        <div class="unit">/ ${p.unit}</div>
        ${p.barcode ? `<div class="barcode">${p.barcode}</div>` : ""}
        <div class="sku">SKU: ${p.sku}</div>
      </div>`;
  }
}

const formatNames: Record<LabelFormat, string> = {
  gondola: "Gôndola",
  adesiva: "Adesiva",
  prateleira: "Prateleira",
  balanca: "Balança",
};

export function LabelPreview({ labels, onPrintDone }: LabelPreviewProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [format, setFormat] = useState<LabelFormat>("gondola");

  const info = formatInfo[format];

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Permita pop-ups para imprimir.");
      return;
    }

    printWindow.document.write(`
      <html>
      <head>
        <title>Etiquetas — ${formatNames[format]}</title>
        <style>${buildPrintStyles(format)}</style>
      </head>
      <body>
        <div class="grid">
          ${labels.map((l) => buildLabelHTML(l, format)).join("")}
        </div>
        <script>window.onload = () => { window.print(); window.close(); }<\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
    onPrintDone(labels.map((l) => l.id));
  };

  if (labels.length === 0) return null;

  // Preview grid columns based on format
  const gridColsClass: Record<LabelFormat, string> = {
    gondola: "grid-cols-3",
    adesiva: "grid-cols-5",
    prateleira: "grid-cols-2",
    balanca: "grid-cols-3",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={format} onValueChange={(v) => setFormat(v as LabelFormat)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(formatInfo) as LabelFormat[]).map((key) => (
                <SelectItem key={key} value={key}>
                  <div className="flex flex-col">
                    <span className="font-medium">{formatInfo[key].name}</span>
                    <span className="text-xs text-muted-foreground">{formatInfo[key].desc}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {labels.length} etiqueta(s) selecionada(s)
          </p>
        </div>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="w-4 h-4" />
          Imprimir Etiquetas
        </Button>
      </div>

      {/* Visual preview */}
      <div ref={printRef} className={`grid ${gridColsClass[format]} gap-2 max-h-[400px] overflow-auto border rounded-lg p-3 bg-white`}>
        {labels.map((l) => {
          const p = l.product;
          if (!p) return null;

          if (format === "prateleira") {
            return (
              <div key={l.id} className="border border-foreground/30 rounded p-2 flex items-center justify-between gap-2 min-h-[80px]">
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold leading-tight text-foreground truncate">{p.name}</p>
                  <p className="text-[7px] text-muted-foreground mt-0.5">{p.unit}</p>
                  {p.barcode && <p className="text-[6px] text-muted-foreground mt-0.5">{p.barcode}</p>}
                </div>
                <p className="text-lg font-bold text-foreground whitespace-nowrap">
                  R$ {p.price.toFixed(2).replace(".", ",")}
                </p>
              </div>
            );
          }

          if (format === "adesiva") {
            return (
              <div key={l.id} className="border border-dashed border-foreground/20 rounded p-1 text-center flex flex-col justify-center min-h-[50px]">
                <p className="text-[7px] font-bold leading-tight text-foreground truncate">{p.name}</p>
                <p className="text-sm font-bold text-foreground">{p.price.toFixed(2).replace(".", ",")}</p>
                {p.barcode && <p className="text-[5px] text-muted-foreground">{p.barcode}</p>}
              </div>
            );
          }

          if (format === "balanca") {
            return (
              <div key={l.id} className="border border-foreground/30 rounded p-2 text-center flex flex-col justify-center min-h-[100px]">
                <p className="text-[9px] font-bold leading-tight text-foreground">{p.name}</p>
                <p className="text-lg font-bold text-foreground mt-1">
                  R$ {p.price.toFixed(2).replace(".", ",")}
                </p>
                <p className="text-[8px] text-muted-foreground">/ {p.unit}</p>
                {p.barcode && <p className="text-[8px] font-mono text-foreground/70 mt-1 tracking-wider">{p.barcode}</p>}
                <p className="text-[6px] text-muted-foreground mt-0.5">SKU: {p.sku}</p>
              </div>
            );
          }

          // gondola (default)
          return (
            <div key={l.id} className="border border-foreground/30 rounded p-2 text-center flex flex-col justify-center min-h-[90px]">
              <p className="text-[10px] font-bold leading-tight text-foreground">{p.name}</p>
              <p className="text-lg font-bold text-foreground mt-1">
                R$ {p.price.toFixed(2).replace(".", ",")}
              </p>
              <p className="text-[8px] text-muted-foreground">{p.unit}</p>
              {p.barcode && <p className="text-[7px] text-muted-foreground mt-0.5">{p.barcode}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

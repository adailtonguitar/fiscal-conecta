import { useState, useRef, useEffect } from "react";
import { Search, X, Package } from "lucide-react";
import type { PDVProduct } from "@/hooks/usePDV";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

interface ProductGridProps {
  products: PDVProduct[];
  loading?: boolean;
  onAddToCart: (product: PDVProduct) => void;
  companyName?: string | null;
  logoUrl?: string | null;
}

export function PDVProductGrid({ products, loading, onAddToCart, companyName, logoUrl }: ProductGridProps) {
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const categories = ["Todos", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[]];

  const filtered = products.filter((p) => {
    const matchCategory = selectedCategory === "Todos" || p.category === selectedCategory;
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode?.includes(search) ||
      (p.ncm && p.ncm.includes(search));
    return matchCategory && matchSearch;
  });

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with company logo */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-sidebar-background">
        <div className="flex items-center gap-3">
          {logoUrl && (
            <img src={logoUrl} alt={companyName || "Logo"} className="h-8 max-w-[120px] object-contain" />
          )}
          <h2 className="text-sm font-bold text-sidebar-foreground uppercase tracking-wider">
            {companyName || "Produtos"}
          </h2>
        </div>
        <span className="text-xs text-muted-foreground font-mono">{filtered.length} produtos</span>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar produto... (F3)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-pdv-search
            className="w-full pl-8 pr-8 py-2 rounded-md bg-card border border-border text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary transition-all"
          />
          {search && (
            <button
              onClick={() => { setSearch(""); inputRef.current?.focus(); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 px-2 py-1.5 overflow-x-auto border-b border-border">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 rounded text-[10px] font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product grid with photos */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-muted-foreground">Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2">
            {filtered.map((product) => (
              <button
                key={product.id}
                onClick={() => onAddToCart(product)}
                className="group flex flex-col bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 hover:shadow-md transition-all active:scale-[0.97] text-left"
              >
                {/* Product image */}
                <div className="aspect-square bg-muted/50 flex items-center justify-center overflow-hidden relative">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                  ) : (
                    <Package className="w-8 h-8 text-muted-foreground/40" />
                  )}
                  {product.stock_quantity <= 0 && (
                    <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-destructive uppercase">Sem estoque</span>
                    </div>
                  )}
                  {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
                    <div className="absolute top-1 right-1 bg-warning/90 text-warning-foreground text-[8px] font-bold px-1 py-0.5 rounded">
                      {product.stock_quantity} {product.unit}
                    </div>
                  )}
                </div>
                {/* Product info */}
                <div className="p-2 flex-1 flex flex-col gap-0.5">
                  <p className="text-[11px] font-medium text-foreground leading-tight line-clamp-2 min-h-[28px]">
                    {product.name}
                  </p>
                  <p className="text-[9px] text-muted-foreground font-mono">{product.sku}</p>
                  <p className="text-sm font-bold text-primary mt-auto">{formatCurrency(product.price)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

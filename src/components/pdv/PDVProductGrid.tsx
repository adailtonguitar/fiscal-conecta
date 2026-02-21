import { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, AlertTriangle } from "lucide-react";
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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search by 200ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 200);
    return () => clearTimeout(timer);
  }, [search]);

  const categories = useMemo(
    () => ["Todos", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[]],
    [products]
  );

  const filtered = useMemo(() => products.filter((p) => {
    const matchCategory = selectedCategory === "Todos" || p.category === selectedCategory;
    const q = debouncedSearch.toLowerCase();
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.barcode?.includes(debouncedSearch) ||
      (p.ncm && p.ncm.includes(debouncedSearch));
    return matchCategory && matchSearch;
  }), [products, selectedCategory, debouncedSearch]);

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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
            {filtered.map((product) => (
              <button
                key={product.id}
                onClick={() => onAddToCart(product)}
                className={`group flex items-center gap-2 bg-card border border-border rounded-lg px-2.5 py-2 hover:border-primary/50 hover:shadow-md transition-all active:scale-[0.97] text-left ${
                  product.stock_quantity <= 0 ? "opacity-50" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground leading-tight truncate">
                    {product.name}
                  </p>
                  <p className="text-[9px] text-muted-foreground font-mono">{product.sku}</p>
                </div>
                <div className="flex flex-col items-end flex-shrink-0">
                  <p className="text-sm font-bold text-primary">{formatCurrency(product.price)}</p>
                  {product.stock_quantity <= 0 && (
                    <span className="text-[8px] font-bold text-destructive uppercase">Sem estoque</span>
                  )}
                  {product.stock_quantity > 0 && product.stock_quantity <= (product.reorder_point || 5) && (
                    <span className="flex items-center gap-0.5 text-[8px] font-bold text-warning uppercase">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      {product.stock_quantity} {product.unit}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

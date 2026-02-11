import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import type { PDVProduct } from "@/hooks/usePDV";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

interface ProductGridProps {
  products: PDVProduct[];
  loading?: boolean;
  onAddToCart: (product: PDVProduct) => void;
}

export function PDVProductGrid({ products, loading, onAddToCart }: ProductGridProps) {
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

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

  const suggestions = search.length >= 1
    ? products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode?.includes(search) ||
        (p.ncm && p.ncm.includes(search))
      ).slice(0, 8)
    : [];

  useEffect(() => { setHighlightIdx(-1); }, [search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectProduct = (product: PDVProduct) => {
    onAddToCart(product);
    setSearch("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && highlightIdx >= 0) {
      e.preventDefault();
      e.stopPropagation();
      selectProduct(suggestions[highlightIdx]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    if (highlightIdx >= 0 && suggestionsRef.current) {
      const items = suggestionsRef.current.querySelectorAll("[data-suggestion]");
      items[highlightIdx]?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIdx]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-sidebar-background">
        <h2 className="text-xs font-bold text-sidebar-foreground uppercase tracking-wider">Lista de Produtos</h2>
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
            onChange={(e) => {
              setSearch(e.target.value);
              setShowSuggestions(e.target.value.length >= 1);
            }}
            onFocus={() => { if (search.length >= 1) setShowSuggestions(true); }}
            onKeyDown={handleKeyDown}
            data-pdv-search
            className="w-full pl-8 pr-8 py-2 rounded-md bg-card border border-border text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary transition-all"
          />
          {search && (
            <button
              onClick={() => { setSearch(""); setShowSuggestions(false); inputRef.current?.focus(); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-xl overflow-hidden max-h-64 overflow-y-auto"
            >
              {suggestions.map((product, idx) => (
                <button
                  key={product.id}
                  data-suggestion
                  onClick={() => selectProduct(product)}
                  onMouseEnter={() => setHighlightIdx(idx)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors text-xs ${
                    idx === highlightIdx ? "bg-primary/10" : "hover:bg-muted/50"
                  } ${idx > 0 ? "border-t border-border/50" : ""}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">{product.name}</div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <span className="font-mono">{product.sku}</span>
                      {product.barcode && <span>· {product.barcode}</span>}
                    </div>
                  </div>
                  <span className="font-semibold text-primary whitespace-nowrap">
                    {formatCurrency(product.price)}
                  </span>
                </button>
              ))}
            </div>
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

      {/* Product list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-muted-foreground">Nenhum produto encontrado</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-sidebar-background">
              <tr className="text-sidebar-foreground text-left">
                <th className="px-2 py-1.5 font-medium">Código</th>
                <th className="px-2 py-1.5 font-medium">NCM</th>
                <th className="px-2 py-1.5 font-medium">Descrição</th>
                <th className="px-2 py-1.5 font-medium text-right">Preço</th>
                <th className="px-2 py-1.5 font-medium text-right">Estoque</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product, i) => (
                <tr
                  key={product.id}
                  onClick={() => onAddToCart(product)}
                  className={`cursor-pointer transition-colors hover:bg-accent active:bg-primary/10 ${
                    i % 2 === 0 ? "bg-muted/30" : ""
                  }`}
                >
                  <td className="px-2 py-1.5 font-mono text-muted-foreground">{product.sku}</td>
                  <td className="px-2 py-1.5 font-mono text-muted-foreground">{product.ncm || "—"}</td>
                  <td className="px-2 py-1.5 text-foreground">{product.name}</td>
                  <td className="px-2 py-1.5 text-right font-mono font-semibold text-primary">{formatCurrency(product.price)}</td>
                  <td className="px-2 py-1.5 text-right text-muted-foreground">{product.stock_quantity} {product.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

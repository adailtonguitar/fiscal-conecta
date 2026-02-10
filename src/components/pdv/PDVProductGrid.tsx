import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { motion } from "framer-motion";
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
      p.barcode?.includes(search);
    return matchCategory && matchSearch;
  });

  // Suggestions: only when typing, max 8
  const suggestions = search.length >= 1
    ? products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode?.includes(search)
      ).slice(0, 8)
    : [];

  // Reset highlight when suggestions change
  useEffect(() => {
    setHighlightIdx(-1);
  }, [search]);

  // Close suggestions on outside click
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

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIdx >= 0 && suggestionsRef.current) {
      const items = suggestionsRef.current.querySelectorAll("[data-suggestion]");
      items[highlightIdx]?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIdx]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-pos-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pos-text-muted" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar produto, código ou código de barras... (F3)"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowSuggestions(e.target.value.length >= 1);
            }}
            onFocus={() => {
              if (search.length >= 1) setShowSuggestions(true);
            }}
            onKeyDown={handleKeyDown}
            data-pdv-search
            className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-pos-surface border border-pos-border text-pos-text placeholder:text-pos-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-pos-accent/30 focus:border-pos-accent transition-all"
          />
          {search && (
            <button
              onClick={() => { setSearch(""); setShowSuggestions(false); inputRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-pos-text-muted hover:text-pos-text transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border border-border rounded-xl shadow-xl overflow-hidden max-h-80 overflow-y-auto"
            >
              {suggestions.map((product, idx) => (
                <button
                  key={product.id}
                  data-suggestion
                  onClick={() => selectProduct(product)}
                  onMouseEnter={() => setHighlightIdx(idx)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    idx === highlightIdx
                      ? "bg-primary/10"
                      : "hover:bg-muted/50"
                  } ${idx > 0 ? "border-t border-border/50" : ""}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{product.name}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">{product.sku}</span>
                      {product.barcode && <span>· {product.barcode}</span>}
                      <span>· {product.stock_quantity} {product.unit}</span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-primary whitespace-nowrap">
                    {formatCurrency(product.price)}
                  </span>
                </button>
              ))}
              <div className="px-4 py-2 bg-muted/30 text-[10px] text-muted-foreground text-center">
                ↑↓ navegar · Enter selecionar · Esc fechar
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-pos-border">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? "bg-pos-accent text-primary-foreground"
                : "bg-pos-surface text-pos-text-muted hover:bg-pos-surface-hover hover:text-pos-text"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-pos-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-pos-text-muted">Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((product, i) => (
              <motion.button
                key={product.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => onAddToCart(product)}
                className="pos-surface rounded-xl p-4 text-left hover:bg-pos-surface-hover transition-all active:scale-[0.97] group"
              >
                <div className="text-xs text-pos-text-muted mb-1 font-mono">{product.sku}</div>
                <div className="text-sm font-medium text-pos-text mb-2 leading-tight">{product.name}</div>
                <div className="flex items-end justify-between">
                  <span className="pos-price text-lg">{formatCurrency(product.price)}</span>
                  <span className="text-[10px] text-pos-text-muted">{product.stock_quantity} {product.unit}</span>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

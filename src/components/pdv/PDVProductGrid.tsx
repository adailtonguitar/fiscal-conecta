import { useState } from "react";
import { Search } from "lucide-react";
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

  const categories = ["Todos", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[]];

  const filtered = products.filter((p) => {
    const matchCategory = selectedCategory === "Todos" || p.category === selectedCategory;
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode?.includes(search);
    return matchCategory && matchSearch;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-pos-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pos-text-muted" />
          <input
            type="text"
            placeholder="Buscar produto, código ou código de barras..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-pos-surface border border-pos-border text-pos-text placeholder:text-pos-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-pos-accent/30 focus:border-pos-accent transition-all"
          />
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

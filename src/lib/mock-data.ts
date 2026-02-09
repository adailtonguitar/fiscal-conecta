export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  sku: string;
  ncm: string;
  unit: string;
  stock: number;
  image?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Sale {
  id: string;
  items: CartItem[];
  total: number;
  paymentMethod: string;
  date: string;
  nfceNumber?: string;
  synced: boolean;
  customer?: string;
}

export const categories = [
  "Todos",
  "Bebidas",
  "Alimentos",
  "Limpeza",
  "Higiene",
  "Hortifrúti",
  "Padaria",
  "Frios",
];

export const products: Product[] = [
  { id: "1", name: "Coca-Cola 2L", price: 8.99, category: "Bebidas", sku: "BEB001", ncm: "22021000", unit: "UN", stock: 150 },
  { id: "2", name: "Água Mineral 500ml", price: 2.50, category: "Bebidas", sku: "BEB002", ncm: "22011000", unit: "UN", stock: 300 },
  { id: "3", name: "Arroz Integral 1kg", price: 7.49, category: "Alimentos", sku: "ALI001", ncm: "10063021", unit: "KG", stock: 80 },
  { id: "4", name: "Feijão Carioca 1kg", price: 8.99, category: "Alimentos", sku: "ALI002", ncm: "07133319", unit: "KG", stock: 65 },
  { id: "5", name: "Detergente Ypê 500ml", price: 2.79, category: "Limpeza", sku: "LIM001", ncm: "34022000", unit: "UN", stock: 200 },
  { id: "6", name: "Sabonete Dove 90g", price: 4.29, category: "Higiene", sku: "HIG001", ncm: "34011190", unit: "UN", stock: 120 },
  { id: "7", name: "Pão Francês (un)", price: 0.75, category: "Padaria", sku: "PAD001", ncm: "19059090", unit: "UN", stock: 500 },
  { id: "8", name: "Queijo Mussarela kg", price: 39.90, category: "Frios", sku: "FRI001", ncm: "04061010", unit: "KG", stock: 25 },
  { id: "9", name: "Presunto Cozido kg", price: 29.90, category: "Frios", sku: "FRI002", ncm: "16024900", unit: "KG", stock: 30 },
  { id: "10", name: "Banana Prata kg", price: 5.99, category: "Hortifrúti", sku: "HOR001", ncm: "08030010", unit: "KG", stock: 45 },
  { id: "11", name: "Tomate kg", price: 7.49, category: "Hortifrúti", sku: "HOR002", ncm: "07020000", unit: "KG", stock: 60 },
  { id: "12", name: "Leite Integral 1L", price: 5.49, category: "Bebidas", sku: "BEB003", ncm: "04012010", unit: "UN", stock: 180 },
  { id: "13", name: "Macarrão 500g", price: 3.99, category: "Alimentos", sku: "ALI003", ncm: "19021900", unit: "UN", stock: 90 },
  { id: "14", name: "Óleo de Soja 900ml", price: 7.99, category: "Alimentos", sku: "ALI004", ncm: "15079019", unit: "UN", stock: 70 },
  { id: "15", name: "Café 500g", price: 15.90, category: "Alimentos", sku: "ALI005", ncm: "09012100", unit: "UN", stock: 55 },
  { id: "16", name: "Suco Natural 1L", price: 9.90, category: "Bebidas", sku: "BEB004", ncm: "20091200", unit: "UN", stock: 40 },
];

export const recentSales: Sale[] = [
  {
    id: "VND-001",
    items: [
      { ...products[0], quantity: 2 },
      { ...products[6], quantity: 10 },
    ],
    total: 25.48,
    paymentMethod: "PIX",
    date: "2026-02-09T08:30:00",
    nfceNumber: "000001",
    synced: true,
  },
  {
    id: "VND-002",
    items: [
      { ...products[2], quantity: 1 },
      { ...products[3], quantity: 2 },
      { ...products[14], quantity: 1 },
    ],
    total: 41.37,
    paymentMethod: "Cartão Débito",
    date: "2026-02-09T09:15:00",
    nfceNumber: "000002",
    synced: true,
  },
  {
    id: "VND-003",
    items: [
      { ...products[7], quantity: 0.5 },
      { ...products[8], quantity: 0.3 },
    ],
    total: 28.92,
    paymentMethod: "Dinheiro",
    date: "2026-02-09T10:00:00",
    nfceNumber: "000003",
    synced: false,
  },
  {
    id: "VND-004",
    items: [
      { ...products[11], quantity: 3 },
      { ...products[14], quantity: 1 },
    ],
    total: 32.37,
    paymentMethod: "Cartão Crédito",
    date: "2026-02-09T11:20:00",
    synced: false,
  },
];

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

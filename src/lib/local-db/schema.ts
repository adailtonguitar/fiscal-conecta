/**
 * SQLite schema definitions for local-first architecture.
 * All critical tables are mirrored locally for offline operation.
 */

export const DB_NAME = "pdvfiscal_local";
export const DB_VERSION = 1 as const;

/** Schema creation SQL — executed once on first init */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  barcode TEXT,
  price REAL NOT NULL DEFAULT 0,
  cost_price REAL DEFAULT 0,
  stock_quantity REAL NOT NULL DEFAULT 0,
  min_stock REAL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'UN',
  category TEXT,
  ncm TEXT,
  cfop TEXT DEFAULT '5102',
  csosn TEXT DEFAULT '102',
  cst_icms TEXT DEFAULT '00',
  cst_pis TEXT DEFAULT '01',
  cst_cofins TEXT DEFAULT '01',
  aliq_icms REAL DEFAULT 0,
  aliq_pis REAL DEFAULT 1.65,
  aliq_cofins REAL DEFAULT 7.60,
  origem INTEGER DEFAULT 0,
  cest TEXT,
  gtin_tributavel TEXT,
  fiscal_category_id TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_company ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  cpf_cnpj TEXT,
  email TEXT,
  phone TEXT,
  phone2 TEXT,
  tipo_pessoa TEXT DEFAULT 'pf',
  trade_name TEXT,
  ie TEXT,
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_neighborhood TEXT,
  address_city TEXT,
  address_state TEXT DEFAULT 'SP',
  address_zip TEXT,
  address_ibge_code TEXT,
  credit_limit REAL DEFAULT 0,
  credit_balance REAL DEFAULT 0,
  loyalty_points INTEGER DEFAULT 0,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_clients_company ON clients(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_cpf ON clients(cpf_cnpj);

CREATE TABLE IF NOT EXISTS fiscal_documents (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  total_value REAL NOT NULL DEFAULT 0,
  payment_method TEXT,
  items_json TEXT,
  customer_cpf_cnpj TEXT,
  customer_name TEXT,
  number INTEGER,
  serie INTEGER,
  access_key TEXT,
  protocol_number TEXT,
  issued_by TEXT,
  is_contingency INTEGER DEFAULT 0,
  environment TEXT DEFAULT 'homologacao',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  synced_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_fiscal_company ON fiscal_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_status ON fiscal_documents(status);

CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  type TEXT NOT NULL,
  quantity REAL NOT NULL,
  previous_stock REAL NOT NULL,
  new_stock REAL NOT NULL,
  unit_cost REAL,
  reason TEXT,
  reference TEXT,
  performed_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  synced_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_stock_mov_company ON stock_movements(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_mov_product ON stock_movements(product_id);

CREATE TABLE IF NOT EXISTS cash_sessions (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  terminal_id TEXT NOT NULL DEFAULT '01',
  status TEXT NOT NULL DEFAULT 'aberto',
  opening_balance REAL NOT NULL DEFAULT 0,
  closing_balance REAL,
  opened_by TEXT NOT NULL,
  opened_at TEXT NOT NULL DEFAULT (datetime('now')),
  closed_by TEXT,
  closed_at TEXT,
  sales_count INTEGER DEFAULT 0,
  total_dinheiro REAL DEFAULT 0,
  total_debito REAL DEFAULT 0,
  total_credito REAL DEFAULT 0,
  total_pix REAL DEFAULT 0,
  total_voucher REAL DEFAULT 0,
  total_outros REAL DEFAULT 0,
  total_vendas REAL DEFAULT 0,
  total_sangria REAL DEFAULT 0,
  total_suprimento REAL DEFAULT 0,
  counted_dinheiro REAL,
  counted_debito REAL,
  counted_credito REAL,
  counted_pix REAL,
  difference REAL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cash_sessions_company ON cash_sessions(company_id);

CREATE TABLE IF NOT EXISTS cash_movements (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT,
  sale_id TEXT,
  performed_by TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  synced_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_cash_mov_session ON cash_movements(session_id);

CREATE TABLE IF NOT EXISTS financial_entries (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT DEFAULT 'outros',
  status TEXT DEFAULT 'pendente',
  description TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  paid_amount REAL DEFAULT 0,
  due_date TEXT NOT NULL,
  paid_date TEXT,
  payment_method TEXT,
  counterpart TEXT,
  cost_center TEXT,
  reference TEXT,
  recurrence TEXT,
  notes TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  synced_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_financial_company ON financial_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_financial_type ON financial_entries(type);
CREATE INDEX IF NOT EXISTS idx_financial_status ON financial_entries(status);

CREATE TABLE IF NOT EXISTS sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  payload TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  synced_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_sync_log_status ON sync_log(status);
CREATE INDEX IF NOT EXISTS idx_sync_log_table ON sync_log(table_name);

CREATE TABLE IF NOT EXISTS local_meta (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

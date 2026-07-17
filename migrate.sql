CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  code TEXT,
  name TEXT NOT NULL,
  description TEXT,
  price DOUBLE PRECISION NOT NULL,
  cost DOUBLE PRECISION,
  stock DOUBLE PRECISION NOT NULL,
  category TEXT,
  unit TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  number INTEGER NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_address TEXT,
  client_cuit TEXT,
  items JSONB NOT NULL,
  subtotal DOUBLE PRECISION NOT NULL,
  discount DOUBLE PRECISION NOT NULL,
  total DOUBLE PRECISION NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  number INTEGER NOT NULL,
  quote_id TEXT,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_address TEXT,
  client_cuit TEXT,
  items JSONB NOT NULL,
  subtotal DOUBLE PRECISION NOT NULL,
  discount DOUBLE PRECISION NOT NULL,
  total DOUBLE PRECISION NOT NULL,
  date TEXT NOT NULL,
  payment_method TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  tax_id TEXT
);

INSERT INTO settings (id, name)
VALUES (1, 'Mi Negocio')
ON CONFLICT (id) DO NOTHING;

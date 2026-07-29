import { pgTable, text, integer, doublePrecision, jsonb } from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  code: text("code"),
  barcode: text("barcode"),
  name: text("name").notNull(),
  description: text("description"),
  price: doublePrecision("price").notNull(),
  cost: doublePrecision("cost"),
  stock: doublePrecision("stock").notNull(),
  category: text("category"),
  unit: text("unit").notNull(),
  createdAt: text("created_at").notNull(),
});

export const quotes = pgTable("quotes", {
  id: text("id").primaryKey(),
  number: integer("number").notNull(),
  clientName: text("client_name").notNull(),
  clientPhone: text("client_phone"),
  clientAddress: text("client_address"),
  clientCuit: text("client_cuit"),
  items: jsonb("items").notNull(),
  subtotal: doublePrecision("subtotal").notNull(),
  discount: doublePrecision("discount").notNull(),
  total: doublePrecision("total").notNull(),
  date: text("date").notNull(),
  status: text("status").notNull(),
  notes: text("notes"),
});

export const sales = pgTable("sales", {
  id: text("id").primaryKey(),
  number: integer("number").notNull(),
  quoteId: text("quote_id"),
  clientName: text("client_name").notNull(),
  clientPhone: text("client_phone"),
  clientAddress: text("client_address"),
  clientCuit: text("client_cuit"),
  items: jsonb("items").notNull(),
  subtotal: doublePrecision("subtotal").notNull(),
  discount: doublePrecision("discount").notNull(),
  total: doublePrecision("total").notNull(),
  date: text("date").notNull(),
  paymentMethod: text("payment_method").notNull(),
});

// Single-row table: always id = 1
export const settings = pgTable("settings", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  taxId: text("tax_id"),
});

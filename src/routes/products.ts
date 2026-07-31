import { Router, type IRouter } from "express";
import { eq, desc, inArray, isNotNull, and, sql } from "drizzle-orm";
import { db } from "../db";
import { products } from "../db/schema";

const router: IRouter = Router();

function genId(): string {
  return Date.now().toString() + Math.random().toString(36).slice(2, 11);
}

router.get("/products", async (_req, res) => {
  const rows = await db.select().from(products).orderBy(desc(products.createdAt));
  res.json(rows);
});

router.post("/products/bulk", async (req, res) => {
  const items = Array.isArray(req.body?.products) ? req.body.products : [];
  if (items.length === 0) {
    res.status(400).json({ error: "No products provided" });
    return;
  }
  const now = new Date().toISOString();

  // Match incoming rows against products that already exist (by SKU/código).
  // Re-importing the same price list then UPDATES price/stock on the existing
  // row instead of creating a duplicate — which is what keeps a manually
  // typed barcode from being wiped out every time a list gets re-imported.
  const existingRows = await db
    .select({ id: products.id, code: products.code, barcode: products.barcode })
    .from(products);
  const byCode = new Map<string, { id: string; barcode: string | null }>();
  for (const row of existingRows) {
    const key = row.code?.trim().toLowerCase();
    if (key) byCode.set(key, { id: row.id, barcode: row.barcode });
  }

  const toInsert: Record<string, unknown>[] = [];
  const toUpdate: { id: string; data: Record<string, unknown> }[] = [];

  for (const item of items as Record<string, unknown>[]) {
    const key = String(item.code ?? "").trim().toLowerCase();
    const match = key ? byCode.get(key) : undefined;
    if (match) {
      toUpdate.push({
        id: match.id,
        data: {
          name: item.name,
          price: item.price,
          cost: item.cost,
          stock: item.stock,
          category: item.category,
          // Never overwrite a barcode that's already saved with a blank one from the file.
          ...(!match.barcode && item.barcode ? { barcode: item.barcode } : {}),
        },
      });
    } else {
      toInsert.push({ ...item, id: genId(), createdAt: now });
    }
  }

  const saved: Record<string, unknown>[] = [];
  const CHUNK_SIZE = 200;
  for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
    const chunk = toInsert.slice(i, i + CHUNK_SIZE);
    if (chunk.length === 0) continue;
    const rows = await db.insert(products).values(chunk).returning();
    saved.push(...rows);
  }
  for (const u of toUpdate) {
    const [row] = await db.update(products).set(u.data).where(eq(products.id, u.id)).returning();
    if (row) saved.push(row);
  }

  res.status(201).json(saved);
});

router.delete("/products/bulk", async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  if (ids.length === 0) {
    res.status(400).json({ error: "No ids provided" });
    return;
  }
  await db.delete(products).where(inArray(products.id, ids));
  res.status(204).end();
});

/** Recalculates price = cost × coeficiente for a chosen set of products (only where cost is set). */
router.patch("/products/bulk-margin", async (req, res) => {
  const ids: string[] = Array.isArray(req.body?.ids) ? req.body.ids : [];
  const coef = Number(req.body?.coef);
  if (ids.length === 0 || !coef || coef <= 0) {
    res.status(400).json({ error: "ids and a positive coef are required" });
    return;
  }
  const rows = await db
    .update(products)
    .set({ price: sql`round((${products.cost} * ${coef})::numeric, 2)` })
    .where(and(inArray(products.id, ids), isNotNull(products.cost)))
    .returning();
  res.json(rows);
});

/** Sets an explicit price for many products at once — used by the percentage price
 * adjustment tool and by its "undo" (which just replays the previous prices). */
router.patch("/products/bulk-prices", async (req, res) => {
  const items: { id: string; price: number }[] = Array.isArray(req.body?.items) ? req.body.items : [];
  if (items.length === 0) {
    res.status(400).json({ error: "No items provided" });
    return;
  }
  const saved = [];
  for (const item of items) {
    if (!item.id || typeof item.price !== "number") continue;
    const [row] = await db
      .update(products)
      .set({ price: item.price })
      .where(eq(products.id, item.id))
      .returning();
    if (row) saved.push(row);
  }
  res.json(saved);
});

router.post("/products", async (req, res) => {
  const body = req.body;
  const product = {
    ...body,
    id: genId(),
    createdAt: new Date().toISOString(),
  };
  const [row] = await db.insert(products).values(product).returning();
  res.status(201).json(row);
});

router.put("/products/:id", async (req, res) => {
  const { id } = req.params as { id: string };
  const [row] = await db
    .update(products)
    .set(req.body)
    .where(eq(products.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(row);
});

router.delete("/products/:id", async (req, res) => {
  const { id } = req.params as { id: string };
  await db.delete(products).where(eq(products.id, id));
  res.status(204).end();
});

export default router;

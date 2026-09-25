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
  try {
    const items = Array.isArray(req.body?.products) ? req.body.products : [];
    if (items.length === 0) {
      res.status(400).json({ error: "No products provided" });
      return;
    }
    const now = new Date().toISOString();

    // Obtener productos existentes para resolver identificadores
    const existingRows = await db
      .select({ id: products.id, code: products.code, barcode: products.barcode })
      .from(products);

    const byCode = new Map<string, { id: string; barcode: string | null }>();
    for (const row of existingRows) {
      const key = row.code?.trim().toLowerCase();
      if (key) byCode.set(key, { id: row.id, barcode: row.barcode });
    }

    const recordsToUpsert: Record<string, unknown>[] = [];

    for (const item of items as Record<string, unknown>[]) {
      const key = String(item.code ?? "").trim().toLowerCase();
      const match = key ? byCode.get(key) : undefined;

      recordsToUpsert.push({
        id: match ? match.id : genId(),
        code: item.code ?? null,
        name: item.name ?? null,
        price: item.price ?? 0,
        cost: item.cost ?? null,
        stock: item.stock ?? 0,
        category: item.category ?? null,
        barcode: match?.barcode ? match.barcode : (item.barcode ?? null),
        createdAt: now,
      });
    }

    const saved: Record<string, unknown>[] = [];
    const CHUNK_SIZE = 200;

    // Inserción / Actualización ultrarrápida mediante ON CONFLICT (UPSERT)
    for (let i = 0; i < recordsToUpsert.length; i += CHUNK_SIZE) {
      const chunk = recordsToUpsert.slice(i, i + CHUNK_SIZE);
      if (chunk.length === 0) continue;

      const rows = await db
        .insert(products)
        .values(chunk)
        .onConflictDoUpdate({
          target: products.id,
          set: {
            name: sql`EXCLUDED.name`,
            price: sql`EXCLUDED.price`,
            cost: sql`EXCLUDED.cost`,
            stock: sql`EXCLUDED.stock`,
            category: sql`EXCLUDED.category`,
            barcode: sql`EXCLUDED.barcode`,
          },
        })
        .returning();

      saved.push(...rows);
    }

    res.status(201).json(saved);
  } catch (err) {
    console.error("Error en importación masiva:", err);
    res.status(500).json({ error: "Error procesando la lista" });
  }
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

  const CHUNK_SIZE = 200;
  const saved = [];
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);
    const promises = chunk.map((item) => {
      if (!item.id || typeof item.price !== "number") return null;
      return db
        .update(products)
        .set({ price: item.price })
        .where(eq(products.id, item.id))
        .returning();
    });
    const results = await Promise.all(promises);
    for (const resArr of results) {
      if (resArr && resArr[0]) saved.push(resArr[0]);
    }
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

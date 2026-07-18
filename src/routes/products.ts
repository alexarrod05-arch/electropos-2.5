import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
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

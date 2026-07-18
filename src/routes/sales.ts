import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "../db";
import { sales } from "../db/schema";

const router: IRouter = Router();

function genId(): string {
  return Date.now().toString() + Math.random().toString(36).slice(2, 11);
}

/** Next sequential sale number (1, 2, 3...), based on the highest one saved so far. */
async function nextNumber(): Promise<number> {
  const [row] = await db
    .select({ max: sql<number>`coalesce(max(${sales.number}), 0)` })
    .from(sales);
  return (row?.max ?? 0) + 1;
}

router.get("/sales", async (_req, res) => {
  const rows = await db.select().from(sales).orderBy(desc(sales.date));
  res.json(rows);
});

router.post("/sales", async (req, res) => {
  const body = req.body;
  const sale = {
    ...body,
    id: genId(),
    number: await nextNumber(),
    date: new Date().toISOString(),
  };
  const [row] = await db.insert(sales).values(sale).returning();
  res.status(201).json(row);
});

router.delete("/sales/:id", async (req, res) => {
  const { id } = req.params as { id: string };
  await db.delete(sales).where(eq(sales.id, id));
  res.status(204).end();
});

export default router;

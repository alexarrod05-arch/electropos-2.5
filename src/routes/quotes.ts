import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "../db";
import { quotes } from "../db/schema";

const router: IRouter = Router();

function genId(): string {
  return Date.now().toString() + Math.random().toString(36).slice(2, 11);
}

/** Next sequential quote number (1, 2, 3...), based on the highest one saved so far. */
async function nextNumber(): Promise<number> {
  const [row] = await db
    .select({ max: sql<number>`coalesce(max(${quotes.number}), 0)` })
    .from(quotes);
  return (row?.max ?? 0) + 1;
}

router.get("/quotes", async (_req, res) => {
  const rows = await db.select().from(quotes).orderBy(desc(quotes.date));
  res.json(rows);
});

router.post("/quotes", async (req, res) => {
  const body = req.body;
  const quote = {
    ...body,
    id: genId(),
    number: await nextNumber(),
    date: new Date().toISOString(),
  };
  const [row] = await db.insert(quotes).values(quote).returning();
  res.status(201).json(row);
});

router.put("/quotes/:id", async (req, res) => {
  const { id } = req.params as { id: string };
  const [row] = await db
    .update(quotes)
    .set(req.body)
    .where(eq(quotes.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Quote not found" });
    return;
  }
  res.json(row);
});

router.delete("/quotes/:id", async (req, res) => {
  const { id } = req.params as { id: string };
  await db.delete(quotes).where(eq(quotes.id, id));
  res.status(204).end();
});

export default router;

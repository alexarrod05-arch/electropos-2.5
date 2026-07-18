import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "../db";
import { sales } from "../db/schema";

const router: IRouter = Router();

function genId(): string {
  return Date.now().toString() + Math.random().toString(36).slice(2, 11);
}

function genNumber(): number {
  return Math.floor(Math.random() * 90000) + 10000;
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
    number: genNumber(),
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

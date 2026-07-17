import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { settings } from "../db/schema";

const router: IRouter = Router();

router.get("/settings", async (_req, res) => {
  const [row] = await db.select().from(settings).where(eq(settings.id, 1));
  res.json(row ?? { name: "Mi Negocio" });
});

router.put("/settings", async (req, res) => {
  const body = req.body;
  const [row] = await db
    .insert(settings)
    .values({ id: 1, ...body, name: body.name ?? "Mi Negocio" })
    .onConflictDoUpdate({ target: settings.id, set: body })
    .returning();
  res.json(row);
});

export default router;

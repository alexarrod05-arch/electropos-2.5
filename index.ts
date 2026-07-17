import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import quotesRouter from "./quotes";
import salesRouter from "./sales";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(quotesRouter);
router.use(salesRouter);
router.use(settingsRouter);

export default router;

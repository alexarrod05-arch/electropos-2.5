import express, { type Express } from "express";
import cors from "cors";
import router from "./routes";

// Same API as src/app.ts, but without the pino HTTP logger: pino spawns worker
// threads for its transports, which don't survive in a serverless environment.
// Netlify captures console output for function logs instead.
const app: Express = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Mounted at root — the Netlify function wrapper strips whatever prefix
// Netlify sends (which varies) down to the bare path before this runs.
app.use("/", router);

export default app;

import serverless from "serverless-http";
import app from "../../src/app-serverless";

// Netlify invokes this function at /.netlify/functions/api/... , but the Express
// routes are mounted under /api. Rewrite the incoming path back to /api/... so
// the same route definitions work both on a normal server and here.
const wrapped = serverless(app, {
  request(req: { url?: string }) {
    const path = (req.url ?? "").replace(/^\/\.netlify\/functions\/api/, "");
    req.url = "/api" + (path === "" ? "/" : path);
  },
});

export const handler = wrapped;

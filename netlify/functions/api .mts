import serverless from "serverless-http";
import app from "../../src/app-serverless";

// Netlify's exact incoming path shape for a redirected function call isn't
// consistent across accounts/runtimes (raw function path vs. already-resolved
// path, sometimes doubled). Rather than guess the shape, find the LAST "/api"
// segment and keep only what comes after it — that's the real route path
// (e.g. "/healthz", "/products") regardless of whatever came before it.
function realPath(url: string): string {
  const idx = url.lastIndexOf("/api");
  const rest = idx === -1 ? url : url.slice(idx + 4);
  return rest === "" ? "/" : rest;
}

const wrapped = serverless(app, {
  request(req: { url?: string }) {
    req.url = realPath(req.url ?? "/");
  },
});

export const handler = wrapped;


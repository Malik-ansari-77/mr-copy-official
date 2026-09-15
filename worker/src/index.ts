import { canonicalPublicRoutes, normalizePublicRoute } from "../../shared/publicRoutes";

type Env = {
  ASSETS: { fetch(request: Request): Promise<Response> };
};

const staticAssetPrefixes = ["/assets/", "/manus-storage/", "/__manus__/"];
const staticAssetPaths = new Set(["/robots.txt", "/sitemap.xml", "/favicon.ico"]);
const jsonHeaders = {
  "Content-Type": "application/json; charset=UTF-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

function response(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function isStaticAssetPath(pathname: string): boolean {
  return staticAssetPrefixes.some((prefix) => pathname.startsWith(prefix)) || staticAssetPaths.has(pathname);
}

function isCanonicalPublicRoute(pathname: string): boolean {
  return canonicalPublicRoutes.includes(pathname as (typeof canonicalPublicRoutes)[number]);
}

function assetRequest(request: Request, path: string): Request {
  const url = new URL(request.url);
  url.pathname = path;
  return new Request(url.toString(), request);
}

function documentAssetPath(pathname: string): string {
  const name = pathname === "/" ? "home" : pathname.slice(1).replaceAll("/", "__");
  return `/_documents/${name}.html`;
}

async function notFoundResponse(request: Request, env: Env): Promise<Response> {
  const asset = await env.ASSETS.fetch(assetRequest(request, "/_documents/not-found.html"));
  const headers = new Headers(asset.headers);
  headers.set("Content-Type", "text/html; charset=UTF-8");
  headers.set("X-Robots-Tag", "noindex");
  return new Response(asset.body, { status: 404, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.protocol === "http:") {
      url.protocol = "https:";
      return Response.redirect(url.toString(), 308);
    }
    if (url.pathname.startsWith("/api/")) return response({ error: "NOT_FOUND" }, 404);
    if (isStaticAssetPath(url.pathname)) return env.ASSETS.fetch(request);

    const canonicalPath = normalizePublicRoute(url.pathname);
    if (isCanonicalPublicRoute(canonicalPath)) {
      return env.ASSETS.fetch(assetRequest(request, documentAssetPath(canonicalPath)));
    }
    return notFoundResponse(request, env);
  },
};

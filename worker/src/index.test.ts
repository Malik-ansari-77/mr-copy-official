import { describe, expect, it, vi } from "vitest";
import worker from "./index";

const env = (assets: { fetch: ReturnType<typeof vi.fn> }) => ({ ASSETS: assets });

describe("website worker routing", () => {
  it("redirects plain HTTP requests to the equivalent HTTPS canonical URL before static assets or API handling", async () => {
    const assets = { fetch: vi.fn() };
    const response = await worker.fetch(new Request("http://mrcopy.pro/features/link-previews?ref=p6"), env(assets));
    expect(response.status).toBe(308);
    expect(response.headers.get("Location")).toBe("https://mrcopy.pro/features/link-previews?ref=p6");
    expect(assets.fetch).not.toHaveBeenCalled();
  });

  it("serves declared public documents from their prerendered route asset rather than the generic SPA shell", async () => {
    const assets = { fetch: vi.fn().mockResolvedValue(new Response("route document", { status: 200, headers: { "Content-Type": "text/html" } })) };
    const response = await worker.fetch(new Request("https://mrcopy.pro/features/link-previews?ref=p7"), env(assets));
    expect(response.status).toBe(200);
    expect(new URL(assets.fetch.mock.calls[0][0].url).pathname).toBe("/_documents/features__link-previews.html");
  });

  it("returns a genuine noindex HTTP 404 document for an unknown public route", async () => {
    const assets = { fetch: vi.fn().mockResolvedValue(new Response("not found document", { status: 200, headers: { "Content-Type": "text/html" } })) };
    const response = await worker.fetch(new Request("https://mrcopy.pro/does-not-exist"), env(assets));
    expect(response.status).toBe(404);
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex");
    expect(new URL(assets.fetch.mock.calls[0][0].url).pathname).toBe("/_documents/not-found.html");
  });

  it("keeps static assets and every API path outside document-route handling", async () => {
    const assets = { fetch: vi.fn().mockResolvedValue(new Response("asset", { status: 200 })) };
    const assetResponse = await worker.fetch(new Request("https://mrcopy.pro/assets/index.js"), env(assets));
    const unknownApiResponse = await worker.fetch(new Request("https://mrcopy.pro/api/unknown"), env(assets));
    const legacyDeletionResponse = await worker.fetch(new Request("https://mrcopy.pro/api/account-delete", { method: "POST" }), env(assets));
    expect(assetResponse.status).toBe(200);
    expect(assets.fetch).toHaveBeenCalledTimes(1);
    expect(unknownApiResponse.status).toBe(404);
    expect(legacyDeletionResponse.status).toBe(404);
  });
});

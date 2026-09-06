import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const { getCachedImageMock, setCachedImageMock } = vi.hoisted(() => ({
  getCachedImageMock: vi.fn(),
  setCachedImageMock: vi.fn(),
}));

vi.mock("@/infrastructure/proxy/image-cache", () => ({
  getCachedImage: getCachedImageMock,
  setCachedImage: setCachedImageMock,
}));

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));

import { proxyImage } from "./image-proxy";

describe("proxyImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("serves a cached image without hitting the upstream", async () => {
    getCachedImageMock.mockResolvedValue({ buffer: Buffer.from([9, 9]), contentType: "image/webp" });

    const result = await proxyImage("https://x.com/a.webp");

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.contentType).toBe("image/webp");
    expect(result.cacheControl).toContain("immutable");

    const reader = result.stream.getReader();
    const { value } = await reader.read();
    expect(Array.from(value!)).toEqual([9, 9]);
  });

  it("fetches upstream on a miss and stores the result on disk", async () => {
    getCachedImageMock.mockResolvedValue(undefined);
    setCachedImageMock.mockResolvedValue(undefined);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({ "content-type": "image/webp" }),
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    });

    const result = await proxyImage("https://x.com/a.webp");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(setCachedImageMock).toHaveBeenCalledWith(
      "https://x.com/a.webp",
      undefined,
      Buffer.from([1, 2, 3]),
      "image/webp"
    );
    expect(result.contentType).toBe("image/webp");

    const reader = result.stream.getReader();
    const { value } = await reader.read();
    expect(Array.from(value!)).toEqual([1, 2, 3]);
  });

  it("throws on blocked content types", async () => {
    getCachedImageMock.mockResolvedValue(undefined);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({ "content-type": "text/html" }),
      arrayBuffer: async () => new Uint8Array(0).buffer,
    });

    await expect(proxyImage("https://x.com/a")).rejects.toThrow("Blocked content type");
    expect(setCachedImageMock).not.toHaveBeenCalled();
  });
});
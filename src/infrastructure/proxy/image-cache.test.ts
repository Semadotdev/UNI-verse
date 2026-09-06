import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { getCachedImage, setCachedImage } from "./image-cache";

describe("image-cache", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "imgcache-"));
    process.env.IMAGE_CACHE_DIR = dir;
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
    delete process.env.IMAGE_CACHE_DIR;
  });

  it("returns undefined when nothing is cached", async () => {
    expect(await getCachedImage("https://x.com/a.webp")).toBeUndefined();
  });

  it("stores and returns a cached image with its content type", async () => {
    const buffer = Buffer.from([0x12, 0x34, 0x56]);
    await setCachedImage("https://x.com/a.webp", undefined, buffer, "image/webp");

    const cached = await getCachedImage("https://x.com/a.webp");
    expect(cached).toBeDefined();
    expect(cached!.contentType).toBe("image/webp");
    expect(Buffer.compare(cached!.buffer, buffer)).toBe(0);
  });

  it("distinguishes entries by url and headers", async () => {
    const plain = Buffer.from([1]);
    const withReferer = Buffer.from([2]);
    await setCachedImage("https://x.com/a.webp", undefined, plain, "image/webp");
    await setCachedImage("https://x.com/a.webp", { Referer: "https://x.com/" }, withReferer, "image/webp");

    const hitPlain = await getCachedImage("https://x.com/a.webp");
    const hitReferer = await getCachedImage("https://x.com/a.webp", { Referer: "https://x.com/" });

    expect(Buffer.compare(hitPlain!.buffer, plain)).toBe(0);
    expect(Buffer.compare(hitReferer!.buffer, withReferer)).toBe(0);
  });
});
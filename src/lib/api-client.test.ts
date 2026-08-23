import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClient } from "./api-client";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue({
    json: async () => ({ success: true, data: {} }),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("ApiClient.post", () => {
  it("sends the JSON body", async () => {
    await ApiClient.post("/api/test", { a: 1 });
    expect(fetchMock).toHaveBeenCalledWith("/api/test", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ a: 1 }),
    }));
  });

  it("forwards extra RequestInit options such as keepalive", async () => {
    await ApiClient.post("/api/test", { a: 1 }, { keepalive: true });
    expect(fetchMock).toHaveBeenCalledWith("/api/test", expect.objectContaining({
      method: "POST",
      keepalive: true,
      body: JSON.stringify({ a: 1 }),
    }));
  });
});

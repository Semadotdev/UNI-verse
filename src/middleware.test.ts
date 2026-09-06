import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";

const { getUserMock } = vi.hoisted(() => ({ getUserMock: vi.fn() }));

vi.mock("next/server", () => ({
  NextResponse: {
    next: (): { kind: string } => ({ kind: "next" }),
    redirect: (url: URL): { kind: string; url: URL } => ({ kind: "redirect", url }),
  },
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: getUserMock },
  })),
}));

import { middleware } from "./middleware";

type MockResponse = { kind: string; url: URL };

function makeRequest(pathname: string): NextRequest {
  const nextUrl = {
    pathname,
    clone: () => ({ ...nextUrl }),
  };
  return {
    nextUrl,
    cookies: { getAll: () => [], set: () => {} },
    headers: new Headers(),
  } as unknown as NextRequest;
}

async function run(pathname: string): Promise<MockResponse> {
  return (await middleware(makeRequest(pathname))) as unknown as MockResponse;
}

describe("middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it("skips Supabase getUser for API routes", async () => {
    const res = await run("/api/posts?page=1");
    expect(getUserMock).not.toHaveBeenCalled();
    expect(res.kind).toBe("next");
  });

  it("runs getUser for public page routes", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const res = await run("/login");
    expect(getUserMock).toHaveBeenCalled();
    expect(res.kind).toBe("next");
  });

  it("redirects unauthenticated users on protected pages", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const res = await run("/home");
    expect(res.kind).toBe("redirect");
    expect(res.url.pathname).toBe("/login");
  });

  it("redirects authenticated users away from public routes", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } } });
    const res = await run("/login");
    expect(res.kind).toBe("redirect");
    expect(res.url.pathname).toBe("/");
  });
});
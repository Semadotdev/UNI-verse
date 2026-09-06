import { describe, expect, it, vi, beforeEach } from "vitest";

const { getUserMock } = vi.hoisted(() => ({ getUserMock: vi.fn() }));
const { findUniqueMock, createMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  createMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: vi.fn(() => ({
    auth: { getUser: getUserMock },
  })),
}));

vi.mock("@/infrastructure/database/prisma-client", () => ({
  prisma: {
    user: {
      findUnique: findUniqueMock,
      create: createMock,
    },
  },
}));

import { getAuthUserId, resetKnownUsers, UnauthorizedError } from "./auth";

describe("getAuthUserId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetKnownUsers();
  });

  it("throws UnauthorizedError when the session has no user", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: { message: "missing" } });

    await expect(getAuthUserId()).rejects.toThrow(UnauthorizedError);
    await expect(getAuthUserId()).rejects.toMatchObject({ name: "UnauthorizedError" });
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("wraps a thrown Supabase error into UnauthorizedError", async () => {
    getUserMock.mockRejectedValue(new Error("Network request failed"));

    await expect(getAuthUserId()).rejects.toMatchObject({
      name: "UnauthorizedError",
      message: "Unauthorized",
    });
  });

  it("returns the user id for a known user without a DB round trip on repeat calls", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u1", email: "a@b.c", user_metadata: {} } },
      error: null,
    });
    findUniqueMock.mockResolvedValue({ id: "u1" });

    await expect(getAuthUserId()).resolves.toBe("u1");
    await expect(getAuthUserId()).resolves.toBe("u1");

    expect(findUniqueMock).toHaveBeenCalledTimes(1);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("creates a user row when the auth user has no local row", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "u2",
          email: "new@x.co",
          user_metadata: { username: "newuser", name: "New User" },
        },
      },
      error: null,
    });
    findUniqueMock.mockResolvedValue(null);
    createMock.mockResolvedValue({ id: "u2" });

    await expect(getAuthUserId()).resolves.toBe("u2");
    expect(createMock).toHaveBeenCalledWith({
      data: {
        id: "u2",
        email: "new@x.co",
        username: "newuser",
        name: "New User",
      },
    });
  });
});
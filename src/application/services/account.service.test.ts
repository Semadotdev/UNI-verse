import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma, adminClient } = vi.hoisted(() => ({
  prisma: {
    user: { delete: vi.fn() },
  },
  adminClient: {
    auth: {
      admin: { deleteUser: vi.fn() },
    },
  },
}));

vi.mock("@/infrastructure/database/prisma-client", () => ({ prisma }));
vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdminClient: () => adminClient }));

import { AccountService } from "./account.service";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AccountService.deleteAccount", () => {
  it("deletes the database user before removing the auth user", async () => {
    prisma.user.delete.mockResolvedValue({});
    adminClient.auth.admin.deleteUser.mockResolvedValue({ data: {}, error: null });

    await new AccountService().deleteAccount("u1");

    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: "u1" } });
    expect(adminClient.auth.admin.deleteUser).toHaveBeenCalledWith("u1");
    expect(prisma.user.delete.mock.invocationCallOrder[0]).toBeLessThan(
      adminClient.auth.admin.deleteUser.mock.invocationCallOrder[0]
    );
  });

  it("propagates a database failure without touching the auth user", async () => {
    prisma.user.delete.mockRejectedValue(new Error("db down"));

    await expect(new AccountService().deleteAccount("u1")).rejects.toThrow("db down");
    expect(adminClient.auth.admin.deleteUser).not.toHaveBeenCalled();
  });

  it("propagates an auth failure after the database user is gone", async () => {
    prisma.user.delete.mockResolvedValue({});
    adminClient.auth.admin.deleteUser.mockResolvedValue({
      data: null,
      error: { message: "auth down" },
    });

    await expect(new AccountService().deleteAccount("u1")).rejects.toThrow("auth down");
    expect(prisma.user.delete).toHaveBeenCalledTimes(1);
  });
});

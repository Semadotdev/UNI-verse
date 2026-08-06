import type { Prisma } from "@prisma/client";

export type PostFeed = "all" | "friends" | "nsfw";

export interface BuildFeedWhereInput {
  username?: string;
  authorId?: string;
  feed?: PostFeed;
  viewerIsAdult: boolean;
  friendIds: string[];
}

export function buildFeedWhere(input: BuildFeedWhereInput): Prisma.PostWhereInput {
  const where: Prisma.PostWhereInput = {};

  if (input.username) {
    where.authorId = input.authorId;
  }

  if (input.feed === "friends") {
    where.authorId = { in: input.friendIds };
  }

  if (input.feed === "nsfw") {
    where.nsfw = true;
    if (!input.viewerIsAdult) {
      where.id = { in: [] };
    }
  } else if (!input.viewerIsAdult) {
    where.nsfw = false;
  }

  return where;
}

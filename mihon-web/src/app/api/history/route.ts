import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const DEFAULT_USER_ID = "default-user";

export async function GET() {
  let user = await db.user.findUnique({ where: { id: DEFAULT_USER_ID } });
  if (!user) {
    user = await db.user.create({ data: { id: DEFAULT_USER_ID } });
  }

  const history = await db.readingHistory.findMany({
    where: { userId: DEFAULT_USER_ID },
    orderBy: { readAt: "desc" },
    take: 50,
  });

  return NextResponse.json(history);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { mangaId, sourceId, chapterId, chapterNum, progress } = body;

  let user = await db.user.findUnique({ where: { id: DEFAULT_USER_ID } });
  if (!user) {
    user = await db.user.create({ data: { id: DEFAULT_USER_ID } });
  }

  const item = await db.readingHistory.upsert({
    where: {
      userId_mangaId_chapterId: {
        userId: DEFAULT_USER_ID,
        mangaId,
        chapterId,
      },
    },
    update: { chapterNum, progress, readAt: new Date() },
    create: {
      userId: DEFAULT_USER_ID,
      mangaId,
      sourceId,
      chapterId,
      chapterNum,
      progress,
    },
  });

  return NextResponse.json(item);
}

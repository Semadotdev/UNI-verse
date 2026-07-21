import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const DEFAULT_USER_ID = "default-user";

export async function GET() {
  let user = await db.user.findUnique({ where: { id: DEFAULT_USER_ID } });
  if (!user) {
    user = await db.user.create({ data: { id: DEFAULT_USER_ID } });
  }

  const library = await db.library.findMany({
    where: { userId: DEFAULT_USER_ID },
    orderBy: { addedAt: "desc" },
  });

  return NextResponse.json(library);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { mangaId, sourceId, title, cover, status, categories } = body;

  let user = await db.user.findUnique({ where: { id: DEFAULT_USER_ID } });
  if (!user) {
    user = await db.user.create({ data: { id: DEFAULT_USER_ID } });
  }

  const item = await db.library.upsert({
    where: {
      userId_mangaId_sourceId: {
        userId: DEFAULT_USER_ID,
        mangaId,
        sourceId,
      },
    },
    update: { title, cover, status, categories: categories?.join(",") || "" },
    create: {
      userId: DEFAULT_USER_ID,
      mangaId,
      sourceId,
      title,
      cover,
      status,
      categories: categories?.join(",") || "",
    },
  });

  return NextResponse.json(item);
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { mangaId, sourceId } = body;

  await db.library.deleteMany({
    where: {
      userId: DEFAULT_USER_ID,
      mangaId,
      sourceId,
    },
  });

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const DEFAULT_USER_ID = "default-user";

export async function GET() {
  let user = await db.user.findUnique({ where: { id: DEFAULT_USER_ID } });
  if (!user) {
    user = await db.user.create({ data: { id: DEFAULT_USER_ID } });
  }

  let settings = await db.userSettings.findUnique({
    where: { userId: DEFAULT_USER_ID },
  });

  if (!settings) {
    settings = await db.userSettings.create({
      data: {
        userId: DEFAULT_USER_ID,
        theme: "system",
        readerMode: "page",
        readingDir: "rtl",
        bgColor: "#ffffff",
        brightness: 1.0,
        enabledSources: "",
      },
    });
  }

  return NextResponse.json(settings);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { theme, readerMode, readingDir, bgColor, brightness, enabledSources } =
    body;

  let user = await db.user.findUnique({ where: { id: DEFAULT_USER_ID } });
  if (!user) {
    user = await db.user.create({ data: { id: DEFAULT_USER_ID } });
  }

  const settings = await db.userSettings.upsert({
    where: { userId: DEFAULT_USER_ID },
    update: {
      ...(theme !== undefined && { theme }),
      ...(readerMode !== undefined && { readerMode }),
      ...(readingDir !== undefined && { readingDir }),
      ...(bgColor !== undefined && { bgColor }),
      ...(brightness !== undefined && { brightness }),
      ...(enabledSources !== undefined && { enabledSources }),
    },
    create: {
      userId: DEFAULT_USER_ID,
      theme: theme ?? "system",
      readerMode: readerMode ?? "page",
      readingDir: readingDir ?? "rtl",
      bgColor: bgColor ?? "#ffffff",
      brightness: brightness ?? 1.0,
      enabledSources: enabledSources ?? "",
    },
  });

  return NextResponse.json(settings);
}

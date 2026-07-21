import { NextRequest, NextResponse } from "next/server";
import { getSource } from "@/lib/sources/registry";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sourceId: string; mangaId: string }> }
) {
  const { sourceId, mangaId } = await params;

  const source = getSource(sourceId);
  if (!source) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 });
  }

  try {
    const chapters = await source.getChapters(mangaId);
    return NextResponse.json(chapters);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch chapters" }, { status: 500 });
  }
}

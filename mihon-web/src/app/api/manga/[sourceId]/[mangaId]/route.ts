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
    const manga = await source.getManga(mangaId);
    return NextResponse.json(manga);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch manga" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getSource } from "@/lib/sources/registry";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sourceId: string; chapterId: string }> }
) {
  const { sourceId, chapterId } = await params;

  const source = getSource(sourceId);
  if (!source) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 });
  }

  try {
    const pages = await source.getPages(chapterId);
    return NextResponse.json(pages);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch pages" }, { status: 500 });
  }
}

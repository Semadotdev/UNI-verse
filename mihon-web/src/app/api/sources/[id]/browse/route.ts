import { NextRequest, NextResponse } from "next/server";
import { getSource } from "@/lib/sources/registry";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const source = getSource(id);

  if (!source) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;
  const tab = searchParams.get("tab") || "latest";
  const page = parseInt(searchParams.get("page") || "1");

  try {
    const items =
      tab === "popular"
        ? await source.popular(page)
        : await source.latest(page);

    return NextResponse.json({
      source: source.id,
      sourceName: source.name,
      items,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch manga" },
      { status: 500 }
    );
  }
}

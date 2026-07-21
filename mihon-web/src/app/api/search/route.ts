import { NextRequest, NextResponse } from "next/server";
import { getEnabledSources, getSource } from "@/lib/sources/registry";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const sourceId = searchParams.get("source");

  if (!query) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  let sources = getEnabledSources();

  if (sourceId) {
    const source = getSource(sourceId);
    sources = source ? [source] : [];
  }

  const results = await Promise.all(
    sources.map(async (source) => {
      try {
        const items = await source.search(query, page);
        return { source: source.id, sourceName: source.name, items };
      } catch {
        return { source: source.id, sourceName: source.name, items: [], error: "Failed" };
      }
    })
  );

  return NextResponse.json(results);
}

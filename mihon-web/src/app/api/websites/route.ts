import { NextRequest, NextResponse } from "next/server";
import { MANGA_WEBSITES } from "@/lib/sources/websites";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get("category");
  const search = searchParams.get("q");

  let websites = MANGA_WEBSITES;

  if (category) {
    websites = websites.filter((w) => w.category === category);
  }

  if (search) {
    const q = search.toLowerCase();
    websites = websites.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.description.toLowerCase().includes(q)
    );
  }

  // Convert searchUrl function to string template for JSON serialization
  const serialized = websites.map((w) => ({
    ...w,
    searchUrl: w.searchUrl(""),
  }));

  return NextResponse.json(serialized);
}

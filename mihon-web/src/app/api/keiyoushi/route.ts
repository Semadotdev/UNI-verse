import { NextRequest, NextResponse } from "next/server";
import { fetchExtensions, searchExtensions } from "@/lib/sources/keiyoushi";

export async function GET(request: NextRequest) {
  try {
    const extensions = await fetchExtensions();
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const lang = searchParams.get("lang") || undefined;
    const nsfw = searchParams.get("nsfw") === "true";

    const filtered = searchExtensions(extensions, query, lang, nsfw);

    return NextResponse.json({
      total: extensions.length,
      filtered: filtered.length,
      extensions: filtered,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch extensions index" },
      { status: 500 }
    );
  }
}

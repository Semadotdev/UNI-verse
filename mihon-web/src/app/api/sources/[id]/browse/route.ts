import { NextRequest, NextResponse } from "next/server";
import { getSource } from "@/lib/sources/registry";
import { fetchExtensions } from "@/lib/sources/keiyoushi";
import { registerDynamicSources, unregisterDynamicSources } from "@/lib/sources/registry";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const CONFIG_PATH = join(process.cwd(), "installed-extensions.json");

async function syncDynamicSources() {
  unregisterDynamicSources();
  if (existsSync(CONFIG_PATH)) {
    try {
      const config = JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
      if (config.packages?.length > 0) {
        const allExtensions = await fetchExtensions();
        const installed = allExtensions.filter((e: any) => config.packages.includes(e.pkg));
        registerDynamicSources(installed);
      }
    } catch {}
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await syncDynamicSources();
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

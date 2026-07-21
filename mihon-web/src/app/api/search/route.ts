import { NextRequest, NextResponse } from "next/server";
import { getEnabledSources, getSource } from "@/lib/sources/registry";
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

export async function GET(request: NextRequest) {
  await syncDynamicSources();
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

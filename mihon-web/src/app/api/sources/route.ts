import { NextResponse } from "next/server";
import { getAllSources } from "@/lib/sources/registry";
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

export async function GET() {
  await syncDynamicSources();
  const sources = getAllSources().map((s) => ({
    id: s.id,
    name: s.name,
    icon: s.icon,
    description: s.description,
    enabled: s.enabled,
  }));

  return NextResponse.json(sources);
}

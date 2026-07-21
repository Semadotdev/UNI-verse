import { NextRequest, NextResponse } from "next/server";
import { fetchExtensions } from "@/lib/sources/keiyoushi";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

const CONFIG_PATH = join(process.cwd(), "installed-extensions.json");

interface InstalledConfig {
  packages: string[];
}

function loadConfig(): InstalledConfig {
  if (existsSync(CONFIG_PATH)) {
    try {
      return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
    } catch {
      return { packages: [] };
    }
  }
  return { packages: [] };
}

function saveConfig(config: InstalledConfig): void {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export async function GET() {
  const config = loadConfig();

  try {
    const allExtensions = await fetchExtensions();
    const installed = allExtensions.filter((ext) =>
      config.packages.includes(ext.pkg)
    );
    return NextResponse.json(installed);
  } catch {
    return NextResponse.json(config.packages);
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { pkg, action } = body;

  if (!pkg || !action) {
    return NextResponse.json({ error: "pkg and action required" }, { status: 400 });
  }

  const config = loadConfig();

  if (action === "install") {
    if (!config.packages.includes(pkg)) {
      config.packages.push(pkg);
    }
  } else if (action === "uninstall") {
    config.packages = config.packages.filter((p) => p !== pkg);
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  saveConfig(config);
  return NextResponse.json({ success: true, packages: config.packages });
}

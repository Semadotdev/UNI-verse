import { NextResponse } from "next/server";
import { getAllSources } from "@/lib/sources/registry";

export async function GET() {
  const sources = getAllSources().map((s) => ({
    id: s.id,
    name: s.name,
    icon: s.icon,
    description: s.description,
    enabled: s.enabled,
  }));

  return NextResponse.json(sources);
}

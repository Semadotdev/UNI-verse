import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma-client";
import { enforceRateLimit } from "@/shared/utils/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await enforceRateLimit(request, 'auth:resolve-username', 60 * 1000, 15, 'ip', 'resolve-username');
    if (rateLimit.response) return rateLimit.response;

    const { username } = await request.json();

    if (!username || typeof username !== "string") {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: { email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ email: user.email });
  } catch (error) {
    console.error("Username resolution error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

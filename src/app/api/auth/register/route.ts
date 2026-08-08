import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/infrastructure/auth/supabase-client";
import { prisma } from "@/infrastructure/database/prisma-client";
import { enforceRateLimit } from "@/shared/utils/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await enforceRateLimit(request, 'auth:register', 10 * 60 * 1000, 5, 'ip', 'register');
    if (rateLimit.response) return rateLimit.response;

    const { email, password, username, birthDate } = await request.json();

    if (!email || !password || !username || !birthDate) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (typeof username !== "string" || username.length < 3 || username.length > 20) {
      return NextResponse.json({ error: "Username must be 3-20 characters" }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json({ error: "Username can only contain letters, numbers, and underscores" }, { status: 400 });
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json({ error: "Password must contain at least one uppercase letter" }, { status: 400 });
    }

    if (!/[a-z]/.test(password)) {
      return NextResponse.json({ error: "Password must contain at least one lowercase letter" }, { status: 400 });
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return NextResponse.json({ error: "Password must contain at least one special character" }, { status: 400 });
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (existingUsername) {
      return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    const { data, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, birth_date: birthDate },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    await prisma.user.create({
      data: {
        id: data.user.id,
        email: data.user.email!,
        username,
        birthDate: new Date(birthDate),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

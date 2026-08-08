import { initializeBuiltinProviders } from "@/infrastructure/providers/initialize";
import { providerRegistry } from "@/infrastructure/providers/registry";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/infrastructure/database/prisma-client";
import { enforceRateLimit } from "@/shared/utils/rate-limit";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const rateLimit = await enforceRateLimit(request, 'manga:providers', 60 * 1000, 30, 'ip', 'providers');
  if (rateLimit.response) return rateLimit.response;

  await initializeBuiltinProviders();
  const providers = providerRegistry.getEnabled();

  let filteredProviders = providers.map((p) => ({
    id: p.providerId,
    name: p.name,
    nsfw: p.nsfw,
  }));

  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const profile = await prisma.user.findUnique({
        where: { id: user.id },
        select: { birthDate: true },
      });

      if (profile?.birthDate) {
        const age = Math.floor((Date.now() - profile.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        if (age < 18) {
          filteredProviders = filteredProviders.filter((p) => !p.nsfw);
        }
      }
    }
  } catch (error) {
    console.error("Error checking user age:", error);
  }

  return Response.json({ providers: filteredProviders });
}
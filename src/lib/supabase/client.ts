import { createBrowserClient } from '@supabase/ssr';
import type { SerializeOptions } from 'cookie';

let client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (client) return client;
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          if (typeof document === 'undefined') return [];
          return document.cookie.split(';').map((c) => {
            const [name, ...rest] = c.split('=');
            return { name: name.trim(), value: rest.join('=') };
          });
        },
        setAll(cookiesToSet: { name: string; value: string; options: Partial<SerializeOptions> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            let cookie = `${name}=${value}; path=/;`;
            if (options?.domain) cookie += ` domain=${options.domain};`;
            if (options?.maxAge) cookie += ` max-age=${options.maxAge};`;
            if (options?.expires) cookie += ` expires=${options.expires};`;
            document.cookie = cookie;
          });
        },
      },
    }
  );
  return client;
}

import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { SUPABASE_KEY, SUPABASE_URL } from './env';

/** Request-scoped Supabase client acting AS the signed-in user (RLS applies). No service-role key is used anywhere. */
export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          /* called from a Server Component — middleware refreshes the session */
        }
      },
    },
  });
}

export type OwnerContext = { userId: string; email: string; role: 'owner' | 'admin' | 'viewer'; mustChangePassword: boolean };

/** Returns the owner context, or null if not signed in / not an owner. */
export async function getOwner(): Promise<OwnerContext | null> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from('owners').select('role').eq('user_id', user.id).maybeSingle();
  if (!data) return null;
  return {
    userId: user.id,
    email: user.email ?? '',
    role: data.role as OwnerContext['role'],
    mustChangePassword: user.user_metadata?.must_change_password === true,
  };
}

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { SUPABASE_KEY, SUPABASE_URL, supabaseConfigured } from '@/lib/supabase/env';

/** Refreshes the Supabase session and gates every private route. Owner role is re-checked server-side in /command/layout. */
export async function middleware(req: NextRequest) {
  const isPrivate = req.nextUrl.pathname.startsWith('/command') || req.nextUrl.pathname.startsWith('/api/private');
  let res = NextResponse.next({ request: req });
  if (!supabaseConfigured()) {
    if (isPrivate) return NextResponse.redirect(new URL('/login?e=config', req.url));
    return res;
  }
  const hasSession = req.cookies.getAll().some((c) => c.name.startsWith('sb-'));
  if (!isPrivate && !hasSession) return res;
  const sb = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await sb.auth.getUser();
  if (isPrivate && !user) {
    if (req.nextUrl.pathname.startsWith('/api/')) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
    const url = new URL('/login', req.url);
    url.searchParams.set('next', req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|og.jpg|reference/|brand/).*)'],
};

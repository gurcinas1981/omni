import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getOwner } from '@/lib/supabase/server';
import { OmegaMark } from '@/components/ui/Marks';
import SideNav from '@/components/command/SideNav';

export const metadata: Metadata = { title: 'Command layer', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function CommandLayout({ children }: { children: React.ReactNode }) {
  const owner = await getOwner();
  if (!owner) redirect('/login?e=denied');
  return (
    <div className="cmd">
      <aside className="side">
        <Link href="/" className="brand" aria-label="Back to the cognitive universe">
          <OmegaMark size={30} />
          <span className="brand-text">
            <span className="brand-name" style={{ fontSize: 18 }}>OMNISYNAPSE</span>
            <span className="brand-sub">FOX Intelligence · command layer</span>
          </span>
        </Link>
        <SideNav />
        <div className="side-foot">
          {owner.mustChangePassword && (
            <Link href="/command/governance#account" className="notice" style={{ color: 'var(--amber)' }}>
              Temporary password in use — change it now
            </Link>
          )}
          <span>
            Signed in as <strong>{owner.email}</strong>
            <br />
            Role: {owner.role} · Visionary Innovator
          </span>
          <form action="/auth/signout" method="post">
            <button className="btn btn-ghost" style={{ width: '100%' }}>
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

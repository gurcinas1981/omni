import type { Metadata } from 'next';
import LoginForm from './LoginForm';
import { OmegaMark } from '@/components/ui/Marks';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Owner sign-in' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; e?: string }> }) {
  const sp = await searchParams;
  const next = sp.next && sp.next.startsWith('/command') ? sp.next : '/command';
  return (
    <main className="auth">
      <div className="auth-card">
        <Link href="/" aria-label="Back to the universe">
          <OmegaMark size={48} />
        </Link>
        <h1>OMNISYNAPSE</h1>
        <p>Private supervisory layer of FOX Intelligence. Access is restricted to the authorised owner; every action is audited.</p>
        {sp.e === 'denied' && <p className="error">This account is not authorised for OMNISYNAPSE.</p>}
        {sp.e === 'config' && <p className="error">Authentication is not configured on this deployment.</p>}
        {sp.e === 'link' && <p className="error">That sign-in link is invalid or has expired.</p>}
        <LoginForm next={next} />
      </div>
    </main>
  );
}

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/browser';

export default function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'error' | 'info'; text: string } | null>(null);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) return setMsg({ kind: 'error', text: 'Sign-in failed. Check your email and password.' });
    router.replace(next);
    router.refresh();
  }

  async function magicLink() {
    if (!email.trim()) return setMsg({ kind: 'error', text: 'Enter your email first.' });
    setBusy(true);
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setBusy(false);
    setMsg(error ? { kind: 'error', text: 'Could not send a sign-in link.' } : { kind: 'info', text: 'If this address is authorised, a sign-in link is on its way.' });
  }

  return (
    <form onSubmit={signIn}>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {msg && <p className={msg.kind === 'error' ? 'error' : 'notice'} role="status">{msg.text}</p>}
      <div className="row" style={{ justifyContent: 'space-between', marginTop: 8 }}>
        <button className="btn" disabled={busy} type="submit">
          {busy ? 'Verifying…' : 'Enter command layer'}
        </button>
        <button className="btn btn-ghost" type="button" disabled={busy} onClick={magicLink}>
          Email me a link
        </button>
      </div>
    </form>
  );
}

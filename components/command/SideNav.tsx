'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/command', label: 'Daily brief', ico: 'Ω' },
  { href: '/command/approvals', label: 'Approval queue', ico: '◇' },
  { href: '/command/evidence', label: 'Evidence ledger', ico: '▤' },
  { href: '/command/memory', label: 'Memory & decisions', ico: '◎' },
  { href: '/command/council', label: 'Expert council', ico: '✦' },
  { href: '/command/systems', label: 'FOX systems', ico: '◉' },
  { href: '/command/governance', label: 'Governance', ico: '⚖' },
  { href: '/command/audit', label: 'Audit trail', ico: '≡' },
];

export default function SideNav() {
  const path = usePathname();
  return (
    <nav aria-label="Command layer">
      {ITEMS.map((i) => {
        const on = i.href === '/command' ? path === '/command' : path.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} className={`nav ${on ? 'on' : ''}`} aria-current={on ? 'page' : undefined}>
            <span className="nav-ico" aria-hidden>
              {i.ico}
            </span>
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}

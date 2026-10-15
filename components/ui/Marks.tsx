import { OMEGA_PATH } from '@/lib/brand/omega';

export function OmegaMark({ size = 28, className, title = 'OMNISYNAPSE Ω' }: { size?: number; className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} role="img" aria-label={title}>
      <defs>
        <linearGradient id="omg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F6E3B0" />
          <stop offset=".55" stopColor="#C8A96A" />
          <stop offset="1" stopColor="#8A6A2E" />
        </linearGradient>
      </defs>
      <path d={OMEGA_PATH} fill="url(#omg)" />
    </svg>
  );
}

/** FOX ecosystem mark — official faceted emblem (same artwork as ORBIT's fox-mark.svg). */
export function FoxMark({ size = 22, className }: { size?: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/brand/fox-original.svg" width={size * 0.81} height={size} className={className} alt="FOX Intelligence" style={{ display: 'inline-block', verticalAlign: 'middle' }} />;
}

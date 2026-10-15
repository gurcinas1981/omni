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

/** FOX insignia — geometric four-facet mask (ecosystem mark). */
export function FoxMark({ size = 22, className }: { size?: number; className?: string }) {
  const tri = (pts: [number, number][]) => pts.map(([x, y]) => `${50 + x * 46},${50 - y * 46}`).join(' ');
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} role="img" aria-label="FOX Intelligence">
      <polygon points={tri([[-0.66, 0.72], [-0.07, 0.14], [-0.44, -0.04]])} fill="#E8C987" />
      <polygon points={tri([[0.66, 0.72], [0.07, 0.14], [0.44, -0.04]])} fill="#C8A96A" />
      <polygon points={tri([[-0.44, -0.1], [-0.06, 0.06], [-0.03, -0.78]])} fill="#B48A45" />
      <polygon points={tri([[0.44, -0.1], [0.06, 0.06], [0.03, -0.78]])} fill="#9C7636" />
    </svg>
  );
}

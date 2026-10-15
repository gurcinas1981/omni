import { SYMBOL_ATLAS, SYMBOL_BY_ID } from '@/lib/registry/symbols';

/** Tintable OMNI Symbol Library icon (CSS mask over the shared atlas — one image request for all icons). */
export default function SymbolIcon({ id, size = 18, color = 'currentColor', title }: { id: string; size?: number; color?: string; title?: string }) {
  const s = SYMBOL_BY_ID[id];
  if (!s) return null;
  const pos = `${(s.col / (SYMBOL_ATLAS.cols - 1)) * 100}% ${(s.row / (SYMBOL_ATLAS.rows - 1)) * 100}%`;
  const mask = {
    WebkitMaskImage: `url(${SYMBOL_ATLAS.src})`,
    maskImage: `url(${SYMBOL_ATLAS.src})`,
    WebkitMaskSize: `${SYMBOL_ATLAS.cols * 100}% ${SYMBOL_ATLAS.rows * 100}%`,
    maskSize: `${SYMBOL_ATLAS.cols * 100}% ${SYMBOL_ATLAS.rows * 100}%`,
    WebkitMaskPosition: pos,
    maskPosition: pos,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
  } as React.CSSProperties;
  return (
    <span
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className="sym-icon"
      style={{ width: size, height: size, background: color, display: 'inline-block', flex: 'none', ...mask }}
    />
  );
}

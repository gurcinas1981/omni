'use client';
/**
 * Explain-next-to-cursor: hovering any graph, parameter or function shows a short, plain-English
 * explanation beside the pointer. Keyboard focus shows the same text beside the focused control.
 * 3D spheres explain themselves through the scene's hover state.
 */
import { useEffect, useRef, useState } from 'react';
import { EXPLAIN, ruleFor, type Explain } from '@/lib/explain';
import { NODE_BY_ID } from '@/lib/registry/nodes';
import { SYMBOL_BY_ID } from '@/lib/registry/symbols';
import { getState, subscribe } from '@/components/scene/store';

const DWELL_MS = 260;
const STAGE_DWELL_MS = 1500;

function nodeExplain(id: string): Explain | null {
  const n = NODE_BY_ID[id];
  if (!n) return null;
  return {
    kind: 'Sphere',
    title: n.label,
    body: `${n.domain}. ${n.description}`,
    how: `Symbol: ${SYMBOL_BY_ID[n.symbol]?.name ?? n.symbol}. Click to bring it to the centre.`,
  };
}

/** Walk up from the target to the nearest explainable element. */
function resolve(target: Element | null): { el: Element; entry: Explain; stage: boolean } | null {
  let el: Element | null = target;
  for (let i = 0; el && i < 8; i++, el = el.parentElement) {
    const key = el.getAttribute('data-explain');
    if (key) {
      if (key === 'stage') {
        const hovered = getState().hovered;
        const n = hovered ? nodeExplain(hovered) : null;
        return n ? { el, entry: n, stage: false } : { el, entry: EXPLAIN.stage, stage: true };
      }
      const e = key.startsWith('node:') ? nodeExplain(key.slice(5)) : EXPLAIN[key];
      if (e) return { el, entry: e, stage: false };
    }
    const k = ruleFor(el);
    if (k && EXPLAIN[k]) return { el, entry: EXPLAIN[k], stage: false };
  }
  return null;
}

export default function ExplainLayer() {
  const [tip, setTip] = useState<{ entry: Explain; x: number; y: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const cur = useRef<{ el: Element | null; entry: Explain | null; since: number; stage: boolean }>({ el: null, entry: null, since: 0, stage: false });
  const pos = useRef({ x: 0, y: 0, still: 0 });
  const timer = useRef<number | undefined>(undefined);
  const raf = useRef(0);

  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) return; // touch devices: no cursor to follow

    const place = (x: number, y: number) => {
      const el = box.current;
      if (!el) return;
      const w = el.offsetWidth || 300;
      const h = el.offsetHeight || 90;
      let left = x + 18;
      let top = y + 20;
      if (left + w > window.innerWidth - 10) left = x - w - 14;
      if (top + h > window.innerHeight - 10) top = y - h - 14;
      el.style.transform = `translate3d(${Math.max(8, left)}px, ${Math.max(8, top)}px, 0)`;
    };

    const evaluate = (target: Element | null, x: number, y: number, moved: boolean) => {
      const r = resolve(target);
      const c = cur.current;
      const sameEl = r && c.el === r.el && c.entry?.title === r.entry.title;
      if (!r) {
        c.el = null;
        c.entry = null;
        clearTimeout(timer.current);
        setTip(null);
        return;
      }
      // the ambient stage explanation only appears when the pointer rests, and hides on movement
      if (r.stage && moved) {
        clearTimeout(timer.current);
        setTip(null);
        c.el = r.el;
        c.entry = r.entry;
        c.stage = true;
        timer.current = window.setTimeout(() => setTip({ entry: r.entry, x: pos.current.x, y: pos.current.y }), STAGE_DWELL_MS);
        return;
      }
      if (sameEl) {
        place(x, y);
        return;
      }
      c.el = r.el;
      c.entry = r.entry;
      c.stage = r.stage;
      clearTimeout(timer.current);
      setTip(null);
      timer.current = window.setTimeout(() => setTip({ entry: r.entry, x: pos.current.x, y: pos.current.y }), DWELL_MS);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const dx = e.clientX - pos.current.x;
      const dy = e.clientY - pos.current.y;
      const moved = dx * dx + dy * dy > 36;
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => evaluate(e.target as Element, e.clientX, e.clientY, moved));
    };
    const onLeave = () => {
      clearTimeout(timer.current);
      cur.current.el = null;
      setTip(null);
    };
    const onFocus = (e: FocusEvent) => {
      const t = e.target as Element;
      if (!(t instanceof HTMLElement) || !t.matches(':focus-visible')) return;
      const r = resolve(t);
      if (!r || r.stage) return;
      const rect = t.getBoundingClientRect();
      cur.current = { el: r.el, entry: r.entry, since: performance.now(), stage: false };
      setTip({ entry: r.entry, x: rect.left, y: rect.bottom });
    };
    const onBlur = () => setTip(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTip(null);
    };
    // 3D hover changes without pointer movement (spheres orbit under a resting cursor)
    const unsub = subscribe(() => {
      const under = document.elementFromPoint(pos.current.x, pos.current.y);
      if (under?.closest('[data-explain="stage"]')) evaluate(under, pos.current.x, pos.current.y, false);
    });

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('focusin', onFocus);
    window.addEventListener('focusout', onBlur);
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onLeave, { passive: true, capture: true });
    return () => {
      unsub();
      clearTimeout(timer.current);
      cancelAnimationFrame(raf.current);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('focusin', onFocus);
      window.removeEventListener('focusout', onBlur);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onLeave, { capture: true });
    };
  }, []);

  useEffect(() => {
    if (!tip || !box.current) return;
    const el = box.current;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    let left = tip.x + 18;
    let top = tip.y + 20;
    if (left + w > window.innerWidth - 10) left = tip.x - w - 14;
    if (top + h > window.innerHeight - 10) top = tip.y - h - 14;
    el.style.transform = `translate3d(${Math.max(8, left)}px, ${Math.max(8, top)}px, 0)`;
  }, [tip]);

  return (
    <div ref={box} className={`explain ${tip ? 'in' : ''}`} role="tooltip" aria-hidden={!tip}>
      {tip && (
        <>
          <span className="ex-kind">{tip.entry.kind}</span>
          <strong className="ex-title">{tip.entry.title}</strong>
          <p className="ex-body">{tip.entry.body}</p>
          {tip.entry.how && <p className="ex-how">{tip.entry.how}</p>}
        </>
      )}
    </div>
  );
}

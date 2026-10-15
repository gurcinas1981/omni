'use client';
import { useMemo as _useMemo, useRef as _useRef, useSyncExternalStore } from 'react';
import type { ShaderMaterial } from 'three';

/** Navigation states from the environment brief. */
export type Phase = 'DORMANT' | 'AWAKENING' | 'TEMPLE_IDLE' | 'NODE_FOCUSED' | 'LOW_POWER';

export interface UniverseState {
  phase: Phase;
  hovered: string | null;
  selected: string | null;
  reducedMotion: boolean;
  lowPower: boolean;
  /** 0 → 1 intro progress (read imperatively inside useFrame through `wake`). */
  introDone: boolean;
}

let state: UniverseState = {
  phase: 'DORMANT',
  hovered: null,
  selected: null,
  reducedMotion: false,
  lowPower: false,
  introDone: false,
};
const listeners = new Set<() => void>();

/** Mutable, non-reactive values read every frame (no React re-render). */
export const frame = { wake: 0, introStart: -1, focusPulse: 0 };

export function getState() {
  return state;
}
export function setState(patch: Partial<UniverseState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}
export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
export function useUniverse<T>(selector: (s: UniverseState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state));
}

export function selectNode(id: string | null) {
  frame.focusPulse = 1;
  setState({ selected: id, phase: id ? 'NODE_FOCUSED' : 'TEMPLE_IDLE' });
  if (typeof window !== 'undefined') {
    const url = id ? `#${id}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  }
}
export function hoverNode(id: string | null) {
  if (state.hovered !== id) setState({ hovered: id });
  if (typeof document !== 'undefined') document.body.style.cursor = id ? 'pointer' : '';
}
export function skipIntro() {
  frame.wake = 1;
  setState({ introDone: true, phase: state.selected ? 'NODE_FOCUSED' : 'TEMPLE_IDLE' });
}

/** Staged reveal helper: 0 before a, 1 after b (in intro seconds, 0..8). */
export function stage(a: number, b: number) {
  const t = frame.wake * 8;
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
}

/**
 * R3F may clone the `uniforms` object passed as a prop, so per-frame updates must target the
 * live material. `u()` returns the material's uniforms (falling back to the initial set).
 */
export function useUniforms<T extends Record<string, { value: unknown }>>(init: () => T) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memo = _useMemo(init, []);
  const ref = _useRef<ShaderMaterial>(null);
  const u = () => (ref.current?.uniforms ?? memo) as unknown as T;
  return { memo, ref, u };
}

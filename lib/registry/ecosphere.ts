/**
 * OMNI ecosphere layout — FOX Intelligence orbital language (foxintelligence.co.uk), OMNI edition:
 *   centre   the Ω inside a gold wire globe (OMNISYNAPSE supervisory core)
 *   globes   every category is a textured globe carrying its OMNI symbol, each on its OWN orbital plane
 *   swarm    the remaining OMNI Symbol Library flies on random great circles through the spherical environment
 * Shared by the opener and the live view so the opening sequence lands exactly on the interface.
 */
import * as THREE from 'three';
import { NODES, type SceneNode } from './nodes';
import { OMNI_SYMBOLS, type OmniSymbol } from './symbols';

/** Tint families: human domains (gold), synthetic domains (cyan), cycle + guardians (violet). */
export const LANES = [
  { tint: 0xf4dea6, css: '#f4dea6', base: '#6b5428', title: 'Human domains' },
  { tint: 0x8fe9ff, css: '#8fe9ff', base: '#1d4f63', title: 'Synthetic domains' },
  { tint: 0xd9c3ff, css: '#d9c3ff', base: '#43306b', title: 'Cycle & guardians' },
] as const;

export interface Orbit {
  r: number;
  incl: number;
  node: number;
  speed: number;
  planR: number;
}
export interface Satellite {
  node: SceneNode;
  lane: number;
  phase: number;
  orbit: Orbit;
  ringed: boolean;
}

/** Deterministic PRNG so the system looks identical on every load. */
function prng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

/** Every category except OMNISYNAPSE (the Ω centre) is a globe — the FOX ecosystem gateway included. */
export const SATELLITES: Satellite[] = (() => {
  const rnd = prng(42);
  const raw = NODES.filter((n) => n.kind !== 'core');
  // interleave lanes so neighbouring orbits differ in colour
  const order = raw;
  const lanes = order.map((n) => (n.kind === 'symbol' ? (n.side === 'left' ? 0 : 1) : n.kind === 'gateway' ? 0 : 2));
  const idx = order.map((_, i) => i);
  const woven: number[] = [];
  const buckets = [0, 1, 2].map((l) => idx.filter((i) => lanes[i] === l));
  while (buckets.some((b) => b.length)) for (const b of buckets) if (b.length) woven.push(b.shift()!);
  return woven.map((i, k) => {
    const r = 4.4 + k * 0.6;
    return {
      node: order[i],
      lane: lanes[i],
      phase: rnd() * Math.PI * 2,
      orbit: {
        r,
        incl: (rnd() * 2 - 1) * 1.15,
        node: rnd() * Math.PI * 2,
        speed: (0.9 / Math.sqrt(r)) * 0.32,
        planR: 4.4 + k * 1.15,
      },
      ringed: order[i].kind === 'guardian',
    };
  });
})();

/** Library signs not assigned to a category — they fly through the spherical environment. */
export const FLYERS: { sym: OmniSymbol; orbit: Orbit; phase: number; planAngle: number }[] = (() => {
  const rnd = prng(7);
  const used = new Set(NODES.map((n) => n.symbol));
  return OMNI_SYMBOLS.filter((s) => !used.has(s.id)).map((sym, i, arr) => {
    const r = 12 + rnd() * 3.5;
    return {
      sym,
      phase: rnd() * Math.PI * 2,
      orbit: { r, incl: (rnd() * 2 - 1) * 1.5, node: rnd() * Math.PI * 2, speed: (rnd() > 0.5 ? 1 : -1) * (0.04 + rnd() * 0.05), planR: 18.8 },
      planAngle: (i / arr.length) * Math.PI * 2, // plan view: evenly on the outer ring
    };
  });
})();

const basisCache = new Map<string, { u: THREE.Vector3; v: THREE.Vector3 }>();
export function orbitBasis(o: Orbit) {
  const key = `${o.incl}|${o.node}`;
  let b = basisCache.get(key);
  if (!b) {
    const u = new THREE.Vector3(Math.cos(o.node), 0, Math.sin(o.node));
    const v = new THREE.Vector3(-Math.sin(o.node) * Math.cos(o.incl), Math.sin(o.incl), Math.cos(o.node) * Math.cos(o.incl));
    b = { u, v };
    basisCache.set(key, b);
  }
  return b;
}
/** 3D orbital position at angle `ang` on the orbit's own plane. */
export function orbitPoint(o: Orbit, ang: number, out = new THREE.Vector3()) {
  const { u, v } = orbitBasis(o);
  return out.copy(u).multiplyScalar(Math.cos(ang) * o.r).addScaledVector(v, Math.sin(ang) * o.r);
}
/** Plan (top-down) position on a concentric circle. */
export function planPoint(o: Orbit, ang: number, out = new THREE.Vector3()) {
  return out.set(Math.cos(ang) * o.planR, 0, Math.sin(ang) * o.planR);
}
export function orbitLine(o: Orbit, n = 200) {
  const a = new Float32Array(n * 3);
  const p = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    orbitPoint(o, (i / n) * Math.PI * 2, p);
    a.set([p.x, p.y, p.z], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(a, 3));
  return g;
}
export function circlePoints(r: number, n: number) {
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    a.set([Math.cos(t) * r, 0, Math.sin(t) * r], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(a, 3));
  return g;
}
export function fibonacciShell(n: number, radius: number) {
  const a = new Float32Array(n * 3);
  const ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    a.set([Math.cos(ga * i) * r * radius, y * radius, Math.sin(ga * i) * r * radius], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(a, 3));
  return g;
}

/** Home camera frames — the opener ends on ECO exactly. */
export const ECO_CAM = { pos: new THREE.Vector3(0, 6.5, 30), target: new THREE.Vector3(0, 0.2, 0), portraitScale: 1.7 };
export const PLAN_CAM = { pos: new THREE.Vector3(0, 50, 0.01), target: new THREE.Vector3(0, 0, 0) };
/** Where a selected globe sits (it becomes the centre) and where the Ω core retreats to. */
export const FOCUS_SCALE = 2.6;
export const CORE_RETREAT = new THREE.Vector3(0, 3.2, -10);

/** The opener runs the orbits for this long before handing over, so the live view continues seamlessly. */
export const HANDOFF_ORBIT_T = 5.5;

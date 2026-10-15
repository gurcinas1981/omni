/**
 * OMNI ecosphere layout (per the founder's sketch):
 *   centre  — FOX Intelligence core (NEXUS) with the fox inside a wire sphere
 *   atom    — every category as its OMNI symbol inside a dotted sphere, on three crossing orbits, spoked to the core
 *   ring    — the rest of the OMNI Symbol Library circling the whole system
 *   top     — 3D OMNISYNAPSE logo (Ω + wordmark) · bottom — 3D ORBIT logo
 * Each element has an ECOSPHERE (3D) position and a PLAN (top-down) position; views blend between them.
 * Shared by the opener and the live view so the opening sequence lands exactly on the interface.
 */
import * as THREE from 'three';
import { NODES, type SceneNode } from './nodes';
import { OMNI_SYMBOLS, type OmniSymbol } from './symbols';

/** Three crossing "atom" orbits: human domains (gold), synthetic domains (cyan), cycle + guardians (violet). */
export const LANES = [
  { r: 7.4, rot: 0.25, tilt: 1.02, speed: 0.22, planR: 6.2, tint: 0xf4dea6, css: '#f4dea6', title: 'Human domains' },
  { r: 8.4, rot: 0.25 + Math.PI / 3, tilt: 1.02, speed: -0.16, planR: 10.4, tint: 0x8fe9ff, css: '#8fe9ff', title: 'Synthetic domains' },
  { r: 9.4, rot: 0.25 + (2 * Math.PI) / 3, tilt: 1.02, speed: 0.12, planR: 14.6, tint: 0xd9c3ff, css: '#d9c3ff', title: 'Cycle & guardians' },
] as const;

export const OUTER = { r: 13.6, planR: 19.4, speed: 0.035, tint: 0xcfe6dc, css: '#cfe6dc' };
export const LOGO_TOP = { eco: new THREE.Vector3(0, 15.6, 0), plan: new THREE.Vector3(0, 0, -23.4) };
export const LOGO_BOTTOM = { eco: new THREE.Vector3(0, -11.4, 0.6), plan: new THREE.Vector3(0, 0, 23.2) };
/** Home camera frames — the opener ends on ECO exactly. */
export const ECO_CAM = { pos: new THREE.Vector3(0, 2.4, 43), target: new THREE.Vector3(0, 3.1, 0), portraitScale: 1.75 };
export const PLAN_CAM = { pos: new THREE.Vector3(0, 68, -1.2), target: new THREE.Vector3(0, 0, -1.2) };

export interface Satellite {
  node: SceneNode;
  lane: number;
  phase: number;
}

/** Every category except OMNISYNAPSE (top logo) and the FOX ecosystem (centre core). */
export const SATELLITES: Satellite[] = (() => {
  const raw = NODES.filter((n) => n.kind !== 'core' && n.kind !== 'gateway').map((n) => ({
    node: n,
    lane: n.kind === 'symbol' ? (n.side === 'left' ? 0 : 1) : 2,
  }));
  const count = [0, 0, 0];
  raw.forEach((r) => count[r.lane]++);
  const idx = [0, 0, 0];
  return raw.map((r) => ({ ...r, phase: (idx[r.lane]++ / count[r.lane]) * Math.PI * 2 + [0, Math.PI / 4, Math.PI / 6][r.lane] }));
})();

/** The library signs not assigned to a category — they form the outer ring. */
export const OUTER_SYMBOLS: { sym: OmniSymbol; phase: number }[] = (() => {
  const used = new Set(NODES.map((n) => n.symbol));
  const rest = OMNI_SYMBOLS.filter((s) => !used.has(s.id));
  return rest.map((sym, i) => ({ sym, phase: (i / rest.length) * Math.PI * 2 }));
})();

export function laneBasis(k: number) {
  const L = LANES[k];
  const u = new THREE.Vector3(Math.cos(L.rot), Math.sin(L.rot), 0);
  const perp = new THREE.Vector3(-Math.sin(L.rot), Math.cos(L.rot), 0);
  const v = perp.multiplyScalar(Math.cos(L.tilt)).add(new THREE.Vector3(0, 0, Math.sin(L.tilt)));
  return { u, v };
}
export const LANE_BASES = LANES.map((_, k) => laneBasis(k));

/** Ecosphere (3D atom) position of a satellite at orbital angle `ang`. */
export function ecoPoint(lane: number, ang: number, out = new THREE.Vector3()) {
  const L = LANES[lane];
  const B = LANE_BASES[lane];
  return out.copy(B.u).multiplyScalar(Math.cos(ang) * L.r).addScaledVector(B.v, Math.sin(ang) * L.r);
}
/** Plan (top-down) position: concentric circles in the XZ plane. */
export function planPoint(lane: number, ang: number, out = new THREE.Vector3()) {
  const R = LANES[lane].planR;
  return out.set(Math.cos(ang) * R, 0, Math.sin(ang) * R);
}
export function outerEco(ang: number, out = new THREE.Vector3()) {
  return out.set(Math.cos(ang) * OUTER.r, Math.sin(ang) * OUTER.r, 0);
}
export function outerPlan(ang: number, out = new THREE.Vector3()) {
  return out.set(Math.cos(ang) * OUTER.planR, 0, Math.sin(ang) * OUTER.planR);
}

export function ellipsePoints(k: number, n = 240) {
  const a = new Float32Array(n * 3);
  const p = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    ecoPoint(k, (i / n) * Math.PI * 2, p);
    a.set([p.x, p.y, p.z], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(a, 3));
  return g;
}
export function circlePoints(r: number, n: number, plane: 'xy' | 'xz') {
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    a.set(plane === 'xy' ? [Math.cos(t) * r, Math.sin(t) * r, 0] : [Math.cos(t) * r, 0, Math.sin(t) * r], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(a, 3));
  return g;
}

/** Fibonacci-sphere point cloud (ORBIT environment / dotted symbol spheres). */
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

/**
 * OMNI ecosphere layout — shared by the opener and the interactive ecosphere view so the
 * opening sequence lands exactly on the live interface.
 */
import * as THREE from 'three';
import { NODES, type SceneNode } from './nodes';

/** Three orbital lanes: human domains (gold), synthetic domains (cyan), cycle + guardians (violet). */
export const LANES = [
  { r: 4.9, incl: 0.42, node: 0.2, speed: 0.2, tint: 0xf4dea6, css: '#f4dea6', title: 'Human domains' },
  { r: 6.1, incl: -0.6, node: 1.5, speed: -0.14, tint: 0x8fe9ff, css: '#8fe9ff', title: 'Synthetic domains' },
  { r: 7.2, incl: 0.95, node: 2.7, speed: 0.09, tint: 0xd9c3ff, css: '#d9c3ff', title: 'Cycle & guardians' },
] as const;

export interface Satellite {
  node: SceneNode;
  lane: number;
  /** starting angle on its lane */
  phase: number;
}

/** Every category except the Ω (core) and FOX (gateway) orbits as its own library symbol. */
export const SATELLITES: Satellite[] = (() => {
  const raw = NODES.filter((n) => n.kind !== 'core' && n.kind !== 'gateway').map((n) => ({
    node: n,
    lane: n.kind === 'symbol' ? (n.side === 'left' ? 0 : 1) : 2,
  }));
  const count = [0, 0, 0];
  raw.forEach((r) => count[r.lane]++);
  const idx = [0, 0, 0];
  return raw.map((r) => ({ ...r, phase: (idx[r.lane]++ / count[r.lane]) * Math.PI * 2 + r.lane * 0.5 }));
})();

export function orbitBasis(incl: number, node: number) {
  const u = new THREE.Vector3(Math.cos(node), 0, Math.sin(node));
  const v = new THREE.Vector3(-Math.sin(node) * Math.cos(incl), Math.sin(incl), Math.cos(node) * Math.cos(incl));
  return { u, v };
}
export const LANE_BASES = LANES.map((L) => orbitBasis(L.incl, L.node));

/** Position of a satellite on its lane at orbital angle `ang` (lane-local, before group rotation). */
export function lanePoint(lane: number, ang: number, out = new THREE.Vector3()) {
  const L = LANES[lane];
  const B = LANE_BASES[lane];
  return out.copy(B.u).multiplyScalar(Math.cos(ang) * L.r).addScaledVector(B.v, Math.sin(ang) * L.r);
}

export function dottedCircle(r: number, n: number, u: THREE.Vector3, v: THREE.Vector3) {
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const c = Math.cos(t) * r;
    const s = Math.sin(t) * r;
    a.set([u.x * c + v.x * s, u.y * c + v.y * s, u.z * c + v.z * s], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(a, 3));
  return g;
}

/** Fibonacci-sphere point shell (ORBIT environment). */
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

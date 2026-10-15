/**
 * FOX ecosystem mark — four faceted shards (two ears, two cheeks).
 * Outline and apex coordinates match ORBIT (fox-orbit/src/parts/05-scene.js) so the
 * 3D fox is identical across FOX platforms.
 */
import * as THREE from 'three';

export const FOX_EAR: [number, number][] = [[-0.97, 1.24], [-0.13, 0.21], [-0.97, -0.21]];
export const FOX_EAR_APEX: [number, number] = [-0.62, 0.42];
export const FOX_CHEEK: [number, number][] = [[-0.87, -0.27], [-0.34, -0.13], [-0.16, -0.42], [-0.05, -1.34]];
export const FOX_CHEEK_APEX: [number, number] = [-0.36, -0.42];
const mirror = (a: [number, number][]) => a.map(([x, y]) => [-x, y] as [number, number]).reverse();

/** Faceted pyramid shard from a 2D outline plus a raised apex (flat-shaded, non-indexed). */
export function shardGeometry(pts: [number, number][], apex: [number, number], depth: number) {
  const pos: number[] = [];
  const A = [apex[0], apex[1], depth];
  const B = [apex[0], apex[1], -depth * 0.35];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    pos.push(p[0], p[1], 0, q[0], q[1], 0, A[0], A[1], A[2]);
    pos.push(q[0], q[1], 0, p[0], p[1], 0, B[0], B[1], B[2]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

/** The four shard geometries in assembly order: left ear, right ear, left cheek, right cheek. */
export function foxShards() {
  return [
    shardGeometry(FOX_EAR, FOX_EAR_APEX, 0.42),
    shardGeometry(mirror(FOX_EAR), [-FOX_EAR_APEX[0], FOX_EAR_APEX[1]], 0.42),
    shardGeometry(FOX_CHEEK, FOX_CHEEK_APEX, 0.36),
    shardGeometry(mirror(FOX_CHEEK), [-FOX_CHEEK_APEX[0], FOX_CHEEK_APEX[1]], 0.36),
  ];
}

export const foxGoldMaterial = () =>
  new THREE.MeshStandardMaterial({ color: 0xd8ac55, metalness: 0.72, roughness: 0.28, flatShading: true, emissive: 0x2a1a04, emissiveIntensity: 0.6 });

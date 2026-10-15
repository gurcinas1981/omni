import * as THREE from 'three';
import { NODES } from '@/lib/registry/nodes';

/** World layout — composition mirrors the supplied 16:9 reference (symmetrical temple). */
export const FLOOR_Y = -2.4;
export const BRAIN_CENTER = new THREE.Vector3(0, 4.35, 0);
export const ASTROLABE_CENTER = new THREE.Vector3(0, 3.45, -0.6);
export const ASTROLABE_RADIUS = 5.25;
export const FOX_POS = new THREE.Vector3(0, 1.15, 1.1);
export const ALTAR_POS = new THREE.Vector3(0, FLOOR_Y, 1.6);
export const GUARDIAN_X = 7.0;
export const COLUMN_X = 9.6;

export const CAMERA_HOME = new THREE.Vector3(0, 1.6, 15.5);
export const LOOK_HOME = new THREE.Vector3(0, 2.4, 0);

export const PALETTE = {
  obsidian: '#080C12',
  navy: '#071827',
  green: '#163A32',
  gold: '#C8A96A',
  amber: '#F2B45C',
  cyan: '#35D9F5',
  blue: '#3D8CFF',
  violet: '#9C6BFF',
  ivory: '#F7F6F1',
};

export function symbolPosition(angle: number) {
  return new THREE.Vector3(
    ASTROLABE_CENTER.x + Math.cos(angle) * ASTROLABE_RADIUS,
    ASTROLABE_CENTER.y + Math.sin(angle) * ASTROLABE_RADIUS,
    ASTROLABE_CENTER.z + 0.4,
  );
}

/** Where the camera should look/stand to frame each node. */
export function focusFor(id: string | null): { pos: THREE.Vector3; look: THREE.Vector3 } {
  if (!id) return { pos: CAMERA_HOME.clone(), look: LOOK_HOME.clone() };
  const node = NODES.find((n) => n.id === id);
  if (!node) return { pos: CAMERA_HOME.clone(), look: LOOK_HOME.clone() };
  let target: THREE.Vector3;
  let dist = 7.5;
  switch (node.kind) {
    case 'core':
      target = BRAIN_CENTER.clone();
      dist = 13.5;
      break;
    case 'gateway':
      target = FOX_POS.clone().add(new THREE.Vector3(0, 0.8, 0));
      dist = 9;
      break;
    case 'altar':
      target = ALTAR_POS.clone().add(new THREE.Vector3(0, 0.6, 0));
      dist = 6.5;
      break;
    case 'guardian':
      target = new THREE.Vector3(node.side === 'left' ? -GUARDIAN_X : GUARDIAN_X, FLOOR_Y + 2.0, 1.8);
      dist = 6;
      break;
    default:
      target = symbolPosition(node.angle ?? 0);
      dist = 7.5;
  }
  // Keep a gentle 3/4 angle and shift the subject away from the info panel (right side on desktop).
  const pos = target.clone().add(new THREE.Vector3(target.x * 0.12 + 1.1, 0.3, dist));
  const look = target.clone().add(new THREE.Vector3(1.1, 0, 0));
  return { pos, look };
}

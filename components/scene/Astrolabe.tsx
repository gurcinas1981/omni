'use client';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { NODES, type SceneNode } from '@/lib/registry/nodes';
import { ASTROLABE_CENTER, ASTROLABE_RADIUS, BRAIN_CENTER, symbolPosition } from './layout';
import { getState, hoverNode, selectNode, stage } from './store';
import { motifTexture } from './textures';

const SYMBOLS = NODES.filter((n) => n.kind === 'symbol');

interface RingProps { r: number; color: string; width?: number; speed?: number; tilt?: [number, number, number]; dashed?: boolean; revealAt?: number }
function Ring({ r, color, width = 0.012, speed = 0, tilt = [0, 0, 0], dashed = false, revealAt = 4.8 }: RingProps) {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    const s = getState();
    if (ref.current && !s.reducedMotion) ref.current.rotation.z = clock.elapsedTime * speed;
    if (mat.current) mat.current.opacity = stage(revealAt, revealAt + 1.2) * (dashed ? 0.55 : 0.85);
  });
  const geo = useMemo(() => {
    if (!dashed) return new THREE.RingGeometry(r - width, r + width, 256, 1);
    // dashed: tick ring
    const g = new THREE.BufferGeometry();
    const verts: number[] = [];
    const n = 180;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2;
      const a1 = a0 + (Math.PI * 2) / n * 0.45;
      const r0 = r - width * (i % 5 === 0 ? 6 : 3);
      const r1 = r + width;
      const p = (a: number, rr: number) => [Math.cos(a) * rr, Math.sin(a) * rr, 0];
      verts.push(...p(a0, r0), ...p(a1, r0), ...p(a1, r1), ...p(a0, r0), ...p(a1, r1), ...p(a0, r1));
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    return g;
  }, [r, width, dashed]);
  return (
    <mesh ref={ref} geometry={geo} rotation={tilt}>
      <meshBasicMaterial ref={mat} color={color} transparent toneMapped={false} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

function Beads({ r, count, speed, color }: { r: number; count: number; speed: number; color: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current && !getState().reducedMotion) ref.current.rotation.z = clock.elapsedTime * speed;
    if (ref.current) ref.current.scale.setScalar(Math.max(0.0001, stage(5.2, 6.2)));
  });
  return (
    <group ref={ref}>
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2 + 0.3;
        return (
          <mesh key={i} position={[Math.cos(a) * r, Math.sin(a) * r, 0]}>
            <sphereGeometry args={[0.13, 24, 16]} />
            <meshPhysicalMaterial color={color} metalness={1} roughness={0.15} clearcoat={1} emissive={color} emissiveIntensity={0.25} />
          </mesh>
        );
      })}
    </group>
  );
}

function Medallion({ node, index }: { node: SceneNode; index: number }) {
  const group = useRef<THREE.Group>(null);
  const faceMat = useRef<THREE.MeshBasicMaterial>(null);
  const rimMat = useRef<THREE.MeshStandardMaterial>(null);
  const hover = useRef(0);
  const pos = useMemo(() => symbolPosition(node.angle ?? 0), [node.angle]);
  const tex = useMemo(() => motifTexture(node.motif!), [node.motif]);
  const link = useMemo(() => {
    const local = BRAIN_CENTER.clone().sub(pos);
    const dir = local.clone().normalize();
    const start = dir.clone().multiplyScalar(0.95);
    const end = local.clone().sub(dir.clone().multiplyScalar(2.6));
    const mid = start.clone().lerp(end, 0.5).add(new THREE.Vector3(0, 0, 0.6));
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(32));
    const mat = new THREE.LineBasicMaterial({
      color: node.side === 'left' ? '#ffd28a' : '#7fe6ff',
      transparent: true,
      toneMapped: false,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return new THREE.Line(geo, mat);
  }, [pos, node.side]);
  const reveal = 5.6 + index * 0.18;

  useFrame(({ clock }, dt) => {
    const s = getState();
    const target = s.hovered === node.id || s.selected === node.id ? 1 : 0;
    hover.current = THREE.MathUtils.damp(hover.current, target, 6, dt);
    const w = stage(reveal, reveal + 0.8);
    if (group.current) {
      const float = s.reducedMotion ? 0 : Math.sin(clock.elapsedTime * 0.7 + index) * 0.05;
      group.current.position.set(pos.x, pos.y + float, pos.z + hover.current * 0.35);
      group.current.scale.setScalar(Math.max(0.0001, w) * (1 + hover.current * 0.12));
    }
    if (faceMat.current) faceMat.current.opacity = 0.92;
    if (rimMat.current) rimMat.current.emissiveIntensity = 0.15 + hover.current * 1.1;
    (link.material as THREE.LineBasicMaterial).opacity = w * (0.12 + hover.current * 0.85);
  });

  const handlers = {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      hoverNode(node.id);
    },
    onPointerOut: () => hoverNode(null),
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      selectNode(node.id);
    },
  };

  return (
    <group ref={group} position={pos}>
      <primitive object={link} />
      <mesh {...handlers}>
        <circleGeometry args={[0.82, 64]} />
        <meshBasicMaterial ref={faceMat} map={tex} transparent toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh>
        <torusGeometry args={[0.86, 0.045, 16, 96]} />
        <meshStandardMaterial ref={rimMat} color="#c8a96a" metalness={1} roughness={0.25} emissive="#c8a96a" emissiveIntensity={0.15} />
      </mesh>
      <mesh>
        <torusGeometry args={[0.97, 0.012, 8, 96]} />
        <meshBasicMaterial color="#7fe6ff" toneMapped={false} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

export function Astrolabe() {
  return (
    <group>
      <group position={ASTROLABE_CENTER}>
        <Ring r={ASTROLABE_RADIUS + 1.15} color="#4fd7ff" width={0.01} speed={0.01} revealAt={4.6} />
        <Ring r={ASTROLABE_RADIUS + 0.95} color="#c8a96a" width={0.03} dashed speed={-0.006} revealAt={4.8} />
        <Ring r={ASTROLABE_RADIUS} color="#ffd28a" width={0.018} speed={0} revealAt={5.0} />
        <Ring r={ASTROLABE_RADIUS - 0.95} color="#4fd7ff" width={0.008} speed={0.02} revealAt={5.2} />
        <Ring r={ASTROLABE_RADIUS - 1.3} color="#9c6bff" width={0.006} dashed speed={-0.015} revealAt={5.4} />
        <Ring r={ASTROLABE_RADIUS + 0.4} color="#7fe6ff" width={0.006} speed={0.03} tilt={[0.95, 0.2, 0]} revealAt={5.5} />
        <Ring r={ASTROLABE_RADIUS - 0.2} color="#ffd28a" width={0.006} speed={-0.025} tilt={[-1.05, -0.35, 0]} revealAt={5.6} />
        <Beads r={ASTROLABE_RADIUS + 0.95} count={10} speed={-0.03} color="#d9b36c" />
        <Beads r={ASTROLABE_RADIUS - 0.95} count={6} speed={0.045} color="#b8c7d9" />
      </group>
      {SYMBOLS.map((n, i) => (
        <Medallion key={n.id} node={n} index={i} />
      ))}
    </group>
  );
}

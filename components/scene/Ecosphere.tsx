'use client';
/**
 * OMNI Ecosphere — live interface (founder's sketch, ORBIT visual language).
 *   centre  FOX Intelligence core (NEXUS): faceted fox inside a gold wire sphere, breathing shards, pulse waves
 *   atom    category symbols inside transparent dotted spheres on three crossing orbits, dashed spokes to the core
 *   ring    the remaining OMNI Symbol Library circling everything
 *   top     3D OMNISYNAPSE logo (Ω + wordmark)        bottom  3D ORBIT logo
 * Two layouts — ECOSPHERE (3D) and PLAN (top-down) — blend smoothly. Drag to rotate (ecosphere), scroll to zoom, click to focus.
 */
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useLoader, useThree, type ThreeEvent } from '@react-three/fiber';
import { Html, OrbitControls, useTexture } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { FontLoader, type Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { OMEGA_PATH } from '@/lib/brand/omega';
import { foxShards, foxGoldMaterial } from '@/lib/brand/fox';
import { SYMBOL_ATLAS, SYMBOL_BY_ID, type OmniSymbol } from '@/lib/registry/symbols';
import {
  ECO_CAM,
  PLAN_CAM,
  LANES,
  LOGO_BOTTOM,
  LOGO_TOP,
  OUTER,
  OUTER_SYMBOLS,
  SATELLITES,
  circlePoints,
  ecoPoint,
  ellipsePoints,
  fibonacciShell,
  outerEco,
  outerPlan,
  planPoint,
} from '@/lib/registry/ecosphere';
import { getState, hoverNode, selectNode, setState, useUniverse } from './store';

const ORBIT_URL = 'https://ecosystem.foxintelligence.co.uk/';


/** Shared animation state (no React re-renders). */
const anim = { orbitT: 0, blend: 0 };

/* ───────────── small texture helpers ───────────── */
function canvasTex(draw: (g: CanvasRenderingContext2D, s: number) => void, size = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d')!, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const radial = (stops: [number, string][]) =>
  canvasTex((g, s) => {
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    stops.forEach(([o, c]) => gr.addColorStop(o, c));
    g.fillStyle = gr;
    g.fillRect(0, 0, s, s);
  });
let _dot: THREE.Texture | null = null;
const dotTex = () => (_dot ??= radial([[0, '#fff'], [0.45, 'rgba(255,255,255,.75)'], [1, 'rgba(255,255,255,0)']]));
let _glow: THREE.Texture | null = null;
const glowTex = () => (_glow ??= radial([[0, 'rgba(255,255,255,.9)'], [0.25, 'rgba(255,255,255,.45)'], [1, 'rgba(0,0,0,0)']]));

const lerpV = (a: THREE.Vector3, b: THREE.Vector3, t: number, out: THREE.Vector3) => out.copy(a).lerp(b, t);
const smooth = (x: number) => x * x * (3 - 2 * x);

/* ───────────── a symbol inside a transparent dotted sphere ───────────── */
function useSymbolTexture(sym: OmniSymbol) {
  const atlas = useTexture(SYMBOL_ATLAS.src);
  return useMemo(() => {
    const t = atlas.clone();
    t.colorSpace = THREE.SRGBColorSpace;
    t.repeat.set(1 / SYMBOL_ATLAS.cols, 1 / SYMBOL_ATLAS.rows);
    t.offset.set(sym.col / SYMBOL_ATLAS.cols, 1 - (sym.row + 1) / SYMBOL_ATLAS.rows);
    t.needsUpdate = true;
    return t;
  }, [atlas, sym]);
}

type OrbHandlers = {
  onPointerOver?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
};

function DottedOrb({
  sym,
  tint,
  radius,
  points,
  hot,
  spin,
  handlers,
}: {
  sym: OmniSymbol;
  tint: string;
  radius: number;
  points: number;
  hot: React.MutableRefObject<number>;
  spin: number;
  handlers?: OrbHandlers;
}) {
  const tex = useSymbolTexture(sym);
  const shell = useMemo(() => fibonacciShell(points, radius), [points, radius]);
  const shellRef = useRef<THREE.Points>(null);
  const shellMat = useRef<THREE.PointsMaterial>(null);
  const glowMat = useRef<THREE.SpriteMaterial>(null);
  const symRef = useRef<THREE.Sprite>(null);
  useFrame(({ clock }) => {
    const rm = getState().reducedMotion;
    const h = hot.current;
    if (shellRef.current && !rm) {
      shellRef.current.rotation.y = clock.elapsedTime * spin;
      shellRef.current.rotation.x = clock.elapsedTime * spin * 0.4;
    }
    if (shellMat.current) shellMat.current.opacity = 0.45 + h * 0.5;
    if (glowMat.current) glowMat.current.opacity = 0.12 + h * 0.45;
    if (symRef.current) symRef.current.scale.setScalar(radius * 1.35 * (1 + h * 0.12));
  });
  return (
    <>
      <sprite scale={radius * 3.2}>
        <spriteMaterial ref={glowMat} map={glowTex()} color={tint} transparent opacity={0.12} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <points ref={shellRef} geometry={shell}>
        <pointsMaterial ref={shellMat} size={0.055} map={dotTex()} color={tint} transparent opacity={0.45} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      <mesh scale={radius * 0.98}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshBasicMaterial color={'#061018'} transparent opacity={0.28} depthWrite={false} />
      </mesh>
      <sprite ref={symRef} scale={radius * 1.35} renderOrder={3}>
        <spriteMaterial map={tex} color={tint} transparent depthWrite={false} toneMapped={false} />
      </sprite>
      <mesh scale={radius * 1.15} {...handlers}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
    </>
  );
}

/* ───────────── centre: FOX Intelligence core (NEXUS) ───────────── */
function FoxCore() {
  const fox = useRef<THREE.Group>(null);
  const wire = useRef<THREE.Group>(null);
  const waves = useRef<THREE.Mesh[]>([]);
  const mat = useMemo(foxGoldMaterial, []);
  const shards = useMemo(foxShards, []);
  const wireGeo = useMemo(() => new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(2.25, 3)), []);
  const nodes = useMemo(() => new THREE.IcosahedronGeometry(2.36, 4), []);
  const hot = useRef(0);
  useFrame(({ clock }, dt) => {
    const s = getState();
    const t = s.reducedMotion ? 0 : clock.elapsedTime;
    hot.current = THREE.MathUtils.damp(hot.current, s.hovered === 'fox' || s.selected === 'fox' ? 1 : 0, 6, dt);
    if (fox.current) {
      fox.current.rotation.y = Math.sin(t * 0.55) * 0.45;
      fox.current.rotation.x = Math.sin(t * 0.37) * 0.08;
      // breathing shards: the mark gently opens and re-assembles
      const breathe = (Math.sin(t * 1.1) * 0.5 + 0.5) * 0.12 + hot.current * 0.1;
      fox.current.children.forEach((m, i) => {
        const sx = i % 2 ? 1 : -1;
        const sy = i < 2 ? 1 : -1;
        m.position.set(sx * (0.06 + breathe), sy * breathe * 0.6, breathe * 0.8);
      });
      fox.current.scale.setScalar(1.05 * (1 + hot.current * 0.08));
      mat.emissiveIntensity = 0.7 + Math.max(0, Math.sin(t * 1.6)) * 0.5 + hot.current * 1.1;
    }
    if (wire.current) {
      wire.current.rotation.y = t * 0.2;
      wire.current.rotation.x = t * 0.06;
    }
    waves.current.forEach((w, i) => {
      if (!w) return;
      const k = s.reducedMotion ? 0 : (t * 0.22 + i / 3) % 1;
      w.scale.setScalar(1 + k * 2.2);
      (w.material as THREE.MeshBasicMaterial).opacity = Math.sin(k * Math.PI) * 0.22;
    });
  });
  const handlers: OrbHandlers = {
    onPointerOver: (e) => {
      e.stopPropagation();
      hoverNode('fox');
    },
    onPointerOut: () => hoverNode(null),
    onClick: (e) => {
      e.stopPropagation();
      selectNode('fox');
    },
  };
  return (
    <group name="eco-fox">
      <group ref={wire}>
        <lineSegments geometry={wireGeo}>
          <lineBasicMaterial color={0xd9b879} transparent opacity={0.3} />
        </lineSegments>
        <points geometry={nodes}>
          <pointsMaterial size={0.08} color={0xf4dea6} map={dotTex()} transparent opacity={0.75} depthWrite={false} />
        </points>
      </group>
      <sprite scale={9}>
        <spriteMaterial map={glowTex()} color={'#ffd28a'} transparent opacity={0.42} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <pointLight color={0xffd690} intensity={2} decay={0} />
      <group ref={fox}>
        {shards.map((g, i) => (
          <mesh key={i} geometry={g} material={mat} />
        ))}
      </group>
      {[0xd9b879, 0x6ad6b2, 0x9c6bff].map((c, i) => (
        <mesh key={i} ref={(el) => void (el && (waves.current[i] = el))} rotation={[Math.PI / 2 + (i - 1) * 0.35, 0, 0]}>
          <torusGeometry args={[2.5, 0.008, 6, 200]} />
          <meshBasicMaterial color={c} transparent opacity={0} toneMapped={false} />
        </mesh>
      ))}
      <mesh scale={2.4} {...handlers}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
      <Html position={[0, -2.9, 0]} center zIndexRange={[3, 0]}>
        <button className="plabel core" style={{ ['--c' as string]: '#d9b879' }} onClick={() => selectNode('fox')}>
          <b>FOX Intelligence</b>
          <small>NEXUS · central core</small>
        </button>
      </Html>
    </group>
  );
}

/* ───────────── category satellites ───────────── */
function Satellite({ index }: { index: number }) {
  const { node, lane, phase } = SATELLITES[index];
  const sym = SYMBOL_BY_ID[node.symbol];
  const tint = LANES[lane].css;
  const group = useRef<THREE.Group>(null);
  const label = useRef<HTMLButtonElement>(null);
  const hot = useRef(0);
  const spoke = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(1, 0, 0)]);
    const m = new THREE.LineDashedMaterial({ color: tint, dashSize: 0.25, gapSize: 0.18, transparent: true, opacity: 0.3, depthWrite: false });
    const l = new THREE.Line(g, m);
    l.frustumCulled = false;
    return l;
  }, [tint]);
  const e = useMemo(() => new THREE.Vector3(), []);
  const p = useMemo(() => new THREE.Vector3(), []);
  const w = useMemo(() => new THREE.Vector3(), []);
  const cam = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }, dt) => {
    const s = getState();
    const ang = phase + anim.orbitT * LANES[lane].speed;
    ecoPoint(lane, ang, e);
    planPoint(lane, ang, p);
    lerpV(e, p, smooth(anim.blend), w);
    group.current?.position.copy(w);
    const pos = spoke.geometry.attributes.position as THREE.BufferAttribute;
    pos.setXYZ(1, w.x, w.y, w.z);
    pos.needsUpdate = true;
    spoke.computeLineDistances();
    hot.current = THREE.MathUtils.damp(hot.current, s.hovered === node.id || s.selected === node.id ? 1 : 0, 6, dt);
    (spoke.material as THREE.LineDashedMaterial).opacity = 0.22 + hot.current * 0.6;
    if (label.current) {
      cam.copy(camera.position).normalize();
      const depth = THREE.MathUtils.clamp(0.5 + w.dot(cam) / (LANES[lane].r * 2), 0, 1);
      const show = Math.max(hot.current, anim.blend > 0.5 ? 1 : THREE.MathUtils.smoothstep(depth, 0.5, 0.72));
      label.current.style.opacity = String(show);
      label.current.classList.toggle('on', hot.current > 0.5);
    }
  });
  const handlers: OrbHandlers = {
    onPointerOver: (ev) => {
      ev.stopPropagation();
      hoverNode(node.id);
    },
    onPointerOut: () => hoverNode(null),
    onClick: (ev) => {
      ev.stopPropagation();
      selectNode(node.id);
    },
  };
  return (
    <>
      <primitive object={spoke} />
      <group ref={group} name={`eco-${node.id}`}>
        <DottedOrb sym={sym} tint={tint} radius={1.1} points={420} hot={hot} spin={0.35 + index * 0.02} handlers={handlers} />
        <Html position={[0, -1.55, 0]} center zIndexRange={[3, 0]}>
          <button
            ref={label}
            className="plabel"
            style={{ ['--c' as string]: tint }}
            onClick={() => selectNode(node.id)}
            onPointerEnter={() => hoverNode(node.id)}
            onPointerLeave={() => hoverNode(null)}
          >
            <b>{node.label}</b>
            <small>{sym.name}</small>
          </button>
        </Html>
      </group>
    </>
  );
}

/* ───────────── outer ring: the rest of the library ───────────── */
function OuterOrb({ index }: { index: number }) {
  const { sym, phase } = OUTER_SYMBOLS[index];
  const group = useRef<THREE.Group>(null);
  const hot = useRef(0);
  const [hover, setHover] = useState(false);
  const e = useMemo(() => new THREE.Vector3(), []);
  const p = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    const ang = phase + anim.orbitT * OUTER.speed;
    outerEco(ang, e);
    outerPlan(ang, p);
    group.current?.position.copy(e.lerp(p, smooth(anim.blend)));
    hot.current = THREE.MathUtils.damp(hot.current, hover ? 1 : 0, 6, dt);
  });
  const handlers: OrbHandlers = {
    onPointerOver: (ev) => {
      ev.stopPropagation();
      setHover(true);
      document.body.style.cursor = 'help';
    },
    onPointerOut: () => {
      setHover(false);
      document.body.style.cursor = '';
    },
  };
  return (
    <group ref={group}>
      <DottedOrb sym={sym} tint={OUTER.css} radius={0.75} points={240} hot={hot} spin={0.25 + index * 0.015} handlers={handlers} />
      {hover && (
        <Html position={[0, -0.95, 0]} center zIndexRange={[3, 0]}>
          <span className="plabel on" style={{ ['--c' as string]: OUTER.css, pointerEvents: 'none' }}>
            <b>{sym.name}</b>
            <small>{sym.meaning}</small>
          </span>
        </Html>
      )}
    </group>
  );
}

/* ───────────── 3D logos ───────────── */
const goldPhysical = () =>
  new THREE.MeshPhysicalMaterial({ color: 0xf0cf86, metalness: 0.8, roughness: 0.22, clearcoat: 0.9, emissive: 0xb07a22, emissiveIntensity: 0.6 });
const platinum = () =>
  new THREE.MeshPhysicalMaterial({ color: 0xdfe9ea, metalness: 0.85, roughness: 0.25, clearcoat: 1, emissive: 0x2f6f7a, emissiveIntensity: 0.55 });

function useWordmark(font: Font, text: string, size: number, depth: number) {
  return useMemo(() => {
    const g = new TextGeometry(text, { font, size, depth, curveSegments: 6, bevelEnabled: true, bevelThickness: depth * 0.25, bevelSize: size * 0.02, bevelSegments: 2 });
    g.center();
    return g;
  }, [font, text, size, depth]);
}

function useFlatInPlan(ref: React.RefObject<THREE.Group | null>, eco: THREE.Vector3, plan: THREE.Vector3) {
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    if (!ref.current) return;
    const b = smooth(anim.blend);
    ref.current.position.copy(lerpV(eco, plan, b, v));
    ref.current.rotation.x = (-Math.PI / 2) * b;
  });
}

function OmniLogo({ font }: { font: Font }) {
  const root = useRef<THREE.Group>(null);
  const omega = useRef<THREE.Mesh>(null);
  const hot = useRef(0);
  const omegaMat = useMemo(goldPhysical, []);
  const wordMat = useMemo(goldPhysical, []);
  const omegaGeo = useMemo(() => {
    const shapes = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${OMEGA_PATH}"/></svg>`).paths.flatMap((p) => p.toShapes());
    const g = new THREE.ExtrudeGeometry(shapes, { depth: 12, bevelEnabled: true, bevelThickness: 3, bevelSize: 2, bevelSegments: 3, curveSegments: 48 });
    g.center();
    g.scale(0.034, -0.034, -0.034);
    return g;
  }, []);
  const word = useWordmark(font, 'OMNISYNAPSE', 0.8, 0.2);
  useFlatInPlan(root, LOGO_TOP.eco, LOGO_TOP.plan);
  useFrame(({ clock }, dt) => {
    const s = getState();
    const t = s.reducedMotion ? 0 : clock.elapsedTime;
    hot.current = THREE.MathUtils.damp(hot.current, s.hovered === 'omnisynapse' || s.selected === 'omnisynapse' ? 1 : 0, 6, dt);
    if (omega.current) {
      omega.current.rotation.y = Math.sin(t * 0.7) * 0.35;
      omega.current.scale.setScalar(1 + hot.current * 0.08);
    }
    omegaMat.emissiveIntensity = 0.6 + Math.max(0, Math.sin(t * 1.4)) * 0.35 + hot.current * 0.7;
    wordMat.emissiveIntensity = 0.45 + hot.current * 0.5;
  });
  const handlers: OrbHandlers = {
    onPointerOver: (e) => {
      e.stopPropagation();
      hoverNode('omnisynapse');
    },
    onPointerOut: () => hoverNode(null),
    onClick: (e) => {
      e.stopPropagation();
      selectNode('omnisynapse');
    },
  };
  return (
    <group ref={root} name="eco-omnisynapse">
      <mesh ref={omega} geometry={omegaGeo} material={omegaMat} position={[0, 1.55, 0]} {...handlers} />
      <mesh geometry={word} material={wordMat} position={[0, -0.95, 0]} {...handlers} />
      <sprite scale={6} position={[0, 1.6, -1.2]}>
        <spriteMaterial map={glowTex()} color={'#ffd28a'} transparent opacity={0.28} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <mesh position={[0, 0.3, 0]} {...handlers}>
        <planeGeometry args={[10.5, 4.6]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
    </group>
  );
}

function OrbitLogo({ font }: { font: Font }) {
  const root = useRef<THREE.Group>(null);
  const swoosh = useRef<THREE.Group>(null);
  const moon = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);
  const mat = useMemo(platinum, []);
  const word = useWordmark(font, 'RBIT', 0.95, 0.2);
  useFlatInPlan(root, LOGO_BOTTOM.eco, LOGO_BOTTOM.plan);
  useFrame(({ clock }) => {
    const t = getState().reducedMotion ? 0 : clock.elapsedTime;
    if (moon.current) {
      const a = 0.55 + t * 0.6;
      moon.current.position.set(Math.cos(a) * 1.75, Math.sin(a) * 0.48, 0);
    }
    if (swoosh.current) swoosh.current.rotation.y = Math.sin(t * 0.4) * 0.25;
    mat.emissiveIntensity = 0.55 + (hover ? 0.8 : 0);
  });
  const handlers: OrbHandlers = {
    onPointerOver: (e) => {
      e.stopPropagation();
      setHover(true);
      document.body.style.cursor = 'pointer';
    },
    onPointerOut: () => {
      setHover(false);
      document.body.style.cursor = '';
    },
    onClick: (e) => {
      e.stopPropagation();
      window.open(ORBIT_URL, '_blank', 'noopener');
    },
  };
  return (
    <group ref={root}>
      <group position={[-2.05, 0, 0]}>
        <mesh material={mat}>
          <torusGeometry args={[0.72, 0.14, 24, 96]} />
        </mesh>
        <group ref={swoosh} rotation={[0, 0, 0.32]}>
          <mesh material={mat} scale={[1, 0.27, 1]}>
            <torusGeometry args={[1.75, 0.055, 12, 160, Math.PI * 1.55]} />
          </mesh>
          <mesh ref={moon} material={mat}>
            <sphereGeometry args={[0.17, 24, 16]} />
          </mesh>
        </group>
      </group>
      <mesh geometry={word} material={mat} position={[1.05, 0, 0]} />
      <mesh position={[-0.2, 0, 0]} {...handlers}>
        <planeGeometry args={[6.4, 2.2]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
      {hover && (
        <Html position={[0, -1.5, 0]} center zIndexRange={[3, 0]}>
          <span className="plabel on" style={{ ['--c' as string]: '#8fe9ff', pointerEvents: 'none' }}>
            <b>FOX ORBIT ↗</b>
            <small>Ecosystem observability · link only</small>
          </span>
        </Html>
      )}
    </group>
  );
}

/* ───────────── field: lanes, plan rings, outer ring, shell, stars, sketch stem ───────────── */
function Field() {
  const ecoLanes = useMemo(() => LANES.map((_, k) => ellipsePoints(k)), []);
  const planRings = useMemo(() => Array.from({ length: 12 }, (_, i) => circlePoints(3.6 + i * 1.4, 260, 'xz')), []);
  const outerEcoRing = useMemo(() => circlePoints(OUTER.r, 260, 'xy'), []);
  const outerPlanRing = useMemo(() => circlePoints(OUTER.planR, 260, 'xz'), []);
  const shell = useMemo(() => fibonacciShell(3200, 19), []);
  const stars = useMemo(() => {
    const n = 2400;
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = Math.random() * 2 - 1;
      const th = Math.random() * Math.PI * 2;
      const r = 70 + Math.random() * 140;
      const s = Math.sqrt(1 - u * u);
      a.set([r * s * Math.cos(th), r * u, r * s * Math.sin(th)], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(a, 3));
    return g;
  }, []);
  const stem = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 2.6, 0), new THREE.Vector3(0, LOGO_TOP.eco.y - 2.1, 0)]);
    const l = new THREE.Line(g, new THREE.LineDashedMaterial({ color: 0xd9b879, dashSize: 0.3, gapSize: 0.2, transparent: true, opacity: 0.45 }));
    l.computeLineDistances();
    return l;
  }, []);
  const ecoMats = useRef<THREE.PointsMaterial[]>([]);
  const planMats = useRef<THREE.PointsMaterial[]>([]);
  const starRef = useRef<THREE.Points>(null);
  useFrame(({ clock }) => {
    const b = smooth(anim.blend);
    ecoMats.current.forEach((m) => m && (m.opacity = 0.7 * (1 - b)));
    planMats.current.forEach((m) => m && (m.opacity = 0.55 * b));
    (stem.material as THREE.LineDashedMaterial).opacity = 0.45 * (1 - b);
    if (starRef.current && !getState().reducedMotion) starRef.current.rotation.y = clock.elapsedTime * 0.004;
  });
  const ecoColor = [0xd9b879, 0x6ad6b2, 0xb79cff];
  return (
    <>
      <points ref={starRef} geometry={stars}>
        <pointsMaterial size={0.55} map={dotTex()} color={0xcfe9dc} transparent opacity={0.7} depthWrite={false} fog={false} />
      </points>
      <points geometry={shell}>
        <pointsMaterial size={0.07} map={dotTex()} color={0x6ad6b2} transparent opacity={0.22} depthWrite={false} />
      </points>
      {ecoLanes.map((g, k) => (
        <points key={k} geometry={g}>
          <pointsMaterial ref={(m) => void (m && (ecoMats.current[k] = m))} size={0.08} map={dotTex()} color={ecoColor[k]} transparent depthWrite={false} />
        </points>
      ))}
      <points geometry={outerEcoRing}>
        <pointsMaterial ref={(m) => void (m && (ecoMats.current[3] = m))} size={0.09} map={dotTex()} color={0xcfe6dc} transparent depthWrite={false} />
      </points>
      {planRings.map((g, k) => (
        <points key={k} geometry={g}>
          <pointsMaterial ref={(m) => void (m && (planMats.current[k] = m))} size={0.06} map={dotTex()} color={0xcfe6dc} transparent opacity={0} depthWrite={false} />
        </points>
      ))}
      <points geometry={outerPlanRing}>
        <pointsMaterial ref={(m) => void (m && (planMats.current[12] = m))} size={0.09} map={dotTex()} color={0xd9b879} transparent opacity={0} depthWrite={false} />
      </points>
      <primitive object={stem} />
    </>
  );
}

/* ───────────── motion: orbit clock + view blend ───────────── */
function Motion() {
  useFrame((_, dt) => {
    const s = getState();
    if (!s.reducedMotion && !s.selected) anim.orbitT += dt;
    const target = s.viewMode === 'plan' ? 1 : 0;
    anim.blend = s.reducedMotion ? target : THREE.MathUtils.damp(anim.blend, target, 2.6, dt);
  });
  return null;
}

/** Camera: damped fly-to on view change and selection; free orbit/zoom otherwise. */
function Rig({ controls }: { controls: React.RefObject<OrbitControlsImpl | null> }) {
  const { camera, scene, size } = useThree();
  const selected = useUniverse((s) => s.selected);
  const mode = useUniverse((s) => s.viewMode);
  const flying = useRef(true);
  const pending = useRef(false);
  const goal = useMemo(() => ({ pos: ECO_CAM.pos.clone(), target: ECO_CAM.target.clone() }), []);
  const resolve = () => {
    const portrait = size.width < size.height;
    const k = portrait ? ECO_CAM.portraitScale : 1;
    const plan = mode === 'plan';
    if (!selected) {
      goal.pos.copy(plan ? PLAN_CAM.pos : ECO_CAM.pos).multiplyScalar(k);
      goal.target.copy(plan ? PLAN_CAM.target : ECO_CAM.target);
      return true;
    }
    const obj = scene.getObjectByName(`eco-${selected}`);
    if (!obj) return false;
    obj.updateWorldMatrix(true, false);
    const w = obj.getWorldPosition(new THREE.Vector3());
    if (selected !== 'fox' && w.lengthSq() < 1) return false;
    goal.target.copy(w);
    if (plan) goal.pos.copy(w).add(new THREE.Vector3(0, 14 * k, 0.01));
    else if (selected === 'fox') goal.pos.set(0, 1.2, 12 * k);
    else if (selected === 'omnisynapse') goal.pos.set(0, w.y - 0.5, 12 * k);
    else goal.pos.copy(w).add(new THREE.Vector3(w.x * 0.25, 0.8, 10 * k));
    // keep the subject clear of the info panel (right on desktop, bottom sheet on phones)
    const shift = portrait ? new THREE.Vector3(0, -2.2, 0) : new THREE.Vector3(plan ? 4 : 3, 0, 0);
    goal.pos.add(shift);
    goal.target.add(shift);
    return true;
  };
  useEffect(() => {
    pending.current = !resolve();
    flying.current = true;
    const c = controls.current;
    if (c) c.enableRotate = mode !== 'plan';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, mode, size]);
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const stop = () => (flying.current = false);
    c.addEventListener('start', stop);
    return () => c.removeEventListener('start', stop);
  }, [controls]);
  useFrame((_, dt) => {
    const c = controls.current;
    if (pending.current) pending.current = !resolve();
    if (!c || !flying.current || pending.current) return;
    const k = getState().reducedMotion ? 1 : 1 - Math.exp(-2.4 * dt);
    camera.position.lerp(goal.pos, k);
    c.target.lerp(goal.target, k);
    c.update();
    if (camera.position.distanceTo(goal.pos) < 0.03) flying.current = false;
  });
  return null;
}

function Scene() {
  const font = useLoader(FontLoader, '/fonts/michroma.typeface.json');
  return (
    <>
      <Field />
      <FoxCore />
      {SATELLITES.map((_, i) => (
        <Satellite key={i} index={i} />
      ))}
      {OUTER_SYMBOLS.map((_, i) => (
        <OuterOrb key={i} index={i} />
      ))}
      <OmniLogo font={font} />
      <OrbitLogo font={font} />
    </>
  );
}

export default function Ecosphere() {
  const lowPower = useUniverse((s) => s.lowPower);
  const controls = useRef<OrbitControlsImpl | null>(null);
  useEffect(() => {
    setState({ introDone: true, phase: getState().selected ? 'NODE_FOCUSED' : 'TEMPLE_IDLE' });
    anim.blend = getState().viewMode === 'plan' ? 1 : 0;
  }, []);
  return (
    <Canvas
      dpr={[1, lowPower ? 1 : 1.75]}
      gl={{ antialias: !lowPower, powerPreference: 'high-performance' }}
      camera={{ position: ECO_CAM.pos.toArray(), fov: 46, near: 0.1, far: 700 }}
      onPointerMissed={() => selectNode(null)}
      aria-label="OMNI ecosphere — 3D view. Use the navigation list for keyboard access."
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.setClearColor('#020605');
        scene.fog = new THREE.Fog(0x020605, 36, 120);
      }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 6, 8]} intensity={2.2} color={0xfff0d0} />
      <directionalLight position={[-6, -3, -4]} intensity={0.9} color={0x9fe8ff} />
      <pointLight position={[0, 15.5, 7]} intensity={70} distance={20} decay={1.6} color={0xfff1cf} />
      <pointLight position={[0, -9.5, 7]} intensity={45} distance={16} decay={1.6} color={0xbfefff} />
      <Motion />
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
      <OrbitControls ref={controls} makeDefault enablePan={false} enableDamping dampingFactor={0.08} minDistance={5} maxDistance={95} target={ECO_CAM.target} rotateSpeed={0.55} zoomSpeed={0.7} />
      <Rig controls={controls} />
      {!lowPower && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={0.8} luminanceThreshold={0.55} luminanceSmoothing={0.2} radius={0.7} />
          <Vignette eskil={false} offset={0.25} darkness={0.7} />
        </EffectComposer>
      )}
    </Canvas>
  );
}

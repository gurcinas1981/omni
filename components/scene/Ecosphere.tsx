'use client';
/**
 * OMNI Ecosphere — the live interface the opener lands on (ORBIT-style orbital system).
 * Ω at the centre of a wire mind-sphere, FOX beneath it, and every category orbiting as its
 * OMNI Symbol Library sign on three tilted lanes. Drag to rotate, scroll to zoom, click to focus.
 */
import { Suspense, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Html, OrbitControls, useTexture } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { OMEGA_PATH } from '@/lib/brand/omega';
import { foxShards, foxGoldMaterial } from '@/lib/brand/fox';
import { SYMBOL_ATLAS, SYMBOL_BY_ID } from '@/lib/registry/symbols';
import { LANES, LANE_BASES, SATELLITES, dottedCircle, fibonacciShell, lanePoint } from '@/lib/registry/ecosphere';
import { getState, hoverNode, selectNode, setState, useUniverse } from './store';

const HOME_POS = new THREE.Vector3(0, 2.6, 18.5);
const HOME_TARGET = new THREE.Vector3(0, 0.1, 0);

/** Shared orbital clock: advances only while nothing is selected, so a focused symbol stays put. */
const orbit = { t: 0 };

function canvasTex(draw: (g: CanvasRenderingContext2D, s: number) => void, size = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d')!, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const glowTex = (color: string) =>
  canvasTex((g, s) => {
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, color);
    gr.addColorStop(0.25, color);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, s, s);
  });
const dotTex = () =>
  canvasTex((g, s) => {
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, '#fff');
    gr.addColorStop(0.45, 'rgba(255,255,255,.7)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, s, s);
  }, 32);
/** Medallion backplate: dark glass disc + fine tick ring (tinted by sprite colour). */
const plateTex = () =>
  canvasTex((g, s) => {
    const c = s / 2;
    const bg = g.createRadialGradient(c, c, 0, c, c, c);
    bg.addColorStop(0, 'rgba(14,30,46,.92)');
    bg.addColorStop(0.78, 'rgba(4,10,16,.9)');
    bg.addColorStop(0.8, 'rgba(255,255,255,.9)');
    bg.addColorStop(0.83, 'rgba(255,255,255,.15)');
    bg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = bg;
    g.beginPath();
    g.arc(c, c, c, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,.55)';
    g.lineWidth = 2;
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      const r1 = c * 0.9;
      const r2 = c * (i % 4 === 0 ? 0.84 : 0.87);
      g.beginPath();
      g.moveTo(c + Math.cos(a) * r1, c + Math.sin(a) * r1);
      g.lineTo(c + Math.cos(a) * r2, c + Math.sin(a) * r2);
      g.stroke();
    }
  }, 256);

/* ───────────── Centre: Ω inside the mind-sphere, FOX beneath ───────────── */
function Core() {
  const omega = useRef<THREE.Mesh>(null);
  const mind = useRef<THREE.Group>(null);
  const fox = useRef<THREE.Group>(null);
  const hover = useRef({ o: 0, f: 0 });
  const omegaGeo = useMemo(() => {
    const shapes = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${OMEGA_PATH}"/></svg>`).paths.flatMap((p) => p.toShapes());
    const g = new THREE.ExtrudeGeometry(shapes, { depth: 10, bevelEnabled: true, bevelThickness: 2.5, bevelSize: 1.8, bevelSegments: 3, curveSegments: 48 });
    g.center();
    g.scale(0.03, -0.03, -0.03);
    return g;
  }, []);
  const omegaMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: 0xf0cf86, metalness: 0.78, roughness: 0.2, clearcoat: 0.9, emissive: 0xb07a22, emissiveIntensity: 0.8 }),
    [],
  );
  const foxMat = useMemo(foxGoldMaterial, []);
  const shards = useMemo(foxShards, []);
  const dot = useMemo(dotTex, []);
  const halo = useMemo(() => glowTex('rgba(255,214,140,.9)'), []);
  const wire = useMemo(() => new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(2.6, 3)), []);
  const nodes = useMemo(() => new THREE.IcosahedronGeometry(2.72, 4), []);

  useFrame(({ clock }, dt) => {
    const s = getState();
    const t = s.reducedMotion ? 0 : clock.elapsedTime;
    hover.current.o = THREE.MathUtils.damp(hover.current.o, s.hovered === 'omnisynapse' || s.selected === 'omnisynapse' ? 1 : 0, 6, dt);
    hover.current.f = THREE.MathUtils.damp(hover.current.f, s.hovered === 'fox' || s.selected === 'fox' ? 1 : 0, 6, dt);
    if (omega.current) {
      omega.current.rotation.y = Math.sin(t * 0.6) * 0.15;
      omega.current.scale.setScalar(1 + hover.current.o * 0.08);
      omegaMat.emissiveIntensity = 0.8 + Math.max(0, Math.sin(t * 1.6)) * 0.25 + hover.current.o * 0.6;
    }
    if (mind.current) {
      mind.current.rotation.y = t * 0.22;
      mind.current.rotation.x = t * 0.07;
    }
    if (fox.current) {
      fox.current.rotation.y = Math.sin(t * 0.7) * 0.35;
      fox.current.scale.setScalar(0.55 * (1 + hover.current.f * 0.12));
      foxMat.emissiveIntensity = 1.4 + hover.current.f * 1.6;
    }
  });

  const handlers = (id: string) => ({
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      hoverNode(id);
    },
    onPointerOut: () => hoverNode(null),
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      selectNode(id);
    },
  });

  return (
    <group position={[0, 0.3, 0]}>
      <group ref={mind}>
        <lineSegments geometry={wire}>
          <lineBasicMaterial color={0xd9b879} transparent opacity={0.32} />
        </lineSegments>
        <points geometry={nodes}>
          <pointsMaterial size={0.07} color={0x7fe6ff} map={dot} transparent opacity={0.7} depthWrite={false} blending={THREE.AdditiveBlending} />
        </points>
      </group>
      <sprite scale={10}>
        <spriteMaterial map={halo} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <pointLight color={0xffd690} intensity={1.6} decay={0} />
      <mesh ref={omega} geometry={omegaGeo} material={omegaMat} position={[0, 0, 0.3]} {...handlers('omnisynapse')} />
      {/* generous invisible hit sphere for the core */}
      <mesh {...handlers('omnisynapse')} scale={1.5}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
      <group ref={fox} position={[0, -2.15, 1.8]} scale={0.55}>
        {shards.map((g, i) => (
          <mesh key={i} geometry={g} material={foxMat} position={[i % 2 ? 0.06 : -0.06, 0, 0]} />
        ))}
        <mesh {...handlers('fox')}>
          <planeGeometry args={[2.4, 3]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
        </mesh>
      </group>
    </group>
  );
}

/* ───────────── Orbiting category symbols ───────────── */
function Satellites() {
  const atlas = useTexture(SYMBOL_ATLAS.src);
  const plate = useMemo(plateTex, []);
  const glow = useMemo(() => glowTex('rgba(255,255,255,.85)'), []);
  const items = useMemo(
    () =>
      SATELLITES.map((s) => {
        const sym = SYMBOL_BY_ID[s.node.symbol];
        const tex = atlas.clone();
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.repeat.set(1 / SYMBOL_ATLAS.cols, 1 / SYMBOL_ATLAS.rows);
        tex.offset.set(sym.col / SYMBOL_ATLAS.cols, 1 - (sym.row + 1) / SYMBOL_ATLAS.rows);
        tex.needsUpdate = true;
        return { ...s, tex, sym };
      }),
    [atlas],
  );
  const groups = useRef<(THREE.Group | null)[]>([]);
  const labels = useRef<(HTMLButtonElement | null)[]>([]);
  const glows = useRef<(THREE.Sprite | null)[]>([]);
  const amt = useRef<number[]>(SATELLITES.map(() => 0));
  const p = useMemo(() => new THREE.Vector3(), []);
  const w = useMemo(() => new THREE.Vector3(), []);
  const camDir = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera }, dt) => {
    const s = getState();
    items.forEach((it, i) => {
      const g = groups.current[i];
      if (!g) return;
      lanePoint(it.lane, it.phase + orbit.t * LANES[it.lane].speed, p);
      g.position.copy(p);
      const on = s.hovered === it.node.id || s.selected === it.node.id ? 1 : 0;
      amt.current[i] = THREE.MathUtils.damp(amt.current[i], on, 6, dt);
      const a = amt.current[i];
      g.getWorldPosition(w);
      // depth relative to the camera: 0 far side, 1 near side
      camDir.copy(camera.position).normalize();
      const depth = THREE.MathUtils.clamp(0.5 + w.dot(camDir) / (LANES[it.lane].r * 2), 0, 1);
      g.scale.setScalar((0.8 + depth * 0.35) * (1 + a * 0.35));
      const gl = glows.current[i];
      if (gl) (gl.material as THREE.SpriteMaterial).opacity = 0.18 + a * 0.6;
      const lb = labels.current[i];
      if (lb) {
        lb.style.opacity = String(Math.max(a, THREE.MathUtils.smoothstep(depth, 0.35, 0.7)));
        lb.classList.toggle('on', a > 0.5);
      }
    });
  });

  return (
    <>
      {items.map((it, i) => {
        const tint = LANES[it.lane].css;
        const handlers = {
          onPointerOver: (e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation();
            hoverNode(it.node.id);
          },
          onPointerOut: () => hoverNode(null),
          onClick: (e: ThreeEvent<MouseEvent>) => {
            e.stopPropagation();
            selectNode(it.node.id);
          },
        };
        return (
          <group key={it.node.id} name={`eco-${it.node.id}`} ref={(el) => void (groups.current[i] = el)}>
            <sprite ref={(el) => void (glows.current[i] = el)} scale={2.6}>
              <spriteMaterial map={glow} color={tint} transparent opacity={0.2} depthWrite={false} blending={THREE.AdditiveBlending} />
            </sprite>
            <sprite scale={1.55} {...handlers}>
              <spriteMaterial map={plate} color={tint} transparent depthWrite={false} />
            </sprite>
            <sprite scale={1.05} renderOrder={2}>
              <spriteMaterial map={it.tex} color={tint} transparent depthWrite={false} toneMapped={false} />
            </sprite>
            <Html position={[0, -1.05, 0]} center zIndexRange={[3, 0]}>
              <button
                ref={(el) => void (labels.current[i] = el)}
                className="plabel"
                style={{ ['--c' as string]: tint }}
                onClick={() => selectNode(it.node.id)}
                onPointerEnter={() => hoverNode(it.node.id)}
                onPointerLeave={() => hoverNode(null)}
              >
                <b>{it.node.label}</b>
                <small>{it.sym.name}</small>
              </button>
            </Html>
          </group>
        );
      })}
    </>
  );
}

/* ───────────── Lanes, shell, stars, pulse rings ───────────── */
function Field() {
  const dot = useMemo(dotTex, []);
  const shell = useMemo(() => fibonacciShell(2600, 11), []);
  const lanes = useMemo(() => LANES.map((L, k) => dottedCircle(L.r, 260, LANE_BASES[k].u, LANE_BASES[k].v)), []);
  const stars = useMemo(() => {
    const n = 2200;
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = Math.random() * 2 - 1;
      const th = Math.random() * Math.PI * 2;
      const r = 60 + Math.random() * 120;
      const s = Math.sqrt(1 - u * u);
      a.set([r * s * Math.cos(th), r * u, r * s * Math.sin(th)], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(a, 3));
    return g;
  }, []);
  const rings = useRef<THREE.Mesh[]>([]);
  const starRef = useRef<THREE.Points>(null);
  useFrame(({ clock }) => {
    const rm = getState().reducedMotion;
    const t = clock.elapsedTime;
    if (starRef.current && !rm) starRef.current.rotation.y = t * 0.004;
    rings.current.forEach((r, i) => {
      if (!r) return;
      const k = rm ? 0 : ((t * 0.12 + i / 3) % 1);
      r.scale.setScalar(1 + k * 1.6);
      (r.material as THREE.MeshBasicMaterial).opacity = rm ? 0 : Math.sin(k * Math.PI) * 0.16;
    });
  });
  return (
    <>
      <points ref={starRef} geometry={stars}>
        <pointsMaterial size={0.5} map={dot} color={0xcfe9dc} transparent opacity={0.75} depthWrite={false} sizeAttenuation fog={false} />
      </points>
      <points geometry={shell}>
        <pointsMaterial size={0.06} map={dot} color={0x6ad6b2} transparent opacity={0.3} depthWrite={false} />
      </points>
      {lanes.map((g, k) => (
        <points key={k} geometry={g}>
          <pointsMaterial size={0.07} map={dot} color={k === 1 ? 0x6ad6b2 : k === 0 ? 0xd9b879 : 0xb79cff} transparent opacity={0.75} depthWrite={false} />
        </points>
      ))}
      {[0xd9b879, 0x6ad6b2, 0x9c6bff].map((c, i) => (
        <mesh key={i} ref={(el) => void (el && (rings.current[i] = el))} rotation={[Math.PI / 2 + (i - 1) * 0.35, 0, 0]} position={[0, 0.3, 0]}>
          <torusGeometry args={[3, 0.006, 6, 200]} />
          <meshBasicMaterial color={c} transparent opacity={0} toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}

/** Rotates the whole ecosphere; pauses while a node is focused so the camera can hold it. */
function Spin({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const { size } = useThree();
  useFrame((_, dt) => {
    const s = getState();
    const running = !s.reducedMotion && !s.selected;
    if (running) orbit.t += dt;
    if (ref.current) {
      if (running) ref.current.rotation.y += dt * 0.06;
      ref.current.scale.setScalar(size.width < size.height ? 0.72 : 1);
    }
  });
  return (
    <group ref={ref} rotation={[0.22, 0, 0]}>
      {children}
    </group>
  );
}

/** Damped fly-to on selection; free orbit/zoom otherwise. */
function Rig({ controls }: { controls: React.RefObject<OrbitControlsImpl | null> }) {
  const { camera, scene, size } = useThree();
  const selected = useUniverse((s) => s.selected);
  const flying = useRef(false);
  const goal = useMemo(() => ({ pos: HOME_POS.clone(), target: HOME_TARGET.clone() }), []);
  const pending = useRef(false);
  const resolve = () => {
    const portrait = size.width < size.height;
    if (!selected) {
      goal.pos.copy(HOME_POS).multiplyScalar(portrait ? 1.45 : 1);
      goal.target.copy(HOME_TARGET);
      return true;
    }
    const w = new THREE.Vector3();
    if (selected === 'omnisynapse') w.set(0, 0.3, 0);
    else if (selected === 'fox') w.set(0, -1.85, 1.8);
    else {
      const obj = scene.getObjectByName(`eco-${selected}`);
      if (!obj) return false; // satellites not mounted yet (deep link) — retry next frame
      obj.updateWorldMatrix(true, false);
      obj.getWorldPosition(w);
      if (w.lengthSq() < 1) return false; // not yet placed on its lane — retry next frame
    }
    const dist = (selected === 'omnisynapse' ? 10.5 : selected === 'fox' ? 7 : 7) * (portrait ? 1.4 : 1);
    goal.target.copy(w);
    if (selected === 'omnisynapse' || selected === 'fox') goal.pos.set(0, w.y + 1.2, dist);
    else goal.pos.copy(w).addScaledVector(w.clone().normalize(), dist).add(new THREE.Vector3(0, 0.9, 0));
    return true;
  };
  useEffect(() => {
    pending.current = !resolve();
    flying.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, scene, size]);
  useFrame((_, dt) => {
    const c = controls.current;
    if (pending.current) pending.current = !resolve();
    if (!c || !flying.current || pending.current) return;
    const k = getState().reducedMotion ? 30 : 2.4;
    camera.position.lerp(goal.pos, 1 - Math.exp(-k * dt));
    c.target.lerp(goal.target, 1 - Math.exp(-k * dt));
    c.update();
    if (camera.position.distanceTo(goal.pos) < 0.02) flying.current = false;
  });
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const stop = () => (flying.current = false);
    c.addEventListener('start', stop);
    return () => c.removeEventListener('start', stop);
  }, [controls]);
  return null;
}

export default function Ecosphere() {
  const lowPower = useUniverse((s) => s.lowPower);
  const controls = useRef<OrbitControlsImpl | null>(null);
  useEffect(() => {
    // the opener already delivered the reveal; the ecosphere starts awake
    setState({ introDone: true, phase: getState().selected ? 'NODE_FOCUSED' : 'TEMPLE_IDLE' });
  }, []);
  return (
    <Canvas
      dpr={[1, lowPower ? 1 : 1.75]}
      gl={{ antialias: !lowPower, powerPreference: 'high-performance' }}
      camera={{ position: HOME_POS.toArray(), fov: 50, near: 0.1, far: 600 }}
      onPointerMissed={() => selectNode(null)}
      aria-label="OMNI ecosphere — 3D view. Use the navigation list for keyboard access."
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.setClearColor('#020605');
        scene.fog = new THREE.Fog(0x020605, 16, 60);
      }}
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 4, 6]} intensity={2.2} color={0xfff0d0} />
      <directionalLight position={[-5, -2, -4]} intensity={0.9} color={0x9fe8ff} />
      <pointLight position={[0, 1.5, 5]} intensity={40} distance={12} decay={1.6} color={0xfff1cf} />
      <Suspense fallback={null}>
        <Field />
        <Spin>
          <SatellitesNamed />
        </Spin>
        <Core />
      </Suspense>
      <OrbitControls ref={controls} makeDefault enablePan={false} enableDamping dampingFactor={0.08} minDistance={4} maxDistance={30} target={HOME_TARGET} rotateSpeed={0.6} zoomSpeed={0.7} />
      <Rig controls={controls} />
      {!lowPower && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={0.75} luminanceThreshold={0.6} luminanceSmoothing={0.2} radius={0.7} />
          <Vignette eskil={false} offset={0.25} darkness={0.7} />
        </EffectComposer>
      )}
    </Canvas>
  );
}

/** Satellites wrapped in a named group so the camera rig can locate them. */
function SatellitesNamed() {
  return (
    <group name="eco-spin">
      <Satellites />
    </group>
  );
}

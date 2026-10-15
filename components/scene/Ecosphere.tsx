'use client';
/**
 * OMNI Ecosphere — FOX Intelligence orbital language, OMNI edition.
 *   centre   Ω inside a gold wire globe (OMNISYNAPSE supervisory core)
 *   globes   each category is a textured globe carrying its OMNI symbol, on its own orbital plane
 *   moons    ideas assigned to a sphere orbit it: hollow = pending, solid gold = confirmed by the owner
 *   flyers   the remaining OMNI Symbol Library flies through the spherical environment
 *   glyphs   hieroglyph / matrix / symbol particles drift through space; a swarm surrounds the focused globe
 * Select a globe → it flies to the centre and keeps spinning; the Ω retreats behind it.
 * Two layouts — ECOSPHERE (3D) and PLAN (top-down) — blend smoothly.
 */
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Html, OrbitControls, useTexture } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { OMEGA_PATH } from '@/lib/brand/omega';
import { SYMBOL_ATLAS, SYMBOL_BY_ID, type OmniSymbol } from '@/lib/registry/symbols';
import {
  CORE_RETREAT,
  ECO_CAM,
  FLYERS,
  FOCUS_SCALE,
  HANDOFF_ORBIT_T,
  LANES,
  PLAN_CAM,
  SATELLITES,
  circlePoints,
  fibonacciShell,
  orbitLine,
  orbitPoint,
  planPoint,
} from '@/lib/registry/ecosphere';
import { useIdeas, type Idea } from '@/lib/ideas';
import { getState, hoverNode, selectNode, setState, useUniverse } from './store';

/** Shared animation state (no React re-renders). */
const anim = { orbitT: HANDOFF_ORBIT_T, blend: 0, focus: 0 };

/* ───────────── texture helpers ───────────── */
function canvas(w: number, h = w) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { c, g: c.getContext('2d')! };
}
function tex(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
let _dot: THREE.Texture | null = null;
function dotTex() {
  if (_dot) return _dot;
  const { c, g } = canvas(64);
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, '#fff');
  gr.addColorStop(0.45, 'rgba(255,255,255,.7)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return (_dot = tex(c));
}
let _glow: THREE.Texture | null = null;
function glowTex() {
  if (_glow) return _glow;
  const { c, g } = canvas(128);
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,.9)');
  gr.addColorStop(0.25, 'rgba(255,255,255,.4)');
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  return (_glow = tex(c));
}
/** Theme palettes — Dark (navy) and Light (silver). Light inverts luminous elements into ink tones. */
export const PALETTES = {
  dark: {
    sky: ['#020817', '#0c2148'] as const,
    clear: '#030a1d',
    lanes: ['#f4dea6', '#8fe9ff', '#d9c3ff'] as const,
    line: '#a9bfe0',
    lineOp: 0.2,
    glyph: ['#ffffff', '#d5dce6', '#b9c4d3'] as const,
    glyphOp: 0.26,
    swarmOp: 0.55,
    dot: '#cfdcf0',
    flyer: '#d3dae4',
    core: { wire: 0xd9b879, node: '#f4dea6', glow: '#ffd28a' },
    additive: true,
    bloom: true,
  },
  light: {
    sky: ['#c4ccd8', '#f7f8fa'] as const,
    clear: '#e3e7ed',
    lanes: ['#8a6420', '#14687f', '#5b3c9c'] as const,
    line: '#3b4960',
    lineOp: 0.26,
    glyph: ['#2a3343', '#4b5668', '#6a7586'] as const,
    glyphOp: 0.22,
    swarmOp: 0.5,
    dot: '#34425a',
    flyer: '#4c586b',
    core: { wire: 0x9a7432, node: '#8a6420', glow: '#e8c98a' },
    additive: false,
    bloom: false,
  },
};
export type Palette = (typeof PALETTES)['dark'] | (typeof PALETTES)['light'];
const blendFor = (P: Palette) => (P.additive ? THREE.AdditiveBlending : THREE.NormalBlending);

/** A texture window onto one cell of the symbol atlas. */
function symbolTex(atlas: THREE.Texture, sym: OmniSymbol) {
  const t = atlas.clone();
  t.colorSpace = THREE.SRGBColorSpace;
  t.repeat.set(1 / SYMBOL_ATLAS.cols, 1 / SYMBOL_ATLAS.rows);
  t.offset.set(sym.col / SYMBOL_ATLAS.cols, 1 - (sym.row + 1) / SYMBOL_ATLAS.rows);
  t.needsUpdate = true;
  return t;
}

/* ───────────── background: deep navy space ───────────── */
function Sky({ P }: { P: Palette }) {
  const uniforms = useMemo(() => ({ uDeep: { value: new THREE.Color(P.sky[0]) }, uNavy: { value: new THREE.Color(P.sky[1]) } }), [P]);
  return (
    <mesh scale={240}>
      <sphereGeometry args={[1, 48, 24]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={/* glsl */ `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} `}
        fragmentShader={/* glsl */ `varying vec3 vP; uniform vec3 uDeep; uniform vec3 uNavy;
          void main(){
            float glow = pow(max(0.0, 1.0 - length(vP.xy - vec2(0.0,0.05))), 2.4);
            vec3 c = mix(uDeep, uNavy, clamp(glow*0.95 + 0.12*(1.0-abs(vP.y)), 0.0, 1.0));
            gl_FragColor = vec4(c,1.0);
          }`}
      />
    </mesh>
  );
}

/* ───────────── glyph atlas + instanced glyph cloud (ambient drift & focus swarm) ───────────── */
const GLYPH_GRID = 8; // 8×8 cells: 0–31 library symbols, 32–63 matrix digits & hieroglyph strokes
function useGlyphAtlas() {
  const atlas = useTexture(SYMBOL_ATLAS.src);
  return useMemo(() => {
    const S = 1024;
    const cell = S / GLYPH_GRID;
    const { c, g } = canvas(S);
    const img = atlas.image as HTMLImageElement;
    const src = img.width / SYMBOL_ATLAS.cols;
    for (let i = 0; i < 32; i++) {
      const col = i % 8;
      const row = Math.floor(i / 8);
      g.drawImage(img, col * src, row * src, src, src, col * cell + 8, row * cell + 8, cell - 16, cell - 16);
    }
    g.fillStyle = '#fff';
    g.strokeStyle = '#fff';
    g.lineCap = 'round';
    g.lineJoin = 'round';
    const at = (i: number) => [((i % 8) + 0.5) * cell, (Math.floor(i / 8) + 0.5) * cell] as const;
    // matrix digits
    const digits = ['0', '1', '01', '10', '1', '0', '011', '110', '0', '1', '∴', '⌖'];
    digits.forEach((d, k) => {
      const [x, y] = at(32 + k);
      g.font = `${d.length > 2 ? 34 : d.length > 1 ? 46 : 70}px "Space Mono", ui-monospace, monospace`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(d, x, y);
    });
    // hieroglyph-style strokes (abstract, non-linguistic)
    const strokes: ((x: number, y: number) => void)[] = [
      (x, y) => { g.beginPath(); g.arc(x, y - 14, 14, 0, Math.PI * 2); g.moveTo(x, y); g.lineTo(x, y + 34); g.moveTo(x - 22, y + 8); g.lineTo(x + 22, y + 8); g.stroke(); },
      (x, y) => { g.beginPath(); g.moveTo(x - 32, y); g.quadraticCurveTo(x, y - 30, x + 32, y); g.quadraticCurveTo(x, y + 26, x - 32, y); g.stroke(); g.beginPath(); g.arc(x, y, 8, 0, Math.PI * 2); g.fill(); },
      (x, y) => { g.beginPath(); g.moveTo(x - 30, y + 26); g.lineTo(x, y - 30); g.lineTo(x + 30, y + 26); g.closePath(); g.stroke(); },
      (x, y) => { g.beginPath(); for (let k = 0; k < 4; k++) { g.moveTo(x - 30, y - 24 + k * 16); g.quadraticCurveTo(x - 15, y - 34 + k * 16, x, y - 24 + k * 16); g.quadraticCurveTo(x + 15, y - 14 + k * 16, x + 30, y - 24 + k * 16); } g.stroke(); },
      (x, y) => { g.strokeRect(x - 22, y - 28, 44, 56); g.beginPath(); g.moveTo(x - 22, y); g.lineTo(x + 22, y); g.stroke(); },
      (x, y) => { g.beginPath(); g.moveTo(x - 28, y - 28); g.lineTo(x + 28, y + 28); g.moveTo(x + 28, y - 28); g.lineTo(x - 28, y + 28); g.stroke(); g.beginPath(); g.arc(x, y, 30, 0, Math.PI * 2); g.stroke(); },
      (x, y) => { g.beginPath(); g.moveTo(x - 30, y + 20); g.lineTo(x - 10, y - 20); g.lineTo(x + 10, y + 20); g.lineTo(x + 30, y - 20); g.stroke(); },
      (x, y) => { g.beginPath(); g.moveTo(x, y - 32); g.lineTo(x, y + 32); g.moveTo(x - 16, y - 20); g.lineTo(x + 16, y - 20); g.moveTo(x - 24, y + 6); g.lineTo(x + 24, y + 6); g.stroke(); },
      (x, y) => { g.beginPath(); g.ellipse(x, y, 30, 14, 0, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(x - 10, y + 14); g.lineTo(x - 18, y + 34); g.moveTo(x + 10, y + 14); g.lineTo(x + 18, y + 34); g.stroke(); },
      (x, y) => { g.beginPath(); g.arc(x, y, 26, Math.PI, 0); g.lineTo(x + 26, y + 26); g.moveTo(x - 26, y); g.lineTo(x - 26, y + 26); g.stroke(); },
      (x, y) => { for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(x, y, 10 + k * 10, 0, Math.PI * 2); g.stroke(); } },
      (x, y) => { g.beginPath(); g.moveTo(x - 30, y); g.lineTo(x + 30, y); g.moveTo(x - 20, y - 20); g.lineTo(x - 20, y + 20); g.moveTo(x + 20, y - 20); g.lineTo(x + 20, y + 20); g.stroke(); },
      (x, y) => { g.beginPath(); g.moveTo(x, y - 30); g.lineTo(x + 28, y); g.lineTo(x, y + 30); g.lineTo(x - 28, y); g.closePath(); g.stroke(); g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.fill(); },
      (x, y) => { g.beginPath(); g.moveTo(x - 26, y - 26); g.lineTo(x + 26, y - 26); g.lineTo(x - 26, y + 26); g.lineTo(x + 26, y + 26); g.stroke(); },
      (x, y) => { g.beginPath(); g.arc(x - 12, y, 14, 0, Math.PI * 2); g.arc(x + 16, y, 14, 0, Math.PI * 2); g.stroke(); },
      (x, y) => { g.beginPath(); g.moveTo(x - 30, y + 30); g.lineTo(x - 30, y - 10); g.lineTo(x, y - 30); g.lineTo(x + 30, y - 10); g.lineTo(x + 30, y + 30); g.stroke(); },
    ];
    g.lineWidth = 6;
    strokes.forEach((fn, k) => {
      const [x, y] = at(44 + k);
      fn(x, y);
    });
    const t = tex(c);
    t.colorSpace = THREE.NoColorSpace;
    return t;
  }, [atlas]);
}

interface GlyphCloudProps {
  count: number;
  rMin: number;
  rMax: number;
  speed: [number, number];
  size: [number, number];
  /** 'ambient' drifts around the world origin; 'swarm' orbits the focus point and fades with focus. */
  mode: 'ambient' | 'swarm';
  P: Palette;
}
function GlyphCloud({ count, rMin, rMax, speed, size, mode, P }: GlyphCloudProps) {
  const atlas = useGlyphAtlas();
  const mat = useRef<THREE.ShaderMaterial>(null);
  const geo = useMemo(() => {
    const base = new THREE.PlaneGeometry(1, 1);
    const g = new THREE.InstancedBufferGeometry();
    g.index = base.index;
    g.setAttribute('position', base.getAttribute('position'));
    g.setAttribute('uv', base.getAttribute('uv'));
    const orbit = new Float32Array(count * 4); // r, incl, node, speed
    const misc = new Float32Array(count * 4); // cell, phase, size, seed
    const tint = new Float32Array(count * 3);
    const palette = P.glyph.map((c) => new THREE.Color(c));
    for (let i = 0; i < count; i++) {
      const glyphHeavy = Math.random() < 0.62;
      const cell = glyphHeavy ? 32 + Math.floor(Math.random() * 28) : Math.floor(Math.random() * 32);
      orbit.set([rMin + Math.random() * (rMax - rMin), (Math.random() * 2 - 1) * 1.5, Math.random() * Math.PI * 2, (Math.random() > 0.5 ? 1 : -1) * (speed[0] + Math.random() * (speed[1] - speed[0]))], i * 4);
      misc.set([cell, Math.random() * Math.PI * 2, size[0] + Math.random() * (size[1] - size[0]), Math.random()], i * 4);
      const c = palette[Math.floor(Math.random() * palette.length)];
      tint.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('aOrbit', new THREE.InstancedBufferAttribute(orbit, 4));
    g.setAttribute('aMisc', new THREE.InstancedBufferAttribute(misc, 4));
    g.setAttribute('aTint', new THREE.InstancedBufferAttribute(tint, 3));
    g.instanceCount = count;
    return g;
  }, [count, rMin, rMax, speed, size, P]);
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uAtlas: { value: atlas }, uCenter: { value: new THREE.Vector3() }, uOpacity: { value: mode === 'ambient' ? P.glyphOp : 0 }, uGrid: { value: GLYPH_GRID } }),
    [atlas, mode, P],
  );
  useFrame(({ clock }) => {
    const u = mat.current?.uniforms;
    if (!u) return;
    u.uTime.value = getState().reducedMotion ? 0 : clock.elapsedTime;
    if (mode === 'swarm') u.uOpacity.value = anim.focus * P.swarmOp;
  });
  return (
    <mesh geometry={geo} frustumCulled={false} renderOrder={mode === 'swarm' ? 5 : -1}>
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={blendFor(P)}
        vertexShader={/* glsl */ `
          attribute vec4 aOrbit; attribute vec4 aMisc; attribute vec3 aTint;
          uniform float uTime; uniform vec3 uCenter; uniform float uGrid;
          varying vec2 vUv; varying vec3 vTint; varying float vTw; varying float vCell;
          void main(){
            float r = aOrbit.x; float incl = aOrbit.y; float node = aOrbit.z; float spd = aOrbit.w;
            float ang = aMisc.y + uTime * spd;
            vec3 u = vec3(cos(node), 0.0, sin(node));
            vec3 v = vec3(-sin(node)*cos(incl), sin(incl), cos(node)*cos(incl));
            vec3 p = uCenter + (u*cos(ang) + v*sin(ang)) * r;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            mv.xy += position.xy * aMisc.z;
            gl_Position = projectionMatrix * mv;
            vUv = uv; vTint = aTint; vCell = aMisc.x;
            vTw = 0.45 + 0.55 * pow(0.5 + 0.5*sin(uTime*(0.6 + aMisc.w*2.0) + aMisc.w*40.0), 2.0);
          }`}
        fragmentShader={/* glsl */ `
          uniform sampler2D uAtlas; uniform float uOpacity; uniform float uGrid;
          varying vec2 vUv; varying vec3 vTint; varying float vTw; varying float vCell;
          void main(){
            float col = mod(vCell, uGrid); float row = floor(vCell / uGrid);
            vec2 uv = vec2((col + vUv.x) / uGrid, 1.0 - (row + 1.0 - vUv.y) / uGrid);
            float a = texture2D(uAtlas, uv).a;
            if (a < 0.02) discard;
            gl_FragColor = vec4(vTint, a * vTw * uOpacity);
          }`}
      />
    </mesh>
  );
}

/* ───────────── focus helper: where each object should be ───────────── */
function useFocusLerp() {
  const cur = useRef<THREE.Vector3 | null>(null);
  return (target: THREE.Vector3, dt: number, k = 3) => {
    if (!cur.current) cur.current = target.clone();
    else cur.current.lerp(target, 1 - Math.exp(-k * dt));
    return cur.current;
  };
}

/* ───────────── centre: Ω inside the gold wire globe ───────────── */
function OmegaCore({ P }: { P: Palette }) {
  const root = useRef<THREE.Group>(null);
  const omega = useRef<THREE.Mesh>(null);
  const wire = useRef<THREE.Group>(null);
  const waves = useRef<THREE.Mesh[]>([]);
  const hot = useRef(0);
  const scale = useRef(1);
  const lerp = useFocusLerp();
  const omegaGeo = useMemo(() => {
    const shapes = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${OMEGA_PATH}"/></svg>`).paths.flatMap((p) => p.toShapes());
    const g = new THREE.ExtrudeGeometry(shapes, { depth: 12, bevelEnabled: true, bevelThickness: 3, bevelSize: 2, bevelSegments: 3, curveSegments: 48 });
    g.center();
    g.scale(0.026, -0.026, -0.026);
    return g;
  }, []);
  const omegaMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: 0xf0cf86, metalness: 0.8, roughness: 0.2, clearcoat: 0.9, emissive: 0xb07a22, emissiveIntensity: 0.7 }),
    [],
  );
  const wireGeo = useMemo(() => new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(2.1, 3)), []);
  const nodes = useMemo(() => new THREE.IcosahedronGeometry(2.18, 4), []);
  const home = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock }, dt) => {
    const s = getState();
    const t = s.reducedMotion ? 0 : clock.elapsedTime;
    hot.current = THREE.MathUtils.damp(hot.current, s.hovered === 'omnisynapse' || s.selected === 'omnisynapse' ? 1 : 0, 6, dt);
    const away = !!s.selected && s.selected !== 'omnisynapse';
    const p = lerp(away ? CORE_RETREAT : home, dt, 2.4);
    scale.current = THREE.MathUtils.damp(scale.current, away ? 0.55 : s.selected === 'omnisynapse' ? 1.35 : 1, 2.4, dt);
    if (root.current) {
      root.current.position.copy(p);
      root.current.scale.setScalar(scale.current);
    }
    if (omega.current) {
      omega.current.rotation.y = Math.sin(t * 0.6) * 0.5;
      omega.current.scale.setScalar(1 + hot.current * 0.06);
    }
    omegaMat.emissiveIntensity = 0.7 + Math.max(0, Math.sin(t * 1.5)) * 0.35 + hot.current * 0.6;
    if (wire.current) {
      wire.current.rotation.y = t * 0.18;
      wire.current.rotation.x = t * 0.05;
    }
    waves.current.forEach((w, i) => {
      if (!w) return;
      const k = s.reducedMotion ? 0 : (t * 0.2 + i / 3) % 1;
      w.scale.setScalar(1 + k * 2.4);
      (w.material as THREE.MeshBasicMaterial).opacity = Math.sin(k * Math.PI) * 0.2;
    });
  });
  const handlers = {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      hoverNode('omnisynapse');
    },
    onPointerOut: () => hoverNode(null),
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      selectNode('omnisynapse');
    },
  };
  return (
    <group ref={root} name="eco-omnisynapse">
      <group ref={wire}>
        <lineSegments geometry={wireGeo}>
          <lineBasicMaterial color={P.core.wire} transparent opacity={P.additive ? 0.36 : 0.5} />
        </lineSegments>
        <points geometry={nodes}>
          <pointsMaterial size={0.09} color={P.core.node} map={dotTex()} transparent opacity={0.8} depthWrite={false} />
        </points>
      </group>
      <sprite scale={8.5}>
        <spriteMaterial map={glowTex()} color={P.core.glow} transparent opacity={P.additive ? 0.4 : 0.55} depthWrite={false} blending={blendFor(P)} />
      </sprite>
      <pointLight color={0xffd690} intensity={3} decay={0} />
      <mesh ref={omega} geometry={omegaGeo} material={omegaMat} />
      {[0xd9b879, 0x6ad6b2, 0x9c6bff].map((c, i) => (
        <mesh key={i} ref={(el) => void (el && (waves.current[i] = el))} rotation={[Math.PI / 2 + (i - 1) * 0.35, 0, 0]}>
          <torusGeometry args={[2.3, 0.008, 6, 200]} />
          <meshBasicMaterial color={c} transparent opacity={0} toneMapped={false} />
        </mesh>
      ))}
      <mesh scale={2.2} {...handlers}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
      <Html position={[0, -2.7, 0]} center zIndexRange={[3, 0]}>
        <button className="plabel core" style={{ ['--c' as string]: P.lanes[0] }} onClick={() => selectNode('omnisynapse')}>
          <b>OMNISYNAPSE</b>
          <small>Supervisory core</small>
        </button>
      </Html>
    </group>
  );
}

/* ───────────── idea moons around a globe ───────────── */
function Moons({ ideas }: { ideas: Idea[] }) {
  const group = useRef<THREE.Group>(null);
  const shown = ideas.slice(0, 18);
  useFrame(({ clock }) => {
    const t = getState().reducedMotion ? 0 : clock.elapsedTime;
    group.current?.children.forEach((m, i) => {
      const r = 1.32 + (i % 3) * 0.24;
      const incl = (i * 0.9) % Math.PI;
      const a = t * (0.9 - (i % 5) * 0.08) + i * 1.7;
      m.position.set(Math.cos(a) * r, Math.sin(a) * r * Math.sin(incl), Math.sin(a) * r * Math.cos(incl));
      const idea = shown[i];
      if (idea?.state === 'pending') m.scale.setScalar(0.9 + Math.sin(t * 3 + i) * 0.15);
    });
  });
  return (
    <group ref={group}>
      {shown.map((idea) =>
        idea.state === 'confirmed' ? (
          <group key={idea.id}>
            <mesh>
              <sphereGeometry args={[0.1, 20, 14]} />
              <meshStandardMaterial color={'#f2cf7e'} emissive={'#c8902e'} emissiveIntensity={1.2} metalness={0.6} roughness={0.3} transparent opacity={idea.demo ? 0.55 : 1} />
            </mesh>
            <sprite scale={0.55}>
              <spriteMaterial map={glowTex()} color={'#ffd28a'} transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
            </sprite>
          </group>
        ) : (
          <group key={idea.id}>
            <mesh>
              <torusGeometry args={[0.1, 0.022, 8, 28]} />
              <meshBasicMaterial color={'#8fe9ff'} transparent opacity={idea.demo ? 0.5 : 0.9} toneMapped={false} />
            </mesh>
          </group>
        ),
      )}
    </group>
  );
}

/* ───────────── category sphere: transparent dotted globe, symbol inside, dashed spoke to the Ω ───────────── */
function Globe({ index, ideas, P }: { index: number; ideas: Idea[]; P: Palette }) {
  const sat = SATELLITES[index];
  const { node, lane, orbit, phase, ringed } = sat;
  const col = P.lanes[lane];
  const sym = SYMBOL_BY_ID[node.symbol];
  const atlas = useTexture(SYMBOL_ATLAS.src);
  const symTex = useMemo(() => symbolTex(atlas, sym), [atlas, sym]);
  const shellGeo = useMemo(() => fibonacciShell(420, 0.78), []);
  const root = useRef<THREE.Group>(null);
  const shell = useRef<THREE.Points>(null);
  const symRef = useRef<THREE.Sprite>(null);
  const label = useRef<HTMLButtonElement>(null);
  const mats = useRef<THREE.Material[]>([]);
  const hot = useRef(0);
  const scale = useRef(1);
  const dim = useRef(1);
  const lerp = useFocusLerp();
  const ring = useMemo(() => {
    const pts = new THREE.Points(orbitLine(orbit, 320), new THREE.PointsMaterial({ size: 0.045, map: dotTex(), color: P.line, transparent: true, opacity: P.lineOp, depthWrite: false }));
    pts.frustumCulled = false;
    return pts;
  }, [orbit, P]);
  const spoke = useMemo(() => {
    const g = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    const l = new THREE.Line(g, new THREE.LineDashedMaterial({ color: col, dashSize: 0.22, gapSize: 0.2, transparent: true, opacity: 0.35, depthWrite: false }));
    l.frustumCulled = false;
    return l;
  }, [col]);
  const e = useMemo(() => new THREE.Vector3(), []);
  const p = useMemo(() => new THREE.Vector3(), []);
  const camN = useMemo(() => new THREE.Vector3(), []);
  const origin = useMemo(() => new THREE.Vector3(), []);
  const pendingCount = ideas.filter((i) => i.state === 'pending').length;
  const confirmedCount = ideas.filter((i) => i.state === 'confirmed').length;

  useFrame(({ camera, clock }, dt) => {
    const s = getState();
    const selected = s.selected === node.id;
    const other = !!s.selected && !selected;
    const t = s.reducedMotion ? 0 : clock.elapsedTime;
    const ang = phase + anim.orbitT * orbit.speed;
    orbitPoint(orbit, ang, e);
    planPoint(orbit, ang, p);
    e.lerp(p, anim.blend);
    // while another sphere holds the centre, the rest widen their orbits so nothing crosses the subject
    if (other) e.multiplyScalar(1.7);
    const pos = lerp(selected ? origin : e, dt, 2.6);
    root.current?.position.copy(pos);
    scale.current = THREE.MathUtils.damp(scale.current, selected ? FOCUS_SCALE : other ? 0.7 : 1, 2.6, dt);
    hot.current = THREE.MathUtils.damp(hot.current, s.hovered === node.id || selected ? 1 : 0, 6, dt);
    dim.current = THREE.MathUtils.damp(dim.current, other ? 0.3 : 1, 3, dt);
    root.current?.scale.setScalar(scale.current * (1 + hot.current * 0.1));
    if (shell.current && !s.reducedMotion) {
      shell.current.rotation.y += dt * (selected ? 0.32 : 0.2);
      shell.current.rotation.x = Math.sin(t * 0.3 + index) * 0.25;
    }
    if (symRef.current) symRef.current.position.y = Math.sin(t * 1.1 + index) * 0.04;
    mats.current.forEach((m) => {
      if (!m) return;
      (m as THREE.Material & { opacity: number }).opacity = ((m.userData.base as number) ?? 1) * dim.current * (1 + hot.current * 0.4);
    });
    (ring.material as THREE.PointsMaterial).opacity = (P.lineOp + hot.current * 0.3) * (1 - anim.blend * 0.4) * (other ? 0.4 : 1);
    // dashed spoke from the sphere to the Ω (hidden while a sphere is the subject)
    const arr = spoke.geometry.getAttribute('position') as THREE.BufferAttribute;
    arr.setXYZ(0, pos.x, pos.y, pos.z);
    arr.setXYZ(1, 0, 0, 0);
    arr.needsUpdate = true;
    spoke.computeLineDistances();
    (spoke.material as THREE.LineDashedMaterial).opacity = (0.26 + hot.current * 0.4) * (1 - anim.focus);
    if (label.current) {
      camN.copy(camera.position).normalize();
      const depth = THREE.MathUtils.clamp(0.5 + pos.dot(camN) / (orbit.r * 2), 0, 1);
      // far-side spheres fade their labels away so the front of the ecosphere reads cleanly
      const vis = selected || hot.current > 0.5 ? 1 : anim.blend > 0.5 ? 1 : THREE.MathUtils.smoothstep(depth, 0.4, 0.62);
      label.current.style.opacity = String(vis * (other ? 0.3 : 1));
      label.current.style.pointerEvents = vis < 0.15 ? "none" : "";
      label.current.classList.toggle('on', hot.current > 0.5);
    }
  });
  const reg = (m: THREE.Material | null, base: number) => {
    if (m && !mats.current.includes(m)) {
      m.userData.base = base;
      mats.current.push(m);
    }
  };
  const handlers = {
    onPointerOver: (ev: ThreeEvent<PointerEvent>) => {
      ev.stopPropagation();
      hoverNode(node.id);
    },
    onPointerOut: () => hoverNode(null),
    onClick: (ev: ThreeEvent<MouseEvent>) => {
      ev.stopPropagation();
      selectNode(node.id);
    },
  };
  return (
    <>
      <primitive object={ring} />
      <primitive object={spoke} />
      <group ref={root} name={`eco-${node.id}`}>
        {/* soft halo */}
        <sprite scale={2.3}>
          <spriteMaterial ref={(m) => reg(m, P.additive ? 0.32 : 0.22)} map={glowTex()} color={col} transparent opacity={0.3} depthWrite={false} blending={blendFor(P)} />
        </sprite>
        {/* transparent dotted sphere */}
        <points ref={shell} geometry={shellGeo}>
          <pointsMaterial ref={(m) => reg(m, P.additive ? 0.7 : 0.75)} size={0.05} map={dotTex()} color={col} transparent opacity={0.7} depthWrite={false} blending={blendFor(P)} />
        </points>
        {ringed && (
          <mesh rotation={[Math.PI / 2.4, 0.2, 0]}>
            <ringGeometry args={[0.98, 1.02, 120]} />
            <meshBasicMaterial ref={(m) => reg(m, 0.5)} color={col} side={THREE.DoubleSide} transparent opacity={0.5} depthWrite={false} />
          </mesh>
        )}
        {/* the category symbol floating inside */}
        <sprite ref={symRef} scale={0.92}>
          <spriteMaterial ref={(m) => reg(m, 1)} map={symTex} color={col} transparent opacity={1} depthWrite={false} toneMapped={false} />
        </sprite>
        <mesh scale={0.82} {...handlers}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
        </mesh>
        <Moons ideas={ideas} />
        <Html position={[0, -1.08, 0]} center zIndexRange={[3, 0]}>
          <button
            ref={label}
            className="plabel"
            style={{ ['--c' as string]: col }}
            onClick={() => selectNode(node.id)}
            onPointerEnter={() => hoverNode(node.id)}
            onPointerLeave={() => hoverNode(null)}
          >
            <b>{node.label}</b>
            <small>
              {sym.name}
              {pendingCount + confirmedCount > 0 && (
                <span className="moons">
                  {' '}· {pendingCount > 0 && <i className="m-pending">◯ {pendingCount}</i>} {confirmedCount > 0 && <i className="m-conf">● {confirmedCount}</i>}
                </span>
              )}
            </small>
          </button>
        </Html>
      </group>
    </>
  );
}

/* ───────────── library flyers: small dotted symbol spheres on free great circles ───────────── */
function Flyer({ index, P }: { index: number; P: Palette }) {
  const f = FLYERS[index];
  const atlas = useTexture(SYMBOL_ATLAS.src);
  const symTex = useMemo(() => symbolTex(atlas, f.sym), [atlas, f.sym]);
  const shell = useMemo(() => fibonacciShell(110, 0.36), []);
  const group = useRef<THREE.Group>(null);
  const shellRef = useRef<THREE.Points>(null);
  const [hover, setHover] = useState(false);
  const e = useMemo(() => new THREE.Vector3(), []);
  const p = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock }) => {
    const ang = f.phase + anim.orbitT * f.orbit.speed * 3;
    orbitPoint(f.orbit, ang, e);
    p.set(Math.cos(f.planAngle + anim.orbitT * 0.02) * f.orbit.planR, 0, Math.sin(f.planAngle + anim.orbitT * 0.02) * f.orbit.planR);
    group.current?.position.copy(e.lerp(p, anim.blend));
    if (shellRef.current && !getState().reducedMotion) shellRef.current.rotation.y = clock.elapsedTime * 0.4;
    group.current?.scale.setScalar((hover ? 1.3 : 1) * (getState().selected ? 0.7 : 1));
  });
  return (
    <group ref={group}>
      <points ref={shellRef} geometry={shell}>
        <pointsMaterial size={0.035} map={dotTex()} color={P.flyer} transparent opacity={0.32} depthWrite={false} blending={blendFor(P)} />
      </points>
      <sprite scale={0.46}>
        <spriteMaterial map={symTex} color={P.flyer} transparent opacity={0.45} depthWrite={false} toneMapped={false} />
      </sprite>
      <mesh
        scale={0.45}
        onPointerOver={(ev) => {
          ev.stopPropagation();
          setHover(true);
          document.body.style.cursor = 'help';
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = '';
        }}
      >
        <sphereGeometry args={[1, 10, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
      {hover && (
        <Html position={[0, -0.6, 0]} center zIndexRange={[3, 0]} style={{ pointerEvents: 'none' }}>
          <span className="plabel on" style={{ ['--c' as string]: P.flyer }}>
            <b>{f.sym.name}</b>
            <small>{f.sym.meaning}</small>
          </span>
        </Html>
      )}
    </group>
  );
}

/* ───────────── plan rings + faint environment shell ───────────── */
function Field({ P }: { P: Palette }) {
  const planRings = useMemo(() => SATELLITES.map((s) => circlePoints(s.orbit.planR, 240)), []);
  const outer = useMemo(() => circlePoints(18.8, 320), []);
  const shell = useMemo(() => fibonacciShell(2400, 18), []);
  const planMats = useRef<THREE.PointsMaterial[]>([]);
  const shellMat = useRef<THREE.PointsMaterial>(null);
  useFrame(() => {
    planMats.current.forEach((m) => m && (m.opacity = 0.45 * anim.blend));
    if (shellMat.current) shellMat.current.opacity = 0.12 * (1 - anim.blend);
  });
  return (
    <>
      <points geometry={shell}>
        <pointsMaterial ref={shellMat} size={0.05} map={dotTex()} color={P.dot} transparent opacity={0.12} depthWrite={false} />
      </points>
      {[...planRings, outer].map((g, k) => (
        <points key={k} geometry={g}>
          <pointsMaterial ref={(m) => void (m && (planMats.current[k] = m))} size={0.06} map={dotTex()} color={k === planRings.length ? P.lanes[0] : P.line} transparent opacity={0} depthWrite={false} />
        </points>
      ))}
    </>
  );
}

/* ───────────── motion clock, view blend, focus amount ───────────── */
function Motion() {
  useFrame((_, dt) => {
    const s = getState();
    if (!s.reducedMotion) anim.orbitT += dt;
    const target = s.viewMode === 'plan' ? 1 : 0;
    anim.blend = s.reducedMotion ? target : THREE.MathUtils.damp(anim.blend, target, 2.6, dt);
    anim.focus = THREE.MathUtils.damp(anim.focus, s.selected && s.selected !== 'fox-gateway' ? 1 : 0, 2.2, dt);
  });
  return null;
}

/** Camera: home frame per layout; on selection the subject is at the centre, so frame it beside the info panel. */
function Rig({ controls }: { controls: React.RefObject<OrbitControlsImpl | null> }) {
  const { camera, size } = useThree();
  const selected = useUniverse((s) => s.selected);
  const mode = useUniverse((s) => s.viewMode);
  const flying = useRef(true);
  const goal = useMemo(() => ({ pos: ECO_CAM.pos.clone(), target: ECO_CAM.target.clone() }), []);
  useEffect(() => {
    const portrait = size.width < size.height;
    const k = portrait ? ECO_CAM.portraitScale : 1;
    const plan = mode === 'plan';
    if (!selected) {
      goal.pos.copy(plan ? PLAN_CAM.pos : ECO_CAM.pos).multiplyScalar(k);
      goal.target.copy(plan ? PLAN_CAM.target : ECO_CAM.target);
    } else {
      const dist = selected === 'omnisynapse' ? 15 : 12.5;
      const shift = portrait ? new THREE.Vector3(0, -2.6, 0) : new THREE.Vector3(3.4, 0, 0);
      goal.target.set(0, 0, 0).add(shift);
      goal.pos.copy(plan ? new THREE.Vector3(0, dist * 1.6 * k, 0.01) : new THREE.Vector3(0, 2.4, dist * k)).add(shift);
    }
    flying.current = true;
    const c = controls.current;
    if (c) c.enableRotate = mode !== 'plan';
  }, [selected, mode, size, goal, controls]);
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const stop = () => (flying.current = false);
    c.addEventListener('start', stop);
    return () => c.removeEventListener('start', stop);
  }, [controls]);
  useFrame((_, dt) => {
    const c = controls.current;
    if (!c || !flying.current) return;
    const k = getState().reducedMotion ? 1 : 1 - Math.exp(-2.2 * dt);
    camera.position.lerp(goal.pos, k);
    c.target.lerp(goal.target, k);
    c.update();
    if (camera.position.distanceTo(goal.pos) < 0.03) flying.current = false;
  });
  return null;
}

function Scene({ P }: { P: Palette }) {
  const ideas = useIdeas();
  return (
    <>
      <Sky P={P} />
      <GlyphCloud P={P} mode="ambient" count={460} rMin={20} rMax={52} speed={[0.004, 0.016]} size={[0.22, 0.5]} />
      <GlyphCloud P={P} mode="swarm" count={240} rMin={2.9} rMax={7.5} speed={[0.12, 0.42]} size={[0.1, 0.24]} />
      <Field P={P} />
      <OmegaCore P={P} />
      {SATELLITES.map((s, i) => (
        <Globe key={s.node.id} index={i} P={P} ideas={ideas.bySphere[s.node.id] ?? []} />
      ))}
      {FLYERS.map((_, i) => (
        <Flyer key={i} index={i} P={P} />
      ))}
    </>
  );
}

function ClearColour({ P }: { P: Palette }) {
  const { gl } = useThree();
  useEffect(() => gl.setClearColor(P.clear), [gl, P]);
  return null;
}

export default function Ecosphere() {
  const lowPower = useUniverse((s) => s.lowPower);
  const theme = useUniverse((s) => s.theme);
  const P = PALETTES[theme];
  const controls = useRef<OrbitControlsImpl | null>(null);
  useEffect(() => {
    setState({ introDone: true, phase: getState().selected ? 'NODE_FOCUSED' : 'TEMPLE_IDLE' });
    anim.blend = getState().viewMode === 'plan' ? 1 : 0;
  }, []);
  return (
    <Canvas
      dpr={[1, lowPower ? 1 : 1.75]}
      gl={{ antialias: !lowPower, powerPreference: 'high-performance' }}
      camera={{ position: ECO_CAM.pos.toArray(), fov: 46, near: 0.1, far: 800 }}
      onPointerMissed={() => selectNode(null)}
      aria-label="OMNI ecosphere — 3D view. Use the navigation list for keyboard access."
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
      }}
    >
      <ambientLight intensity={0.45} />
      <directionalLight position={[6, 8, 10]} intensity={2.4} color={0xfff0d8} />
      <directionalLight position={[-8, -3, -6]} intensity={0.8} color={0x9fd0ff} />
      <Motion />
      <ClearColour P={P} />
      <Suspense fallback={null}>
        <Scene key={theme} P={P} />
      </Suspense>
      <OrbitControls ref={controls} makeDefault enablePan={false} enableDamping dampingFactor={0.08} minDistance={5} maxDistance={90} target={ECO_CAM.target} rotateSpeed={0.55} zoomSpeed={0.7} />
      <Rig controls={controls} />
      {!lowPower && P.bloom && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={0.8} luminanceThreshold={0.55} luminanceSmoothing={0.2} radius={0.7} />
          <Vignette eskil={false} offset={0.25} darkness={0.6} />
        </EffectComposer>
      )}
    </Canvas>
  );
}

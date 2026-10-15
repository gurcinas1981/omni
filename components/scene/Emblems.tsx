'use client';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { OMEGA_PATH } from '@/lib/brand/omega';
import { foxShards } from '@/lib/brand/fox';
import { ALTAR_POS, BRAIN_CENTER, FLOOR_Y, FOX_POS } from './layout';
import { getState, hoverNode, selectNode, stage, useUniforms } from './store';

const goldMaterial = () =>
  new THREE.MeshPhysicalMaterial({
    color: '#e6c277',
    metalness: 0.92,
    roughness: 0.2,
    clearcoat: 0.8,
    clearcoatRoughness: 0.15,
    emissive: '#b07a22',
    emissiveIntensity: 0.4,
  });

function useHover(id: string) {
  const amt = useRef(0);
  const update = (dt: number) => {
    const s = getState();
    const target = s.hovered === id || s.selected === id ? 1 : 0;
    amt.current = THREE.MathUtils.damp(amt.current, target, 5, dt);
    return amt.current;
  };
  const handlers = {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      hoverNode(id);
    },
    onPointerOut: () => hoverNode(null),
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      selectNode(id);
    },
  };
  return { update, handlers };
}

/* ───────────── Ω — the OMNISYNAPSE platform emblem ───────────── */
export function OmegaEmblem() {
  const ref = useRef<THREE.Group>(null);
  const mat = useMemo(goldMaterial, []);
  const geo = useMemo(() => {
    const data = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${OMEGA_PATH}"/></svg>`);
    const shapes = data.paths.flatMap((p) => p.toShapes());
    const g = new THREE.ExtrudeGeometry(shapes, { depth: 6, bevelEnabled: true, bevelThickness: 2.2, bevelSize: 1.6, bevelSegments: 4, curveSegments: 48 });
    g.center();
    g.scale(0.02, -0.02, -0.012); // SVG y-down → y-up (z also flipped to preserve winding)
    g.computeVertexNormals();
    return g;
  }, []);
  const { update, handlers } = useHover('omnisynapse');
  useFrame(({ clock }, dt) => {
    const h = update(dt);
    const w = stage(4.4, 5.6);
    const s = getState();
    if (!ref.current) return;
    ref.current.scale.setScalar(Math.max(0.0001, w) * (1 + h * 0.06));
    if (!s.reducedMotion) {
      ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.4) * 0.18;
      ref.current.position.y = BRAIN_CENTER.y + 0.05 + Math.sin(clock.elapsedTime * 0.8) * 0.04;
    }
    mat.emissiveIntensity = 0.35 + w * 0.45 + h * 0.6;
  });
  return (
    <group ref={ref} position={[0, BRAIN_CENTER.y + 0.05, 3.3]}>
      <mesh geometry={geo} material={mat} {...handlers} castShadow />
      {/* halo */}
      <mesh position={[0, 0, -0.15]}>
        <circleGeometry args={[1.25, 64]} />
        <meshBasicMaterial color="#fff2cf" transparent opacity={0.07} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ───────────── FOX insignia — faceted gold mask, ecosystem gateway ───────────── */
export function FoxInsignia() {
  const ref = useRef<THREE.Group>(null);
  const mat = useMemo(goldMaterial, []);
  const geos = useMemo(() => foxShards(), []);
  const { update, handlers } = useHover('fox');
  useFrame(({ clock }, dt) => {
    const h = update(dt);
    const w = stage(2.2, 3.4);
    if (!ref.current) return;
    const s = getState();
    const bob = s.reducedMotion ? 0 : Math.sin(clock.elapsedTime * 0.9) * 0.06;
    ref.current.position.y = FOX_POS.y + bob + (1 - w) * -0.6;
    ref.current.scale.setScalar(0.72 * Math.max(0.0001, w) * (1 + h * 0.05));
    if (!s.reducedMotion) ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.5) * 0.12;
    mat.emissiveIntensity = 0.2 + w * 0.3 + h * 0.9;
  });
  return (
    <group ref={ref} position={FOX_POS}>
      {geos.map((g, i) => (
        <mesh key={i} geometry={g} material={mat} {...handlers} castShadow />
      ))}
      <mesh {...handlers} position={[0, 0, 0]}>
        <planeGeometry args={[2.2, 2.8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
    </group>
  );
}

/* ───────────── Central conduit beam ───────────── */
export function Beam() {
  const core = useRef<THREE.MeshBasicMaterial>(null);
  const glow = useUniforms(() => ({ uTime: { value: 0 }, uWake: { value: 0 } }));
  useFrame(({ clock }) => {
    const w = stage(1.2, 2.4);
    const glowU = glow.u();
    glowU.uWake.value = w;
    glowU.uTime.value = getState().reducedMotion ? 0 : clock.elapsedTime;
    if (core.current) core.current.opacity = w;
  });
  const h = 22;
  return (
    <group position={[0, FLOOR_Y + h / 2, 0.4]}>
      <mesh>
        <cylinderGeometry args={[0.035, 0.035, h, 8, 1, true]} />
        <meshBasicMaterial ref={core} color={'#f4fdff'} toneMapped={false} transparent />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.55, 0.55, h, 32, 1, true]} />
        <shaderMaterial
          ref={glow.ref}
          uniforms={glow.memo}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          vertexShader={/* glsl */ `varying vec3 vN; varying vec3 vV; varying float vY;
            void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); vY=position.y; gl_Position=projectionMatrix*mv; }`}
          fragmentShader={/* glsl */ `uniform float uWake; uniform float uTime; varying vec3 vN; varying vec3 vV; varying float vY;
            void main(){
              float edge = pow(abs(dot(vN,vV)), 6.0);
              float flow = 0.75 + 0.25*sin(vY*3.0 - uTime*4.0);
              float fade = smoothstep(11.0, 2.0, vY) * smoothstep(-11.5,-10.0,vY);
              gl_FragColor = vec4(vec3(0.55,0.9,1.0)*1.4, edge*0.55*flow*fade*uWake);
            }`}
        />
      </mesh>
    </group>
  );
}

/* ───────────── Energy altar with the six-stage intelligence cycle ───────────── */
export function Altar() {
  const ref = useRef<THREE.Group>(null);
  const markers = useRef<THREE.Group>(null);
  const ringMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#1b1610', metalness: 0.9, roughness: 0.35, emissive: '#c8a96a', emissiveIntensity: 0.0 }),
    [],
  );
  const trimMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffd28a', toneMapped: false, transparent: true }), []);
  const wave = useUniforms(() => ({ uTime: { value: 0 }, uWake: { value: 0 }, uHover: { value: 0 } }));
  const { update, handlers } = useHover('altar');
  useFrame(({ clock }, dt) => {
    const h = update(dt);
    const w = stage(0.6, 1.8);
    const s = getState();
    ringMat.emissiveIntensity = 0.05 + w * 0.12 + h * 0.2;
    trimMat.opacity = w;
    const waveU = wave.u();
    waveU.uWake.value = w;
    waveU.uHover.value = h;
    waveU.uTime.value = s.reducedMotion ? 1.0 : clock.elapsedTime;
    if (markers.current && !s.reducedMotion) markers.current.rotation.y = clock.elapsedTime * 0.12;
  });
  const radii = [3.1, 2.4, 1.7, 1.05];
  return (
    <group ref={ref} position={ALTAR_POS}>
      {radii.map((r, i) => (
        <group key={r} position={[0, 0.08 + i * 0.16, 0]}>
          <mesh material={ringMat} receiveShadow {...handlers}>
            <cylinderGeometry args={[r, r + 0.12, 0.16, 96]} />
          </mesh>
          <mesh material={trimMat} position={[0, 0.085, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[r - 0.04, r - 0.015, 128]} />
          </mesh>
        </group>
      ))}
      {/* six-stage cycle markers */}
      <group ref={markers} position={[0, 0.72, 0]}>
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 1.45, 0, Math.sin(a) * 1.45]}>
              <octahedronGeometry args={[0.09, 0]} />
              <meshBasicMaterial color={i % 2 ? '#7fe6ff' : '#ffd28a'} toneMapped={false} />
            </mesh>
          );
        })}
      </group>
      {/* expanding halo waves */}
      <mesh position={[0, 0.72, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[5.5, 96]} />
        <shaderMaterial
          ref={wave.ref}
          uniforms={wave.memo}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexShader={/* glsl */ `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `}
          fragmentShader={/* glsl */ `uniform float uTime; uniform float uWake; uniform float uHover; varying vec2 vUv;
            void main(){
              float r = length(vUv-0.5)*2.0;
              float w = 0.0;
              for (int i=0;i<3;i++){ float p = fract(uTime*0.18 + float(i)/3.0); w += smoothstep(0.03,0.0,abs(r-p)) * (1.0-p); }
              float core = smoothstep(0.12,0.0,r);
              vec3 c = mix(vec3(1.0,0.8,0.45), vec3(0.6,0.95,1.0), r);
              gl_FragColor = vec4(c, (w*0.5 + core*1.2)*uWake*(1.0+uHover));
            }`}
        />
      </mesh>
      <pointLight position={[0, 1.2, 0]} color={'#ffd9a0'} intensity={6} distance={9} decay={2} />
    </group>
  );
}

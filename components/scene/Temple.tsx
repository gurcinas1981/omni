'use client';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { ALTAR_POS, COLUMN_X, FLOOR_Y, GUARDIAN_X } from './layout';
import { getState, hoverNode, selectNode, stage, useUniforms } from './store';
import { columnTextures, dotTexture } from './textures';

const obsidian = () => new THREE.MeshPhysicalMaterial({ color: '#0b0e13', metalness: 0.4, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.15 });
const goldTrim = () => new THREE.MeshStandardMaterial({ color: '#c8a96a', metalness: 1, roughness: 0.3, emissive: '#6b4a14', emissiveIntensity: 0.4 });

/* ───────────── Circuit floor (procedural PCB traces converging on the altar) ───────────── */
export function CircuitFloor() {
  const sh = useUniforms(() => ({ uTime: { value: 0 }, uWake: { value: 0 }, uCenter: { value: new THREE.Vector2(ALTAR_POS.x, ALTAR_POS.z) } }));
  useFrame(({ clock }) => {
    const u = sh.u();
    u.uTime.value = getState().reducedMotion ? 3.0 : clock.elapsedTime;
    u.uWake.value = stage(0, 1.6);
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, -10]} receiveShadow>
      <planeGeometry args={[90, 70, 1, 1]} />
      <shaderMaterial
        ref={sh.ref}
        uniforms={sh.memo}
        vertexShader={/* glsl */ `varying vec2 vW; varying float vDist;
          void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xz; vec4 mv = viewMatrix*w; vDist = -mv.z; gl_Position = projectionMatrix*mv; }`}
        fragmentShader={/* glsl */ `
          uniform float uTime; uniform float uWake; uniform vec2 uCenter; varying vec2 vW; varying float vDist;
          float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
          float lineAA(float d, float w){ return smoothstep(w, 0.0, abs(d)); }
          void main(){
            vec2 p = vW - uCenter;
            float r = length(p);
            float ang = atan(p.y, p.x);
            // radial traces converging on altar
            float N = 72.0;
            float idx = floor((ang/6.28318+0.5)*N);
            float aCell = fract((ang/6.28318+0.5)*N);
            float keep = step(0.35, hash(vec2(idx, 3.0)));
            float radial = lineAA((aCell-0.5)*r*6.28318/N, 0.03) * keep * smoothstep(3.2,4.0,r);
            // manhattan PCB segments in grid cells
            vec2 cell = floor(vW*0.9); vec2 f = fract(vW*0.9);
            float h = hash(cell);
            float seg = 0.0;
            if (h < 0.25) seg = lineAA(f.y-0.5, 0.025) * step(0.15,f.x) * step(f.x,0.85);
            else if (h < 0.5) seg = lineAA(f.x-0.5, 0.025) * step(0.15,f.y) * step(f.y,0.85);
            else if (h < 0.58) seg = lineAA(f.x-f.y, 0.03);
            float pad = smoothstep(0.09,0.06,length(f-0.5)) * step(0.82,h);
            // pulses travelling inward
            float pulse = smoothstep(0.35,0.0,abs(fract(r*0.07 + uTime*0.25 + hash(vec2(idx,9.0))) - 0.5)-0.32);
            vec3 gold = vec3(0.95,0.72,0.35); vec3 cyan = vec3(0.25,0.85,1.0);
            float pick = hash(vec2(idx, 1.0));
            vec3 traceCol = mix(gold, cyan, step(0.55, pick));
            float fade = smoothstep(42.0, 6.0, r);
            vec3 col = vec3(0.012,0.016,0.024);
            col += traceCol * radial * (0.35 + pulse*2.6) * fade;
            col += mix(gold,cyan,step(0.5,h)) * (seg*0.22 + pad*0.6) * fade * smoothstep(2.5,6.0,r);
            // slab seams
            vec2 slab = abs(fract(vW/4.0)-0.5);
            col += vec3(0.06,0.08,0.11) * lineAA(min(slab.x,slab.y), 0.01) * fade;
            // altar glow pool
            col += vec3(1.0,0.78,0.45) * smoothstep(7.0,0.0,r) * 0.22;
            col *= uWake;
            float fog = smoothstep(55.0, 18.0, vDist);
            gl_FragColor = vec4(col*fog, 1.0);
          }`}
      />
    </mesh>
  );
}

/* ───────────── Monumental carved columns ───────────── */
function Column({ side }: { side: 'left' | 'right' }) {
  const { map, emissiveMap } = useMemo(() => columnTextures(side), [side]);
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ map, emissiveMap, emissive: new THREE.Color('#ffcc77'), emissiveIntensity: 0.0, metalness: 0.5, roughness: 0.45 }),
    [map, emissiveMap],
  );
  const stone = useMemo(obsidian, []);
  const trim = useMemo(goldTrim, []);
  useFrame(() => {
    mat.emissiveIntensity = stage(6.0, 7.4) * 1.1;
  });
  const x = side === 'left' ? -COLUMN_X : COLUMN_X;
  const H = 17;
  return (
    <group position={[x, FLOOR_Y + H / 2, -1.2]} rotation={[0, side === 'left' ? 0.32 : -0.32, 0]}>
      <mesh material={[stone, stone, stone, stone, mat, stone]} castShadow receiveShadow>
        <boxGeometry args={[3.0, H, 1.6]} />
      </mesh>
      {/* capital + base */}
      <mesh material={stone} position={[0, H / 2 - 0.3, 0]}>
        <boxGeometry args={[3.5, 0.6, 2.0]} />
      </mesh>
      <mesh material={trim} position={[0, H / 2 - 0.62, 0]}>
        <boxGeometry args={[3.3, 0.08, 1.85]} />
      </mesh>
      <mesh material={stone} position={[0, -H / 2 + 0.5, 0]}>
        <boxGeometry args={[3.6, 1.0, 2.1]} />
      </mesh>
      <mesh material={trim} position={[0, -H / 2 + 1.04, 0]}>
        <boxGeometry args={[3.4, 0.08, 1.95]} />
      </mesh>
    </group>
  );
}

/* ───────────── Seated jackal-headed guardian (original stylised sculpture) ───────────── */
function Guardian({ side }: { side: 'left' | 'right' }) {
  const id = side === 'left' ? 'guardian-security' : 'guardian-integrity';
  const stone = useMemo(obsidian, []);
  const trim = useMemo(goldTrim, []);
  const eyeMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffcf7a', toneMapped: false }), []);
  const hover = useRef(0);
  useFrame(({ clock }, dt) => {
    const s = getState();
    hover.current = THREE.MathUtils.damp(hover.current, s.hovered === id || s.selected === id ? 1 : 0, 5, dt);
    const w = stage(6.2, 7.4);
    const pulse = s.reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin(clock.elapsedTime * 3);
    eyeMat.color.setScalar(1).multiply(new THREE.Color('#ffcf7a')).multiplyScalar(0.4 + w * 0.8 + hover.current * (1.5 + pulse * 2));
    trim.emissiveIntensity = 0.25 + hover.current * 0.9;
  });
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
  const dir = side === 'left' ? 1 : -1;
  return (
    <group position={[-dir * GUARDIAN_X, FLOOR_Y, 1.6]} rotation={[0, dir * 0.38, 0]} scale={1.15}>
      {/* plinth */}
      <mesh material={stone} position={[0, 0.45, 0]} castShadow receiveShadow {...handlers}>
        <boxGeometry args={[2.2, 0.9, 2.6]} />
      </mesh>
      <mesh material={trim} position={[0, 0.92, 0]}>
        <boxGeometry args={[2.25, 0.05, 2.65]} />
      </mesh>
      <group position={[0, 0.95, -0.15]} {...handlers}>
        {/* haunches */}
        <mesh material={stone} position={[0, 0.55, -0.35]} scale={[0.75, 0.6, 0.85]} castShadow>
          <sphereGeometry args={[1, 24, 16]} />
        </mesh>
        {/* torso */}
        <mesh material={stone} position={[0, 1.55, 0.05]} rotation={[-0.12, 0, 0]} castShadow>
          <cylinderGeometry args={[0.38, 0.55, 1.7, 20]} />
        </mesh>
        {/* front legs / arms */}
        {[-0.3, 0.3].map((x) => (
          <group key={x}>
            <mesh material={stone} position={[x, 0.75, 0.5]} castShadow>
              <boxGeometry args={[0.22, 1.5, 0.3]} />
            </mesh>
            <mesh material={stone} position={[x, 0.08, 0.72]}>
              <boxGeometry args={[0.26, 0.16, 0.6]} />
            </mesh>
          </group>
        ))}
        {/* collar */}
        <mesh material={trim} position={[0, 2.25, 0.05]} rotation={[Math.PI / 2 - 0.1, 0, 0]}>
          <torusGeometry args={[0.36, 0.09, 12, 32]} />
        </mesh>
        <mesh material={trim} position={[0, 2.0, 0.42]} rotation={[0.2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.22, 0.4, 3]} />
        </mesh>
        {/* neck + head */}
        <mesh material={stone} position={[0, 2.55, 0.08]}>
          <cylinderGeometry args={[0.2, 0.26, 0.6, 16]} />
        </mesh>
        <mesh material={stone} position={[0, 2.95, 0.12]} scale={[0.32, 0.3, 0.36]}>
          <sphereGeometry args={[1, 20, 16]} />
        </mesh>
        {/* snout */}
        <mesh material={stone} position={[0, 2.86, 0.5]} rotation={[Math.PI / 2 + 0.25, 0, 0]}>
          <coneGeometry args={[0.16, 0.6, 4]} />
        </mesh>
        {/* ears */}
        {[-0.15, 0.15].map((x) => (
          <mesh key={x} material={stone} position={[x, 3.42, 0.02]} rotation={[-0.15, 0, x * -0.8]}>
            <coneGeometry args={[0.1, 0.62, 4]} />
          </mesh>
        ))}
        {/* eyes */}
        {[-0.13, 0.13].map((x) => (
          <mesh key={x} material={eyeMat} position={[x, 3.0, 0.4]}>
            <sphereGeometry args={[0.035, 8, 8]} />
          </mesh>
        ))}
        {/* tail */}
        <mesh material={stone} position={[0.55 * dir, 0.18, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.04, 1.3, 8]} />
        </mesh>
      </group>
    </group>
  );
}

/* ───────────── Digital glyph streams (procedural, non-linguistic) ───────────── */
function MatrixRain({ position, width, height, mask = 0.0 }: { position: [number, number, number]; width: number; height: number; mask?: number }) {
  const sh = useUniforms(() => ({ uTime: { value: 0 }, uWake: { value: 0 }, uMask: { value: mask }, uAspect: { value: width / height } }));
  useFrame(({ clock }) => {
    const u = sh.u();
    u.uTime.value = getState().reducedMotion ? 4.0 : clock.elapsedTime;
    u.uWake.value = stage(5.8, 7.2);
  });
  return (
    <mesh position={position}>
      <planeGeometry args={[width, height]} />
      <shaderMaterial
        ref={sh.ref}
        uniforms={sh.memo}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={/* glsl */ `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `}
        fragmentShader={/* glsl */ `
          uniform float uTime; uniform float uWake; uniform float uMask; uniform float uAspect; varying vec2 vUv;
          float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
          void main(){
            vec2 grid = vec2(110.0*uAspect, 110.0);
            vec2 g = vUv*grid; vec2 cell = floor(g); vec2 f = fract(g);
            float col = cell.x;
            float isOn = step(0.62, hash(vec2(col, 7.0)));
            float speed = 0.04 + hash(vec2(col, 1.0))*0.09;
            float head = fract(-uTime*speed + hash(vec2(col,3.0)));
            float y = 1.0 - vUv.y;
            float trail = fract(head - y + 1.0);
            float bright = smoothstep(0.35, 0.0, trail) ;
            float isHead = smoothstep(0.012, 0.0, trail);
            // 3x5 pseudo-glyph from bits, changing over time
            vec2 px = floor(f*vec2(3.0,5.0));
            float glyphSeed = hash(cell + floor(uTime*2.0 + hash(cell)*10.0));
            float bit = step(0.45, hash(px + glyphSeed*31.0));
            float inner = step(0.12,f.x)*step(f.x,0.88)*step(0.08,f.y)*step(f.y,0.92);
            float a = bit*inner*bright*isOn;
            float m = mix(1.0, smoothstep(0.18, 0.45, abs(vUv.x-0.5)), uMask);
            vec3 c = mix(vec3(0.1,0.85,0.75), vec3(0.85,1.0,0.95), isHead);
            gl_FragColor = vec4(c, a*0.55*m*uWake*smoothstep(0.0,0.15,vUv.y));
          }`}
      />
    </mesh>
  );
}

/* ───────────── Distant world: sky, stars, planet horizon, pyramids, skyline, shafts ───────────── */
function Sky() {
  const sh = useUniforms(() => ({ uWake: { value: 0 } }));
  useFrame(() => {
    const u = sh.u();
    u.uWake.value = 0.35 + stage(6.0, 7.6) * 0.65;
  });
  return (
    <mesh scale={160}>
      <sphereGeometry args={[1, 48, 24]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        ref={sh.ref}
        uniforms={sh.memo}
        vertexShader={/* glsl */ `varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `}
        fragmentShader={/* glsl */ `uniform float uWake; varying vec3 vP;
          void main(){
            float h = vP.y;
            vec3 top = vec3(0.004,0.008,0.02);
            vec3 mid = vec3(0.02,0.05,0.11);
            vec3 nebV = vec3(0.16,0.07,0.26);
            vec3 c = mix(mid, top, smoothstep(0.0,0.6,h));
            float neb = smoothstep(0.2,0.0,abs(h-0.06)) * (0.5+0.5*sin(vP.x*9.0+vP.z*4.0));
            c += nebV*neb*0.6 + vec3(0.1,0.25,0.4)*smoothstep(0.12,0.0,abs(h-0.02))*0.5;
            gl_FragColor = vec4(c*uWake,1.0);
          }`}
      />
    </mesh>
  );
}

function Stars() {
  const geo = useMemo(() => {
    const n = 2200;
    const p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = Math.random() * 0.9 + 0.05;
      const th = Math.random() * Math.PI * 2;
      const r = 120;
      p.set([Math.cos(th) * Math.sqrt(1 - u * u) * r, u * r * 0.9, Math.sin(th) * Math.sqrt(1 - u * u) * r], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    return g;
  }, []);
  const tex = useMemo(dotTexture, []);
  const mat = useRef<THREE.PointsMaterial>(null);
  useFrame(() => {
    if (mat.current) mat.current.opacity = 0.3 + stage(6.0, 7.6) * 0.6;
  });
  return (
    <points geometry={geo}>
      <pointsMaterial ref={mat} map={tex} size={0.55} sizeAttenuation color="#cfe8ff" transparent depthWrite={false} />
    </points>
  );
}

function Planet() {
  const sh = useUniforms(() => ({ uWake: { value: 0 } }));
  useFrame(() => {
    const u = sh.u();
    u.uWake.value = stage(6.0, 7.6);
  });
  return (
    <mesh position={[0, -78, -95]}>
      <sphereGeometry args={[80, 96, 48]} />
      <shaderMaterial
        ref={sh.ref}
        uniforms={sh.memo}
        vertexShader={/* glsl */ `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`}
        fragmentShader={/* glsl */ `uniform float uWake; varying vec3 vN; varying vec3 vV;
          void main(){ float f = pow(1.0-max(dot(vN,vV),0.0), 3.0); vec3 c = vec3(0.02,0.06,0.12) + vec3(0.25,0.65,1.0)*f*1.6; gl_FragColor=vec4(c*uWake,1.0);} `}
      />
    </mesh>
  );
}

function Distant() {
  const stone = useMemo(() => new THREE.MeshStandardMaterial({ color: '#141b26', roughness: 0.9, metalness: 0.1, emissive: '#0a1630', emissiveIntensity: 0.6 }), []);
  const glow = useMemo(() => new THREE.MeshBasicMaterial({ color: '#8fe9ff', toneMapped: false }), []);
  const towers = useMemo(() => {
    const out: { x: number; z: number; h: number; w: number }[] = [];
    let seed = 11;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 70; i++) {
      const x = (r() * 2 - 1) * 46;
      if (Math.abs(x) < 6) continue;
      out.push({ x, z: -34 - r() * 22, h: 2 + r() * 9, w: 0.5 + r() * 1.6 });
    }
    return out;
  }, []);
  return (
    <group>
      {/* Egyptian-style pyramid (left) and stepped temple (right) */}
      <mesh material={stone} position={[-24, FLOOR_Y + 6, -48]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[12, 13, 4]} />
      </mesh>
      <mesh material={stone} position={[-34, FLOOR_Y + 3.5, -56]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[7, 8, 4]} />
      </mesh>
      <group position={[24, FLOOR_Y, -48]}>
        {Array.from({ length: 7 }, (_, i) => (
          <mesh key={i} material={stone} position={[0, 0.9 + i * 1.75, 0]}>
            <boxGeometry args={[20 - i * 2.6, 1.75, 20 - i * 2.6]} />
          </mesh>
        ))}
        <mesh material={glow} position={[0, 13.6, 0]}>
          <boxGeometry args={[1.6, 1.0, 1.6]} />
        </mesh>
      </group>
      {towers.map((t, i) => (
        <group key={i} position={[t.x, FLOOR_Y + t.h / 2, t.z]}>
          <mesh material={stone}>
            <boxGeometry args={[t.w, t.h, t.w]} />
          </mesh>
          {i % 3 === 0 && (
            <mesh material={glow} position={[0, t.h / 2 + 0.15, 0]}>
              <boxGeometry args={[t.w * 0.2, 0.3, t.w * 0.2]} />
            </mesh>
          )}
        </group>
      ))}
      {/* light shafts */}
      {[-17, -11, -6.5, 6.5, 11, 17].map((x, i) => (
        <mesh key={x} position={[x, FLOOR_Y + 9, -14 - (i % 3) * 5]}>
          <cylinderGeometry args={[0.06, 0.06, 18, 6, 1, true]} />
          <meshBasicMaterial color="#7fe6ff" transparent opacity={0.55} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/* ───────────── Mid-ground obelisks with glowing tips ───────────── */
function Obelisks() {
  const stone = useMemo(obsidian, []);
  const tip = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffd28a', toneMapped: false }), []);
  const spots: [number, number, number][] = [
    [-5.2, -4, 2.6], [5.2, -4, 2.6], [-3.4, -1.5, 1.4], [3.4, -1.5, 1.4], [-6.4, 3.8, 1.8], [6.4, 3.8, 1.8],
    [-9, -12, 3.6], [9, -12, 3.6], [-14, -18, 4.2], [14, -18, 4.2], [-2.2, 4.6, 1.1], [2.2, 4.6, 1.1],
  ];
  return (
    <group>
      {spots.map(([x, z, h], i) => (
        <group key={i} position={[x, FLOOR_Y, z]}>
          <mesh material={stone} position={[0, h / 2, 0]} castShadow>
            <boxGeometry args={[h * 0.16, h, h * 0.16]} />
          </mesh>
          <mesh material={tip} position={[0, h + h * 0.08, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[h * 0.115, h * 0.16, 4]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ───────────── Floating neural dust ───────────── */
function Dust() {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const n = 700;
    const p = new Float32Array(n * 3);
    const c = new Float32Array(n * 3);
    const gold = new THREE.Color('#ffd28a');
    const cyan = new THREE.Color('#7fe6ff');
    for (let i = 0; i < n; i++) {
      p.set([(Math.random() * 2 - 1) * 14, FLOOR_Y + Math.random() * 13, (Math.random() * 2 - 1) * 8], i * 3);
      const col = Math.random() < 0.5 ? gold : cyan;
      c.set([col.r, col.g, col.b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    return g;
  }, []);
  const tex = useMemo(dotTexture, []);
  const mat = useRef<THREE.PointsMaterial>(null);
  useFrame(({ clock }) => {
    if (ref.current && !getState().reducedMotion) {
      ref.current.rotation.y = clock.elapsedTime * 0.01;
      ref.current.position.y = Math.sin(clock.elapsedTime * 0.2) * 0.3;
    }
    if (mat.current) mat.current.opacity = stage(4.0, 6.0) * 0.8;
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial ref={mat} map={tex} size={0.09} vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </points>
  );
}

export function Temple({ lowPower }: { lowPower: boolean }) {
  return (
    <group>
      <Sky />
      <Stars />
      <Planet />
      <Distant />
      <MatrixRain position={[0, 6, -26]} width={72} height={30} mask={1} />
      {!lowPower && <MatrixRain position={[-12.5, 6, -6]} width={5} height={18} />}
      {!lowPower && <MatrixRain position={[12.5, 6, -6]} width={5} height={18} />}
      <CircuitFloor />
      <Obelisks />
      <Column side="left" />
      <Column side="right" />
      <Guardian side="left" />
      <Guardian side="right" />
      <Dust />
    </group>
  );
}

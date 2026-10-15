'use client';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { createNoise3D } from 'simplex-noise';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { BRAIN_CENTER } from './layout';
import { frame, getState, hoverNode, selectNode, stage } from './store';

/** Deterministic PRNG so the brain is identical on every load. */
function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SX = 1.18;
const SY = 1.02;
const SZ = 1.42;
const GAP = 0.09;
const BASE_SCALE = 2.05;

/** Map a unit-sphere point to one hemisphere of a brain silhouette. side: -1 left, +1 right */
function hemi(p: THREE.Vector3, side: -1 | 1, out = new THREE.Vector3()) {
  let { x, y, z } = p;
  // flatten medial face
  const medial = x * side < 0;
  if (medial) x *= 0.22;
  // frontal lobe fuller, occipital narrower, temporal lobe drop
  const front = THREE.MathUtils.smoothstep(z, -1, 1);
  y *= 0.92 + 0.12 * front;
  if (y < -0.25) y += (Math.abs(x) > 0.4 ? -0.08 : 0.05) * (1 - Math.abs(z));
  out.set(side * GAP + (x + side * 0.22) * SX, y * SY, z * SZ);
  if (medial) out.x = side * (GAP + Math.abs(out.x) * 0.25);
  return out;
}

export function Brain() {
  const group = useRef<THREE.Group>(null);
  const organicMat = useRef<THREE.MeshStandardMaterial>(null);
  const synapseMat = useRef<THREE.ShaderMaterial>(null);
  const netMat = useRef<THREE.ShaderMaterial>(null);
  const nodeMat = useRef<THREE.ShaderMaterial>(null);
  const shellMat = useRef<THREE.ShaderMaterial>(null);

  const { organic, synapses, netGeo, nodeGeo, shellGeo } = useMemo(() => {
    const rnd = mulberry(7);
    const noise = createNoise3D(rnd);
    // ── Organic left hemisphere: displaced high-res sphere with gyri/sulci
    const raw = new THREE.IcosahedronGeometry(1, 80);
    raw.deleteAttribute('normal');
    raw.deleteAttribute('uv');
    const base = mergeVertices(raw); // shared vertices → smooth normals (no faceting)
    const pos = base.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const v = new THREE.Vector3();
    const o = new THREE.Vector3();
    const sulcus = new THREE.Color('#2b1c19');
    const tissue = new THREE.Color('#7a605a');
    const crest = new THREE.Color('#d2b59b');
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).normalize();
      // domain-warped noise: rounded gyri with narrow V-shaped sulci
      const w = noise(v.x * 1.3 + 7, v.y * 1.3, v.z * 1.3) * 0.55;
      const n1 = Math.abs(noise(v.x * 2.9 + w, v.y * 2.9 - w, v.z * 2.9 + w));
      const n2 = Math.abs(noise(v.x * 6.2 + 3, v.y * 6.2 + w, v.z * 6.2));
      const fold = Math.pow(n1, 0.55) * 0.75 + Math.pow(n2, 0.7) * 0.25; // 0 = sulcus floor
      const medial = v.x > 0;
      const d = (medial ? 0.2 : 1) * (fold * 0.085 - 0.04);
      v.multiplyScalar(1 + d);
      hemi(v, -1, o);
      pos.setXYZ(i, o.x, o.y, o.z);
      if (fold < 0.35) c.copy(sulcus).lerp(tissue, fold / 0.35);
      else c.copy(tissue).lerp(crest, Math.min(1, (fold - 0.35) / 0.55));
      colors.set([c.r, c.g, c.b], i * 3);
    }
    base.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    base.computeVertexNormals();

    // ── Gold synapse sparks on organic surface
    const sCount = 900;
    const sPos = new Float32Array(sCount * 3);
    const sSeed = new Float32Array(sCount);
    for (let i = 0; i < sCount; i++) {
      const idx = Math.floor(rnd() * pos.count);
      v.fromBufferAttribute(pos, idx);
      const n = v.clone().sub(new THREE.Vector3(-0.6, 0, 0)).normalize().multiplyScalar(0.03);
      sPos.set([v.x + n.x, v.y + n.y, v.z + n.z], i * 3);
      sSeed[i] = rnd();
    }
    const synapses = new THREE.BufferGeometry();
    synapses.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    synapses.setAttribute('seed', new THREE.BufferAttribute(sSeed, 1));

    // ── Digital right hemisphere: node cloud + nearest-neighbour filaments
    const nCount = 1500;
    const nodes: THREE.Vector3[] = [];
    const nPos = new Float32Array(nCount * 3);
    const nSeed = new Float32Array(nCount);
    const nHue = new Float32Array(nCount);
    for (let i = 0; i < nCount; i++) {
      // fibonacci-ish random on sphere, some interior points for depth
      const u = rnd() * 2 - 1;
      const th = rnd() * Math.PI * 2;
      const r = i % 7 === 0 ? 0.55 + rnd() * 0.35 : 1;
      v.set(Math.sqrt(1 - u * u) * Math.cos(th), Math.sqrt(1 - u * u) * Math.sin(th), u).multiplyScalar(r);
      const n1 = 1 - Math.abs(noise(v.x * 2.6, v.y * 2.6, v.z * 2.6));
      v.multiplyScalar(1 + Math.pow(n1, 3) * 0.06);
      hemi(v, 1, o);
      nodes.push(o.clone());
      nPos.set([o.x, o.y, o.z], i * 3);
      nSeed[i] = rnd();
      nHue[i] = rnd() < 0.12 ? 1 : rnd() < 0.3 ? 0.5 : 0;
    }
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(nPos, 3));
    nodeGeo.setAttribute('seed', new THREE.BufferAttribute(nSeed, 1));
    nodeGeo.setAttribute('hue', new THREE.BufferAttribute(nHue, 1));

    const linePos: number[] = [];
    const lineT: number[] = [];
    const linePhase: number[] = [];
    const maxD = 0.36;
    for (let i = 0; i < nCount; i++) {
      let links = 0;
      for (let j = i + 1; j < nCount && links < 3; j++) {
        if (nodes[i].distanceToSquared(nodes[j]) < maxD * maxD) {
          linePos.push(nodes[i].x, nodes[i].y, nodes[i].z, nodes[j].x, nodes[j].y, nodes[j].z);
          lineT.push(0, 1);
          const ph = rnd();
          linePhase.push(ph, ph);
          links++;
        }
      }
    }
    const netGeo = new THREE.BufferGeometry();
    netGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
    netGeo.setAttribute('t', new THREE.Float32BufferAttribute(lineT, 1));
    netGeo.setAttribute('phase', new THREE.Float32BufferAttribute(linePhase, 1));

    // ── Holographic shell for the digital side
    const shell = new THREE.IcosahedronGeometry(1, 24);
    const sp = shell.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < sp.count; i++) {
      v.fromBufferAttribute(sp, i).normalize();
      hemi(v, 1, o);
      sp.setXYZ(i, o.x, o.y, o.z);
    }
    shell.computeVertexNormals();
    return { organic: base, synapses, netGeo, nodeGeo, shellGeo: shell };
  }, []);

  const uniforms = useMemo(
    () => ({
      synapse: { uTime: { value: 0 }, uWake: { value: 0 }, uHover: { value: 0 } },
      net: { uTime: { value: 0 }, uWake: { value: 0 }, uHover: { value: 0 } },
      node: { uTime: { value: 0 }, uWake: { value: 0 }, uHover: { value: 0 } },
      shell: { uWake: { value: 0 }, uHover: { value: 0 } },
    }),
    [],
  );

  const hoverAmt = useRef(0);
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const s = getState();
    const target = s.hovered === 'omnisynapse' || s.selected === 'omnisynapse' ? 1 : 0;
    hoverAmt.current = THREE.MathUtils.damp(hoverAmt.current, target, 4, dt);
    const leftWake = stage(3.0, 4.6);
    const rightWake = stage(3.4, 5.0);
    const breathe = s.reducedMotion ? 0 : Math.sin(t * 0.9) * 0.008;
    if (group.current) {
      group.current.scale.setScalar(BASE_SCALE * (1 + breathe + hoverAmt.current * 0.02));
      if (!s.reducedMotion) group.current.rotation.y = Math.sin(t * 0.15) * 0.06;
    }
    if (organicMat.current) {
      organicMat.current.emissiveIntensity = 0.03 + leftWake * 0.06 + hoverAmt.current * 0.14;
      organicMat.current.opacity = 0.15 + leftWake * 0.85;
    }
    const live = (m: THREE.ShaderMaterial | null, fallback: Record<string, { value: number }>) =>
      (m?.uniforms ?? fallback) as Record<string, { value: number }>;
    const syn = live(synapseMat.current, uniforms.synapse);
    const net = live(netMat.current, uniforms.net);
    const nod = live(nodeMat.current, uniforms.node);
    const shl = live(shellMat.current, uniforms.shell);
    for (const u of [syn, net, nod]) {
      u.uTime.value = s.reducedMotion ? 2.0 : t;
      u.uHover.value = hoverAmt.current;
    }
    syn.uWake.value = leftWake;
    net.uWake.value = rightWake;
    nod.uWake.value = rightWake;
    shl.uWake.value = rightWake;
    shl.uHover.value = hoverAmt.current;
  });

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    hoverNode('omnisynapse');
  };
  const onOut = () => hoverNode(null);
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    selectNode('omnisynapse');
  };

  return (
    <group ref={group} position={BRAIN_CENTER} rotation={[0.08, 0, 0]} scale={BASE_SCALE}>
      {/* Hit volume: generous, invisible */}
      <mesh onPointerOver={onOver} onPointerOut={onOut} onClick={onClick} scale={[1.55, 1.1, 1.45]}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>

      {/* Organic hemisphere */}
      <mesh geometry={organic} castShadow>
        <meshStandardMaterial
          ref={organicMat}
          vertexColors
          roughness={0.5}
          metalness={0.18}
          emissive={'#ff8a3c'}
          emissiveIntensity={0.05}
          transparent
          opacity={0.2}
        />
      </mesh>
      <points geometry={synapses}>
        <shaderMaterial
          ref={synapseMat}
          uniforms={uniforms.synapse}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexShader={/* glsl */ `
            attribute float seed; uniform float uTime; uniform float uWake; varying float vA; varying float vSeed;
            void main(){
              vec4 mv = modelViewMatrix * vec4(position,1.0);
              float tw = pow(0.5 + 0.5*sin(uTime*(1.5+seed*3.0) + seed*40.0), 6.0);
              vA = (0.25 + tw) * uWake; vSeed = seed;
              gl_PointSize = (2.0 + tw*7.0) * (300.0 / -mv.z) * 0.11;
              gl_Position = projectionMatrix * mv;
            }`}
          fragmentShader={/* glsl */ `
            varying float vA; varying float vSeed; uniform float uHover;
            void main(){
              float d = length(gl_PointCoord-0.5); float a = smoothstep(0.5,0.0,d);
              vec3 c = mix(vec3(1.0,0.78,0.38), vec3(1.0,0.95,0.85), step(0.85,vSeed));
              c = mix(c, vec3(0.8,0.55,1.0), step(0.95,vSeed));
              gl_FragColor = vec4(c*(1.6+uHover), a*vA);
            }`}
        />
      </points>

      {/* Digital hemisphere */}
      <mesh geometry={shellGeo}>
        <shaderMaterial
          ref={shellMat}
          uniforms={uniforms.shell}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          vertexShader={/* glsl */ `
            varying vec3 vN; varying vec3 vV;
            void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`}
          fragmentShader={/* glsl */ `
            uniform float uWake; uniform float uHover; varying vec3 vN; varying vec3 vV;
            void main(){ float f = pow(1.0-abs(dot(vN,vV)), 2.5); gl_FragColor = vec4(vec3(0.2,0.6,1.0)*(0.9+uHover), f*0.55*uWake); }`}
        />
      </mesh>
      <lineSegments geometry={netGeo}>
        <shaderMaterial
          ref={netMat}
          uniforms={uniforms.net}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexShader={/* glsl */ `
            attribute float t; attribute float phase; varying float vT; varying float vPhase; varying float vY;
            void main(){ vT=t; vPhase=phase; vY=position.y; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`}
          fragmentShader={/* glsl */ `
            uniform float uTime; uniform float uWake; uniform float uHover; varying float vT; varying float vPhase; varying float vY;
            void main(){
              float head = fract(uTime*0.35 + vPhase);
              float pulse = smoothstep(0.12,0.0,abs(vT-head)) * step(0.55, fract(vPhase*7.31));
              vec3 base = mix(vec3(0.15,0.55,1.0), vec3(0.45,0.85,1.0), vY*0.3+0.5);
              vec3 c = base*0.55 + vec3(0.85,0.7,1.0)*pulse*2.2;
              gl_FragColor = vec4(c*(1.0+uHover*0.6), (0.22 + pulse*0.8)*uWake);
            }`}
        />
      </lineSegments>
      <points geometry={nodeGeo}>
        <shaderMaterial
          ref={nodeMat}
          uniforms={uniforms.node}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexShader={/* glsl */ `
            attribute float seed; attribute float hue; uniform float uTime; uniform float uWake; varying float vA; varying float vHue;
            void main(){
              vec4 mv = modelViewMatrix*vec4(position,1.0);
              float tw = pow(0.5+0.5*sin(uTime*(0.8+seed*2.5)+seed*30.0), 4.0);
              vA = (0.35+tw*0.9)*uWake; vHue = hue;
              gl_PointSize = (1.6 + tw*4.0 + hue*5.0) * (300.0 / -mv.z) * 0.11;
              gl_Position = projectionMatrix*mv;
            }`}
          fragmentShader={/* glsl */ `
            varying float vA; varying float vHue; uniform float uHover;
            void main(){
              float d = length(gl_PointCoord-0.5); float a = smoothstep(0.5,0.0,d);
              vec3 c = mix(vec3(0.45,0.85,1.0), vec3(0.85,0.55,1.0), vHue);
              if (vHue > 0.9) c = vec3(1.0,0.6,1.0);
              gl_FragColor = vec4(c*(1.8+uHover), a*vA);
            }`}
        />
      </points>
    </group>
  );
}

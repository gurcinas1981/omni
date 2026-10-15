'use client';
/**
 * OMNISYNAPSE opener — FOX ecosystem opening sequence (ORBIT grammar), OMNI edition:
 * warp → FOX shards assemble → Ω rises into a wire mind-sphere → the OMNI Symbol Library
 * flies out of the warp into a rotating 3D ecosphere of three orbital rings → shockwave → title + boot log → pull back.
 * Plays at most once every 5 minutes per device (replayable); reduced motion shows the title only.
 */
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { OMEGA_PATH } from '@/lib/brand/omega';
import { foxShards, foxGoldMaterial } from '@/lib/brand/fox';
import { SYMBOL_ATLAS, SYMBOL_BY_ID } from '@/lib/registry/symbols';
import { LANES, SATELLITES, orbitBasis, dottedCircle } from '@/lib/registry/ecosphere';
import { SEEN_KEY } from './openerGate';

const DURATION = 9.2;
const BOOT_LINES = [
  '> BOOT OMNISYNAPSE Ω · SUPERVISORY INTELLIGENCE',
  '> MAP OMNI SYMBOL LIBRARY → 13 CATEGORIES · ANCIENT WISDOM × FUTURE INTELLIGENCE',
  '> READ ORBIT · OBSERVABILITY · UNCONNECTED',
  '> LINK NEXUS · GOVERNED EXECUTION · UNCONNECTED',
  '> MOUNT INSTITUTIONAL MEMORY · EVIDENCE · DECISIONS',
  '> CONVENE EXPERT COUNCIL · 8 DISCIPLINES · 17 SKILLS',
  '> OMNISYNAPSE ONLINE · HUMAN APPROVAL REQUIRED',
];

function glowTexture(color: string) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, color);
  gr.addColorStop(0.25, color);
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
function dotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, '#fff');
  gr.addColorStop(0.4, 'rgba(255,255,255,.6)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
}
export default function OmniOpener({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [titleIn, setTitleIn] = useState(false);
  const [boot, setBoot] = useState<string[]>([]);
  const [leaving, setLeaving] = useState(false);
  const doneRef = useRef(false);
  const finishRef = useRef<() => void>(() => {});
  const labelsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      try {
        localStorage.setItem(SEEN_KEY, String(Date.now()));
      } catch {}
      setLeaving(true);
      setTimeout(onDone, 820);
    };
    finishRef.current = finish;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const bootTimer = setInterval(() => {
      setBoot((b) => (b.length < BOOT_LINES.length ? [...b, BOOT_LINES[b.length]] : b));
    }, reduced || new URLSearchParams(window.location.search).has('openerAt') ? 60 : 820);

    if (reduced || !canvasRef.current) {
      setTitleIn(true);
      const t = setTimeout(finish, 1600);
      return () => {
        clearTimeout(t);
        clearInterval(bootTimer);
      };
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true });
    } catch {
      setTitleIn(true);
      const t = setTimeout(finish, 1600);
      return () => clearTimeout(t);
    }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020605);
    scene.fog = new THREE.Fog(0x020605, 10, 28);
    const cam = new THREE.PerspectiveCamera(55, 1, 0.1, 2000);
    cam.position.set(0, 0, 9);
    let portrait = false;
    const size = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      portrait = w < h;
      renderer.setSize(w, h, false);
      cam.aspect = w / h;
      cam.fov = portrait ? 78 : 55;
      cam.updateProjectionMatrix();
    };
    size();
    window.addEventListener('resize', size);

    // ORBIT light rig
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const key = new THREE.DirectionalLight(0xfff0d0, 2.2);
    key.position.set(3, 4, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x9fe8ff, 0.9);
    rim.position.set(-5, -2, -4);
    scene.add(rim);
    const core = new THREE.PointLight(0xffd690, 1.6, 0, 0);
    scene.add(core);

    const dot = dotTexture();

    // ── warp stars
    const N = 1800;
    const sp = new Float32Array(N * 3);
    const sc = new Float32Array(N * 3);
    const gold = new THREE.Color(0xf4dea6);
    const teal = new THREE.Color(0x8fe9d6);
    for (let i = 0; i < N; i++) {
      const r = 2 + Math.random() * 30;
      const a = Math.random() * Math.PI * 2;
      sp.set([Math.cos(a) * r, Math.sin(a) * r, -Math.random() * 600], i * 3);
      const c = Math.random() < 0.35 ? gold : teal;
      sc.set([c.r, c.g, c.b], i * 3);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    sg.setAttribute('color', new THREE.BufferAttribute(sc, 3));
    const stars = new THREE.Points(sg, new THREE.PointsMaterial({ size: 0.5, map: dot, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true, fog: false }));
    scene.add(stars);

    // ── FOX shards
    const foxMat = foxGoldMaterial();
    const fox = new THREE.Group();
    const homes: THREE.Vector3[] = [];
    const starts: THREE.Vector3[] = [];
    foxShards().forEach((g, i) => {
      const m = new THREE.Mesh(g, foxMat);
      homes.push(new THREE.Vector3(i % 2 ? 0.06 : -0.06, 0, 0));
      const s = new THREE.Vector3((i % 2 ? 1 : -1) * (6 + Math.random() * 4), (i < 2 ? 1 : -1) * (4 + Math.random() * 3), -20 - Math.random() * 20);
      starts.push(s);
      m.position.copy(s);
      m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      fox.add(m);
    });
    fox.scale.setScalar(1.25);
    scene.add(fox);

    // ── Ω — the OMNI mark at the centre of everything
    const omegaShapes = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${OMEGA_PATH}"/></svg>`).paths.flatMap((p) => p.toShapes());
    const omegaGeo = new THREE.ExtrudeGeometry(omegaShapes, { depth: 10, bevelEnabled: true, bevelThickness: 2.5, bevelSize: 1.8, bevelSegments: 3, curveSegments: 48 });
    omegaGeo.center();
    omegaGeo.scale(0.03, -0.03, -0.03);
    const omegaMat = new THREE.MeshPhysicalMaterial({ color: 0xf0cf86, metalness: 0.78, roughness: 0.2, clearcoat: 0.9, emissive: 0xb07a22, emissiveIntensity: 0.8, transparent: true, opacity: 0 });
    const front = new THREE.PointLight(0xfff1cf, 40, 12, 1.6);
    front.position.set(0, 1.2, 4.5);
    scene.add(front);
    const omega = new THREE.Mesh(omegaGeo, omegaMat);
    scene.add(omega);

    // ── mind-sphere: gold wire + cyan synapse points + halo
    const mind = new THREE.Group();
    scene.add(mind);
    const wire = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(2.6, 3)), new THREE.LineBasicMaterial({ color: 0xd9b879, transparent: true, opacity: 0 }));
    mind.add(wire);
    const nodes = new THREE.Points(new THREE.IcosahedronGeometry(2.72, 4), new THREE.PointsMaterial({ size: 0.07, color: 0x7fe6ff, map: dot, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    mind.add(nodes);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,214,140,.9)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, fog: false }));
    halo.scale.setScalar(10);
    mind.add(halo);

    // ── ecosphere: dotted outer shell + three tilted orbital lanes carrying the symbol library
    const eco = new THREE.Group();
    eco.rotation.x = 0.22;
    scene.add(eco);
    let shellMat: THREE.PointsMaterial;
    {
      const n = 2400;
      const a = new Float32Array(n * 3);
      const ga = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < n; i++) {
        const y = 1 - (i / (n - 1)) * 2;
        const r = Math.sqrt(1 - y * y);
        a.set([Math.cos(ga * i) * r * 8.2, y * 8.2, Math.sin(ga * i) * r * 8.2], i * 3);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(a, 3));
      shellMat = new THREE.PointsMaterial({ size: 0.05, color: 0x6ad6b2, map: dot, transparent: true, opacity: 0, depthWrite: false });
      eco.add(new THREE.Points(g, shellMat));
    }
    const laneBases = LANES.map((L) => orbitBasis(L.incl, L.node));
    const laneMats = LANES.map((L, k) => {
      const m = new THREE.PointsMaterial({ size: 0.06, color: k === 1 ? 0x6ad6b2 : 0xd9b879, map: dot, transparent: true, opacity: 0, depthWrite: false });
      eco.add(new THREE.Points(dottedCircle(L.r, 220, laneBases[k].u, laneBases[k].v), m));
      return m;
    });

    const atlas = new THREE.TextureLoader().load(SYMBOL_ATLAS.src);
    atlas.colorSpace = THREE.SRGBColorSpace;
    atlas.anisotropy = 4;
    type Sat = { sprite: THREE.Sprite; lane: number; phase: number; from: THREE.Vector3; delay: number; label: HTMLElement | null };
    const sats: Sat[] = SATELLITES.map(({ node, lane }, i) => {
      const sym = SYMBOL_BY_ID[node.symbol];
      const tex = atlas.clone();
      tex.repeat.set(1 / SYMBOL_ATLAS.cols, 1 / SYMBOL_ATLAS.rows);
      tex.offset.set(sym.col / SYMBOL_ATLAS.cols, 1 - (sym.row + 1) / SYMBOL_ATLAS.rows);
      // clones share the atlas Source, so they upload automatically once the image arrives
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: LANES[lane].tint, transparent: true, opacity: 0, depthWrite: false }));
      sprite.scale.setScalar(0.001);
      sprite.name = node.id;
      eco.add(sprite);
      const phase = SATELLITES[i].phase;
      const ang = Math.random() * Math.PI * 2;
      return {
        sprite,
        lane,
        phase,
        from: new THREE.Vector3(Math.cos(ang) * 14, Math.sin(ang) * 9, -40 - Math.random() * 30),
        delay: (i / SATELLITES.length) * 1.2,
        label: labelsRef.current?.querySelector<HTMLElement>(`[data-id="${node.id}"]`) ?? null,
      };
    });

    // ── shockwave rings
    const rings = [0xd9b879, 0x6ad6b2, 0x9c6bff].map((col, i) => {
      const r = new THREE.Mesh(new THREE.TorusGeometry(3, 0.012, 6, 160), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, fog: false }));
      r.rotation.x = Math.PI / 2 + (i - 1) * 0.35;
      scene.add(r);
      return r;
    });

    const ease = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : 1 - Math.pow(1 - t, 3));
    const tmp = new THREE.Vector3();
    const world = new THREE.Vector3();
    // Preview: ?openerAt=6.5 freezes the sequence at that second (design review / screenshots).
    const freezeParam = new URLSearchParams(window.location.search).get('openerAt');
    const freezeAt = freezeParam !== null && !Number.isNaN(Number(freezeParam)) ? Number(freezeParam) : null;
    const t0 = performance.now();
    let raf = 0;
    const frame = () => {
      const t = freezeAt ?? (performance.now() - t0) / 1000;

      // warp: accelerate, then settle into slow drift
      const p = stars.geometry.attributes.position as THREE.BufferAttribute;
      const speed = t < 1.8 ? 6 + t * 30 : Math.max(1.2, 60 - (t - 1.8) * 30);
      for (let i = 0; i < N; i++) {
        p.array[i * 3 + 2] += speed * 0.16;
        if (p.array[i * 3 + 2] > 9) p.array[i * 3 + 2] = -600;
      }
      p.needsUpdate = true;
      (stars.material as THREE.PointsMaterial).size = t < 2 ? 0.5 + t * 0.4 : 1.1;

      // FOX assembles at centre (1.2 → 3.1s), then descends to sit beneath the Ω
      const a = ease((t - 1.2) / 1.9);
      fox.children.forEach((m, i) => {
        m.position.lerpVectors(starts[i], homes[i], a);
        m.rotation.x *= 1 - a * 0.12;
        m.rotation.y *= 1 - a * 0.12;
        m.rotation.z *= 1 - a * 0.12;
        if (a >= 1) m.rotation.set(0, 0, 0);
      });
      const split = ease((t - 3.3) / 1.0);
      fox.position.set(0, -split * 1.95, split * 0.9);
      fox.scale.setScalar(1.25 - split * 0.8);
      fox.rotation.y = Math.sin(t * 0.7) * 0.35 * (a >= 1 ? 1 : a);

      // Ω rises into the centre of the mind-sphere
      const o = ease((t - 3.3) / 1.2);
      omegaMat.opacity = o;
      omega.position.set(0, -1.4 + o * 1.7, -0.5 + o * 0.8);
      omega.scale.setScalar(0.4 + o * 0.6);
      omega.rotation.y = (1 - o) * Math.PI * 1.5 + Math.sin(t * 0.6) * 0.15 * o;
      omegaMat.emissiveIntensity = 0.8 + Math.max(0, Math.sin((t - 4.4) * 2.4)) * 0.5 * o;

      const b = ease((t - 2.6) / 1.2);
      (wire.material as THREE.LineBasicMaterial).opacity = b * 0.32;
      wire.scale.setScalar(0.2 + b * 0.8);
      mind.rotation.y = t * 0.22;
      mind.rotation.x = t * 0.07;
      mind.position.y = 0.3 * o;
      (nodes.material as THREE.PointsMaterial).opacity = ease((t - 3.4) / 1.2) * 0.7;
      (halo.material as THREE.SpriteMaterial).opacity = b * 0.5;
      core.position.y = 0.3 * o;

      // ecosphere: lanes draw, symbols fly in from the warp and lock into orbit
      eco.rotation.y = t * 0.06;
      eco.scale.setScalar(portrait ? 0.62 : 1);
      shellMat.opacity = ease((t - 3.6) / 1.4) * 0.35;
      laneMats.forEach((m, k) => (m.opacity = ease((t - 3.4 - k * 0.2) / 1.0) * 0.7));
      for (const s of sats) {
        const L = LANES[s.lane];
        const B = laneBases[s.lane];
        const ang = s.phase + t * L.speed;
        tmp.copy(B.u).multiplyScalar(Math.cos(ang) * L.r).addScaledVector(B.v, Math.sin(ang) * L.r);
        const k = ease((t - 3.7 - s.delay) / 1.3);
        s.sprite.position.lerpVectors(s.from, tmp, k);
        // depth cue: satellites behind the Ω dim and shrink
        s.sprite.getWorldPosition(world);
        const depth = THREE.MathUtils.clamp((world.z + L.r) / (2 * L.r), 0, 1);
        const sz = (portrait ? 1.5 : 1.05) * (0.7 + depth * 0.45);
        s.sprite.scale.setScalar(Math.max(0.001, sz * k));
        const op = k * (0.35 + depth * 0.65);
        (s.sprite.material as THREE.SpriteMaterial).opacity = op;
        if (s.label) {
          world.y -= sz * 0.62;
          world.project(cam);
          // label only the front half of each orbit so the Ω stays clear
          const show = ease((t - 4.9 - s.delay * 0.5) / 0.8) * THREE.MathUtils.smoothstep(depth, 0.5, 0.75);
          const sx = ((world.x + 1) / 2) * window.innerWidth;
          const sy = ((1 - world.y) / 2) * window.innerHeight;
          // keep labels on-screen and out of the title zone
          const inFrame = sx > 70 && sx < window.innerWidth - 70 && sy > 60 && sy < window.innerHeight * 0.66;
          s.label.style.transform = `translate(${sx}px, ${sy}px) translate(-50%, 0)`;
          s.label.style.opacity = String(world.z < 1 && inFrame ? show : 0);
        }
      }

      rings.forEach((r, i) => {
        const k = ease((t - 4.3 - i * 0.25) / 1.4);
        r.scale.setScalar(0.6 + k * 3.6);
        (r.material as THREE.MeshBasicMaterial).opacity = k > 0 && k < 1 ? (1 - k) * 0.9 : 0;
        r.rotation.z = t * 0.2;
        r.position.y = 0.3;
      });

      if (t > 5.0) setTitleIn(true);
      // camera: hold, then a slow rising pull-back that reveals the full ecosphere in 3D
      const pull = Math.max(0, t - 5.6);
      cam.position.z = (portrait ? 13 : 10.5) + pull * 1.2;
      cam.position.y = 0.6 + pull * 0.45;
      cam.position.x = Math.sin(t * 0.18) * 0.8;
      cam.lookAt(0, 0.1, 0);
      renderer.render(scene, cam);
      if (freezeAt === null && t > DURATION) {
        finish();
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape' || ev.key === ' ' || ev.key === 'Enter') {
        ev.preventDefault();
        finish();
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(bootTimer);
      window.removeEventListener('resize', size);
      window.removeEventListener('keydown', onKey);
      scene.traverse((obj) => {
        const m = obj as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as (THREE.Material & { map?: THREE.Texture | null }) | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else if (mat) {
          mat.map?.dispose();
          mat.dispose();
        }
      });
      atlas.dispose();
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`opener ${leaving ? 'out' : ''}`} role="dialog" aria-label="OMNISYNAPSE opening sequence" aria-live="polite">
      <canvas ref={canvasRef} aria-hidden="true" />
      <div className={`op-title ${titleIn ? 'in' : ''}`}>
        <div className="t1">OMNISYNAPSE</div>
        <div className="t2">FOX ECOSYSTEM · SUPERVISORY INTELLIGENCE</div>
        <div className="t3">One Mind. Infinite Connections. Continuous Evolution.</div>
      </div>
      <div className="op-labels" ref={labelsRef} aria-hidden="true">
        {SATELLITES.map(({ node, lane }) => (
          <span key={node.id} data-id={node.id} style={{ ['--c' as string]: LANES[lane].css }}>
            <b>{node.label}</b>
            <small>{SYMBOL_BY_ID[node.symbol]?.name}</small>
          </span>
        ))}
      </div>
      <div className="op-boot" aria-hidden="true">
        {boot.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
      <button className="op-skip" onClick={() => finishRef.current()}>
        SKIP ⟶
      </button>
    </div>
  );
}

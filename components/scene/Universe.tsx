'use client';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { AdaptiveDpr, Environment, Lightformer, PerformanceMonitor } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { Brain } from './Brain';
import { Altar, Beam, FoxInsignia, OmegaEmblem } from './Emblems';
import { Astrolabe } from './Astrolabe';
import { Temple } from './Temple';
import { BRAIN_CENTER, CAMERA_HOME, LOOK_HOME, focusFor } from './layout';
import { frame, getState, selectNode, setState, useUniverse } from './store';

const INTRO_SECONDS = 8;

function IntroDriver() {
  useFrame(({ clock }) => {
    const s = getState();
    if (s.introDone) {
      frame.wake = 1;
      return;
    }
    if (s.openerActive) {
      frame.wake = 0;
      frame.introStart = -1;
      return;
    }
    if (frame.introStart < 0) frame.introStart = clock.elapsedTime;
    frame.wake = Math.min(1, (clock.elapsedTime - frame.introStart) / INTRO_SECONDS);
    if (frame.wake > 0.02 && s.phase === 'DORMANT') setState({ phase: 'AWAKENING' });
    if (frame.wake >= 1) setState({ introDone: true, phase: s.selected ? 'NODE_FOCUSED' : 'TEMPLE_IDLE' });
  });
  return null;
}

/** Constrained cinematic camera: damped fly-to on selection, gentle pointer parallax at rest. */
function CameraRig() {
  const { camera, pointer, size } = useThree();
  const look = useRef(LOOK_HOME.clone());
  const selected = useUniverse((s) => s.selected);
  const target = useMemo(() => focusFor(selected), [selected]);
  const narrow = size.width < 760;
  useEffect(() => {
    if (getState().reducedMotion) {
      camera.position.copy(target.pos);
      look.current.copy(target.look);
    }
  }, [target, camera]);
  useFrame((_, dt) => {
    const s = getState();
    const pos = target.pos.clone();
    const lk = target.look.clone();
    if (!selected) {
      // intro dolly: start further back and lower
      const intro = 1 - frame.wake;
      pos.z += intro * 6;
      pos.y -= intro * 1.2;
      if (narrow) {
        pos.z += 9; // portrait: pull back to keep brain + fox in frame
        pos.y += 0.8;
        lk.y += 1.0;
      }
      if (!s.reducedMotion) {
        pos.x += pointer.x * 0.8;
        pos.y += pointer.y * 0.35;
      }
    } else if (narrow) {
      // on phones the panel is a bottom sheet: centre the subject and lift it
      pos.x -= 1.1;
      lk.x -= 1.1;
      pos.z += 3;
      lk.y -= 1.2;
    }
    const k = s.reducedMotion ? 30 : 2.2;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, pos.x, k, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, pos.y, k, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, pos.z, k, dt);
    look.current.x = THREE.MathUtils.damp(look.current.x, lk.x, k, dt);
    look.current.y = THREE.MathUtils.damp(look.current.y, lk.y, k, dt);
    look.current.z = THREE.MathUtils.damp(look.current.z, lk.z, k, dt);
    camera.lookAt(look.current);
  });
  return null;
}

function Lights() {
  const warm = useRef<THREE.PointLight>(null);
  const cool = useRef<THREE.PointLight>(null);
  useFrame(() => {
    const w = frame.wake;
    if (warm.current) warm.current.intensity = 20 * Math.min(1, w * 1.5);
    if (cool.current) cool.current.intensity = 20 * Math.min(1, w * 1.5);
  });
  return (
    <>
      <ambientLight intensity={0.12} />
      <hemisphereLight args={['#5d7fb3', '#120c06', 0.35]} />
      <pointLight ref={warm} position={[-4.5, BRAIN_CENTER.y + 1, 4]} color="#ffb768" distance={18} decay={1.6} />
      <pointLight ref={cool} position={[4.5, BRAIN_CENTER.y + 1, 4]} color="#5fc8ff" distance={18} decay={1.6} />
      <spotLight position={[0, 14, 8]} angle={0.5} penumbra={0.8} intensity={60} color="#fff1d6" castShadow={false} />
      <pointLight position={[-9, 2, 4]} color="#ffcc80" intensity={6} distance={10} />
      <pointLight position={[9, 2, 4]} color="#ffcc80" intensity={6} distance={10} />
    </>
  );
}

export default function Universe() {
  const lowPower = useUniverse((s) => s.lowPower);
  return (
    <Canvas
      dpr={[1, lowPower ? 1 : 1.75]}
      gl={{ antialias: !lowPower, powerPreference: 'high-performance', alpha: false }}
      camera={{ position: CAMERA_HOME.toArray(), fov: 42, near: 0.1, far: 400 }}
      onPointerMissed={() => selectNode(null)}
      aria-label="OMNISYNAPSE cognitive universe — 3D view. Use the navigation list for keyboard access."
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.setClearColor('#03060b');
      }}
    >
      <PerformanceMonitor onDecline={() => setState({ lowPower: true })} flipflops={2} />
      <AdaptiveDpr pixelated={false} />
      <fog attach="fog" args={['#050a12', 28, 120]} />
      <IntroDriver />
      <CameraRig />
      <Lights />
      <Suspense fallback={null}>
        <Environment resolution={128} frames={1}>
          <Lightformer form="rect" intensity={3} color="#ffe2b0" position={[0, 6, 6]} scale={[10, 3, 1]} />
          <Lightformer form="rect" intensity={2} color="#7fd6ff" position={[8, 2, 2]} scale={[3, 8, 1]} />
          <Lightformer form="rect" intensity={2} color="#ffc070" position={[-8, 2, 2]} scale={[3, 8, 1]} />
          <Lightformer form="ring" intensity={1.5} color="#ffffff" position={[0, 10, -4]} scale={4} />
        </Environment>
        <Temple lowPower={lowPower} />
        <Altar />
        <Beam />
        <Astrolabe />
        <Brain />
        <OmegaEmblem />
        <FoxInsignia />
      </Suspense>
      {!lowPower && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={0.9} luminanceThreshold={0.62} luminanceSmoothing={0.2} radius={0.75} />
          <Vignette eskil={false} offset={0.22} darkness={0.75} />
        </EffectComposer>
      )}
    </Canvas>
  );
}

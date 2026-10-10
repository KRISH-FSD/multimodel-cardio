import { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center, Html } from '@react-three/drei';
import * as THREE from 'three';
import { usePatientStore } from '../store/store';
import { AlertTriangle } from 'lucide-react';

function RealisticHeart() {
  const { scene } = useGLTF('/heart0088_coronary_arteries.glb');
  const heartGroupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (heartGroupRef.current) {
      heartGroupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
      // Gentle floating heartbeat
      const beat = Math.sin(state.clock.elapsedTime * 5) * 0.02;
      heartGroupRef.current.scale.setScalar(1 + beat);
    }
  });

  return (
    <group ref={heartGroupRef}>
      <Center scale={0.03}>
        <primitive object={scene} />
      </Center>
    </group>
  );
}

function HeartScene() {
  const { prediction } = usePatientStore();

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={2.5} color="#ffffff" />
      <directionalLight position={[-5, -10, -5]} intensity={1.5} color="#f43f5e" />
      <pointLight position={[0, 0, 0]} intensity={1} color="#3b82f6" />

      <Suspense fallback={
        <Html center>
          <div className="text-primary font-mono text-xs uppercase tracking-widest animate-pulse">Loading Anatomy...</div>
        </Html>
      }>
        <RealisticHeart />
      </Suspense>

      <OrbitControls 
        enablePan={true}
        minDistance={1}
        maxDistance={20}
        autoRotate={!prediction}
        autoRotateSpeed={1.0}
        enableDamping={true}
        dampingFactor={0.05}
      />
    </>
  );
}

export function CommandDeck() {
  return (
    <div className="w-full h-full relative bg-transparent rounded-lg overflow-hidden flex flex-col">
      <div className="absolute inset-0 z-10">
        <Canvas camera={{ position: [0, 0, 5.5], fov: 45 }} gl={{ antialias: true, alpha: true }}>
          <HeartScene />
        </Canvas>
      </div>
      
      {/* Scanline effect */}
      <div className="absolute inset-0 z-20 pointer-events-none opacity-20 bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px]" />
      
      {/* Model Limitation Warning Overlay */}
      <div className="absolute bottom-6 left-6 right-6 z-30 pointer-events-auto">
        <div className="bg-black/60 backdrop-blur-md border border-rose-500/30 p-4 rounded-xl flex gap-4 items-start shadow-2xl">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-2">
            <h3 className="text-rose-400 font-mono text-sm font-bold uppercase tracking-wide">Interactive Arteries Unavailable</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The provided <span className="font-mono text-white/70">heart0088_coronary_arteries.glb</span> model contains a single fused mesh topology. 
              To enable individual interactive selection, color-coding by model prediction, and localized feature explanations, 
              the 3D asset requires separately segmented and named geometries for the LAD, LCX, and RCA coronary arteries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Preload model
useGLTF.preload('/heart0088_coronary_arteries.glb');

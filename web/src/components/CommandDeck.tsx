import { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center, Html } from '@react-three/drei';
import * as THREE from 'three';
import { usePatientStore } from '../store/store';
import { Info } from 'lucide-react';

// Helper to create curved tubes for vessels
function VesselTube({ path, color, name, isStenotic, probability }: { path: THREE.Vector3[], color: string, name: string, isStenotic: boolean, probability?: number }) {
  const curve = new THREE.CatmullRomCurve3(path);
  const materialRef = useRef<any>(null);

  useFrame((state) => {
    if (materialRef.current) {
      if (isStenotic) {
        materialRef.current.emissiveIntensity = 2 + Math.sin(state.clock.elapsedTime * 6) * 1.5;
      } else {
        materialRef.current.emissiveIntensity = 1;
      }
    }
  });

  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 128, 0.08, 16, false]} />
        <meshPhysicalMaterial 
          ref={materialRef}
          color={color} 
          emissive={color}
          emissiveIntensity={1}
          roughness={0.1}
          metalness={0.9}
          clearcoat={1}
          clearcoatRoughness={0.1}
          transmission={0.2}
          thickness={0.5}
        />
      </mesh>
      {/* Label */}
      <Html position={path[Math.floor(path.length / 2)]} center className="pointer-events-none">
        <div className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase backdrop-blur-md border shadow-lg ${isStenotic ? 'bg-rose-500/20 border-rose-500 text-rose-400 text-glow-high' : 'bg-sky-500/10 border-sky-500/50 text-sky-400 text-glow'}`}>
          {name} {probability !== undefined ? `(${(probability * 100).toFixed(0)}%)` : ''}
        </div>
      </Html>
    </group>
  );
}

function HeartScene() {
  const { prediction } = usePatientStore();
  const heartGroupRef = useRef<THREE.Group>(null);
  
  // Load the realistic model
  const { scene } = useGLTF('/heart0088_coronary_arteries.glb');

  useFrame((state) => {
    if (heartGroupRef.current) {
      heartGroupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      // Gentle floating heartbeat
      const beat = Math.sin(state.clock.elapsedTime * 5) * 0.02;
      heartGroupRef.current.scale.setScalar(1 + beat);
    }
  });

  const getVesselColor = (vesselData: any) => {
    if (!vesselData) return '#3b82f6'; // default bright blue
    return vesselData.label === 1 ? '#f43f5e' : '#38bdf8'; // rose-500 or sky-400
  };

  // Organic looking paths (adjusted slightly for the heart)
  const ladPath = [
    new THREE.Vector3(0, 1.2, 1.1),
    new THREE.Vector3(-0.4, 0.7, 1.4),
    new THREE.Vector3(-0.8, 0, 1.3),
    new THREE.Vector3(-0.6, -1.2, 0.7),
  ];
  
  const lcxPath = [
    new THREE.Vector3(0, 1.2, 1.1),
    new THREE.Vector3(0.9, 0.9, 1.1),
    new THREE.Vector3(1.4, 0.2, 0.6),
    new THREE.Vector3(1.3, -0.8, -0.3),
  ];

  const rcaPath = [
    new THREE.Vector3(0.3, 1.2, -0.5),
    new THREE.Vector3(1.1, 0.6, -0.9),
    new THREE.Vector3(0.9, -0.4, -1.3),
    new THREE.Vector3(0.1, -1.2, -1.0),
  ];

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={2.5} color="#ffffff" />
      <directionalLight position={[-5, -10, -5]} intensity={1.5} color="#f43f5e" />
      <pointLight position={[0, 0, 0]} intensity={1} color="#3b82f6" />

      <group ref={heartGroupRef}>
        {/* Realistic Heart Model */}
        <Center scale={0.03} position={[0, 0, 0]}>
          <primitive object={scene} />
        </Center>
        
        {/* Schematic Coronary Arteries (Fallback A) */}
        <VesselTube 
          path={ladPath} 
          name="LAD" 
          color={getVesselColor(prediction?.predictions.lad)}
          isStenotic={prediction?.predictions.lad?.label === 1}
          probability={prediction?.predictions.lad?.probability}
        />
        <VesselTube 
          path={lcxPath} 
          name="LCX" 
          color={getVesselColor(prediction?.predictions.lcx)}
          isStenotic={prediction?.predictions.lcx?.label === 1}
          probability={prediction?.predictions.lcx?.probability}
        />
        <VesselTube 
          path={rcaPath} 
          name="RCA" 
          color={getVesselColor(prediction?.predictions.rca)}
          isStenotic={prediction?.predictions.rca?.label === 1}
          probability={prediction?.predictions.rca?.probability}
        />
      </group>

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
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-primary font-mono text-xs uppercase tracking-widest animate-pulse">Loading Anatomy...</div>
          </div>
        }>
          <Canvas camera={{ position: [0, 0, 5.5], fov: 45 }} gl={{ antialias: true, alpha: true }}>
            <HeartScene />
          </Canvas>
        </Suspense>
      </div>
      
      {/* Scanline effect */}
      <div className="absolute inset-0 z-20 pointer-events-none opacity-20 bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px]" />
      
      {/* Schematic warning overlay */}
      <div className="absolute bottom-6 left-6 right-6 z-30 pointer-events-none flex justify-center">
        <div className="bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex gap-3 items-center shadow-2xl">
          <Info className="w-4 h-4 text-sky-400 shrink-0" />
          <p className="text-xs text-sky-100/70 font-mono tracking-wide uppercase">
            Schematic vessel paths, not patient anatomy
          </p>
        </div>
      </div>
    </div>
  );
}

useGLTF.preload('/heart0088_coronary_arteries.glb');

import { useRef, Suspense, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center, Html } from '@react-three/drei';
import * as THREE from 'three';
import { usePatientStore } from '../store/store';
import type { HeartModel } from '../store/store';
import { Info } from 'lucide-react';

// ─── Helper: Curved tube vessels (unchanged from existing) ─────────────
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

// ─── Existing Heart Scene (preserved exactly) ──────────────────────────
function ExistingHeartScene() {
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
  );
}

// ─── Anatomical (GLB) Heart Scene ──────────────────────────────────────
// This model has 9 meshes: Veins, Hart_basis, Valves, Aorta, Avvalves,
// Ligament, Pulmonary_trunk, Heartear, Arteries2.
// NO separate LAD/LCX/RCA meshes — "Arteries2" is a single combined mesh.
// We apply overall CAD risk colouring to Arteries2 only.
function AnatomicalHeartScene() {
  const { prediction } = usePatientStore();
  const heartGroupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/anatomical_heart_-_codominance.glb');

  // Deep clone once so we can modify materials without affecting the cached original
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  // Apply risk-based colouring to the Arteries2 mesh
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;

      // Make all meshes use MeshPhysicalMaterial for consistency
      const oldMat = child.material as THREE.MeshStandardMaterial;
      
      if (child.name.includes('Arteries2')) {
        // Arteries2: colour by overall CAD risk
        const hasRisk = prediction?.predictions.cad?.label === 1;
        const prob = prediction?.predictions.cad?.probability ?? 0;
        
        // Interpolate from healthy blue (#38bdf8) to risk red (#f43f5e) via prob
        const healthyColor = new THREE.Color('#38bdf8');
        const riskColor = new THREE.Color('#f43f5e');
        const arteryColor = hasRisk != null ? healthyColor.clone().lerp(riskColor, prob) : healthyColor;

        child.material = new THREE.MeshPhysicalMaterial({
          color: arteryColor,
          emissive: arteryColor,
          emissiveIntensity: hasRisk ? 1.5 : 0.6,
          roughness: 0.2,
          metalness: 0.7,
          clearcoat: 1,
          clearcoatRoughness: 0.1,
        });
      } else if (child.name.includes('Hart_basis')) {
        child.material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#c9405a'),
          roughness: 0.5,
          metalness: 0.3,
          clearcoat: 0.3,
          map: oldMat.map || null,
          normalMap: oldMat.normalMap || null,
        });
      } else if (child.name.includes('Aorta') || child.name.includes('Pulmonary_trunk')) {
        child.material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#e06070'),
          roughness: 0.4,
          metalness: 0.4,
          clearcoat: 0.5,
          map: oldMat.map || null,
          normalMap: oldMat.normalMap || null,
        });
      } else if (child.name.includes('Veins')) {
        child.material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#4a6fa5'),
          roughness: 0.4,
          metalness: 0.3,
          clearcoat: 0.4,
          map: oldMat.map || null,
          normalMap: oldMat.normalMap || null,
        });
      } else {
        // Valves, Avvalves, Ligament, Heartear — keep a neutral tissue tone
        child.material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#c48a7c'),
          roughness: 0.6,
          metalness: 0.2,
          clearcoat: 0.2,
          map: oldMat.map || null,
          normalMap: oldMat.normalMap || null,
        });
      }
    });
  }, [clonedScene, prediction]);

  useFrame((state) => {
    if (heartGroupRef.current) {
      heartGroupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      const beat = Math.sin(state.clock.elapsedTime * 5) * 0.02;
      heartGroupRef.current.scale.setScalar(1 + beat);
    }
  });

  // CAD probability label on the arteries
  const cadProb = prediction?.predictions.cad?.probability;
  const cadLabel = prediction?.predictions.cad?.label;

  return (
    <group ref={heartGroupRef}>
      <Center scale={0.018} position={[0, 0, 0]}>
        <primitive object={clonedScene} />
      </Center>

      {/* Show overall CAD risk label near the arteries if prediction exists */}
      {cadProb !== undefined && (
        <Html position={[0, 1.8, 0]} center className="pointer-events-none">
          <div className={`px-3 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase backdrop-blur-md border shadow-lg ${cadLabel === 1 ? 'bg-rose-500/20 border-rose-500 text-rose-400 text-glow-high' : 'bg-sky-500/10 border-sky-500/50 text-sky-400 text-glow'}`}>
            CAD Risk: {(cadProb * 100).toFixed(0)}%
          </div>
        </Html>
      )}
    </group>
  );
}

// ─── Shared Lighting ───────────────────────────────────────────────────
function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={2.5} color="#ffffff" />
      <directionalLight position={[-5, -10, -5]} intensity={1.5} color="#f43f5e" />
      <pointLight position={[0, 0, 0]} intensity={1} color="#3b82f6" />
    </>
  );
}

// ─── Camera Reset Helper ───────────────────────────────────────────────
function CameraController({ selectedModel }: { selectedModel: HeartModel }) {
  const { camera } = useThree();
  const prevModel = useRef(selectedModel);

  useEffect(() => {
    if (prevModel.current !== selectedModel) {
      // Smoothly re-center camera on model switch
      camera.position.set(0, 0, 5.5);
      camera.lookAt(0, 0, 0);
      prevModel.current = selectedModel;
    }
  }, [selectedModel, camera]);

  return null;
}

// ─── Model Toggle (Segmented Control) ──────────────────────────────────
function ModelToggle() {
  const { selectedModel, setSelectedModel } = usePatientStore();

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-black/50 backdrop-blur-xl border border-white/10 shadow-2xl">
      <button
        onClick={() => setSelectedModel('existing')}
        className={`px-4 py-2 rounded-lg text-[11px] font-mono uppercase tracking-widest transition-all duration-300 cursor-pointer whitespace-nowrap ${
          selectedModel === 'existing'
            ? 'bg-primary/90 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)] font-bold'
            : 'text-white/50 hover:text-white/80 hover:bg-white/5'
        }`}
      >
        Coronary Model
      </button>
      <button
        onClick={() => setSelectedModel('glb')}
        className={`px-4 py-2 rounded-lg text-[11px] font-mono uppercase tracking-widest transition-all duration-300 cursor-pointer whitespace-nowrap ${
          selectedModel === 'glb'
            ? 'bg-primary/90 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)] font-bold'
            : 'text-white/50 hover:text-white/80 hover:bg-white/5'
        }`}
      >
        Anatomical Model
      </button>
    </div>
  );
}

// ─── Main CommandDeck ──────────────────────────────────────────────────
export function CommandDeck() {
  const { selectedModel, prediction } = usePatientStore();

  return (
    <div className="w-full h-full relative bg-transparent rounded-lg overflow-hidden flex flex-col">
      {/* Toggle Control */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
        <ModelToggle />
      </div>

      <div className="absolute inset-0 z-10">
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-primary font-mono text-xs uppercase tracking-widest animate-pulse">Loading Anatomy...</div>
          </div>
        }>
          <Canvas camera={{ position: [0, 0, 5.5], fov: 45 }} gl={{ antialias: true, alpha: true }}>
            <SceneLighting />
            <CameraController selectedModel={selectedModel} />

            {selectedModel === 'existing' ? (
              <ExistingHeartScene />
            ) : (
              <AnatomicalHeartScene />
            )}

            <OrbitControls 
              enablePan={true}
              minDistance={1}
              maxDistance={20}
              autoRotate={!prediction}
              autoRotateSpeed={1.0}
              enableDamping={true}
              dampingFactor={0.05}
            />
          </Canvas>
        </Suspense>
      </div>
      
      {/* Scanline effect */}
      <div className="absolute inset-0 z-20 pointer-events-none opacity-20 bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px]" />
      
      {/* Context-sensitive info overlay */}
      <div className="absolute bottom-6 left-6 right-6 z-30 pointer-events-none flex justify-center">
        <div className="bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex gap-3 items-center shadow-2xl">
          <Info className="w-4 h-4 text-sky-400 shrink-0" />
          <p className="text-xs text-sky-100/70 font-mono tracking-wide uppercase">
            {selectedModel === 'existing' 
              ? 'Schematic vessel paths, not patient anatomy' 
              : 'Anatomical model — arteries shown as single mesh (no individual LAD/LCX/RCA separation)'}
          </p>
        </div>
      </div>
    </div>
  );
}

useGLTF.preload('/heart0088_coronary_arteries.glb');
useGLTF.preload('/anatomical_heart_-_codominance.glb');


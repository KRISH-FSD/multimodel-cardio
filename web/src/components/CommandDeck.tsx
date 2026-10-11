import { useRef, Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center, Html } from '@react-three/drei';
import * as THREE from 'three';
import { usePatientStore } from '../store/store';
import type { HeartModel } from '../store/store';
import { Info, Play, Pause, Activity, ShieldAlert, CheckCircle2 } from 'lucide-react';

// ─── Types & Landmark Definitions ──────────────────────────────────────
interface ArteryLandmark {
  id: 'lad' | 'lcx' | 'rca';
  title: string;
  fullName: string;
  clinicalTerritory: string;
  surfacePos: [number, number, number];
  badgePos: [number, number, number];
  targetRotationY: number; // View angle to showcase this vessel
}

// Exact 3D anatomical coordinates on the codominance heart model (scaled 0.018, centered)
const ANATOMICAL_LANDMARKS: ArteryLandmark[] = [
  {
    id: 'lad',
    title: 'LAD',
    fullName: 'Left Anterior Descending',
    clinicalTerritory: 'Anterior IV sulcus • Septum & Anterior LV',
    surfacePos: [0.60, -0.88, 1.62],
    badgePos: [0.95, -0.74, 2.05],
    targetRotationY: -0.35,
  },
  {
    id: 'lcx',
    title: 'LCX',
    fullName: 'Left Circumflex Artery',
    clinicalTerritory: 'Coronary sulcus • Lateral & Posterior LV',
    surfacePos: [1.48, -0.08, 1.48],
    badgePos: [1.95, 0.06, 1.80],
    targetRotationY: -0.85,
  },
  {
    id: 'rca',
    title: 'RCA',
    fullName: 'Right Coronary Artery',
    clinicalTerritory: 'Right AV groove • Inferior LV & Nodes',
    surfacePos: [-0.95, -0.65, 2.15],
    badgePos: [-1.45, -0.52, 2.50],
    targetRotationY: 0.45,
  },
];

// ─── 3D Glowing Leader Stem ────────────────────────────────────────────
function LeaderStem({ start, end, color }: { start: [number, number, number]; end: [number, number, number]; color: string }) {
  const lineObj = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const vertices = new Float32Array([...start, ...end]);
    geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.65 });
    return new THREE.Line(geom, mat);
  }, [start, end, color]);

  return <primitive object={lineObj} />;
}

// ─── 3D Pulsing Sonar Ring on Artery Surface ───────────────────────────
function BeaconRing({ position, color, isStenotic }: { position: [number, number, number]; color: string; isStenotic: boolean }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    if (ringRef.current && matRef.current) {
      const speed = isStenotic ? 5.0 : 2.5;
      const cycle = (state.clock.elapsedTime * speed) % 2;
      const prog = cycle / 2;
      const scale = 1 + prog * 2.4;
      ringRef.current.scale.set(scale, scale, scale);
      matRef.current.opacity = Math.max(0, (1 - prog) * 0.85);
    }
  });

  return (
    <mesh ref={ringRef} position={position}>
      <ringGeometry args={[0.03, 0.065, 32]} />
      <meshBasicMaterial ref={matRef} color={color} transparent side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

// ─── Medical HUD Vessel Pin Component ──────────────────────────────────
function AnatomicalVesselPin({
  landmark,
  predictionData,
  isSelected,
  onSelect,
  isVisible = true,
}: {
  landmark: ArteryLandmark;
  predictionData?: { label?: number; probability?: number };
  isSelected: boolean;
  onSelect: () => void;
  isVisible?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const badgeDomRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const isStenotic = predictionData?.label === 1;
  const hasPrediction = predictionData?.probability !== undefined;
  const probPercent = hasPrediction ? (predictionData.probability! * 100).toFixed(1) : null;

  // Color scheme: Rose for stenotic risk, Cyan/Sky for clear, Blue for baseline
  const themeColor = !hasPrediction
    ? '#38bdf8'
    : isStenotic
    ? '#f43f5e'
    : '#06b6d4';

  // Smoothly fade badge when rotating behind the heart
  useFrame(() => {
    if (groupRef.current && badgeDomRef.current && badgeDomRef.current.isConnected) {
      if (!isVisible) {
        badgeDomRef.current.style.display = 'none';
        return;
      }
      badgeDomRef.current.style.display = 'block';
      const worldPos = new THREE.Vector3();
      groupRef.current.getWorldPosition(worldPos);
      const faceFactor = (worldPos.z + 0.4) / 1.8;
      const clamped = Math.max(0.15, Math.min(1.0, faceFactor));
      badgeDomRef.current.style.opacity = clamped.toFixed(2);
      badgeDomRef.current.style.pointerEvents = clamped > 0.4 ? 'auto' : 'none';
    }
  });

  if (!isVisible) return null;

  return (
    <group ref={groupRef}>
      {/* 1. Surface glowing anchor bead */}
      <mesh position={landmark.surfacePos}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshBasicMaterial color={themeColor} />
      </mesh>

      {/* 2. Expanding radar ripple ring */}
      <BeaconRing position={landmark.surfacePos} color={themeColor} isStenotic={isStenotic} />

      {/* 3. 3D connector leader line */}
      <LeaderStem start={landmark.surfacePos} end={landmark.badgePos} color={themeColor} />

      {/* 4. Floating HUD Glassmorphism Badge */}
      <Html position={landmark.badgePos} center distanceFactor={7} zIndexRange={[100, 0]}>
        <div
          ref={badgeDomRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className={`cursor-pointer transition-all duration-300 select-none ${
            isHovered || isSelected ? 'scale-105 z-50' : 'scale-95'
          }`}
        >
          <div
            className={`flex flex-col gap-1 p-2 rounded-xl backdrop-blur-xl border shadow-2xl transition-all duration-300 min-w-[110px] ${
              isStenotic
                ? 'bg-rose-950/85 border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.35)]'
                : 'bg-slate-950/85 border-sky-500/50 shadow-[0_0_18px_rgba(56,189,248,0.25)]'
            }`}
          >
            {/* Header row: Status LED + Code + Risk status */}
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isStenotic ? 'bg-rose-400' : 'bg-sky-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      isStenotic ? 'bg-rose-500' : 'bg-sky-400'
                    }`}
                  />
                </span>

                <span className="font-mono font-bold text-xs tracking-wider text-white">
                  {landmark.title}
                </span>
              </div>

              {hasPrediction && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider ${
                    isStenotic
                      ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {isStenotic ? 'Stenosis' : 'Clear'}
                </span>
              )}
            </div>

            {/* Probability Value */}
            <div className="flex items-baseline justify-between gap-2 font-mono">
              <span className="text-[9px] text-white/50 uppercase">Risk</span>
              <span
                className={`text-xs font-bold ${
                  hasPrediction
                    ? isStenotic
                      ? 'text-rose-400 text-glow-high'
                      : 'text-sky-300 text-glow'
                    : 'text-sky-400/80 text-[10px]'
                }`}
              >
                {hasPrediction ? `${probPercent}%` : 'Standby'}
              </span>
            </div>

            {/* Mini Progress Bar */}
            {hasPrediction && (
              <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mt-0.5">
                <div
                  className={`h-full transition-all duration-700 ${
                    isStenotic
                      ? 'bg-gradient-to-r from-rose-500 to-rose-400'
                      : 'bg-gradient-to-r from-sky-500 to-cyan-400'
                  }`}
                  style={{ width: `${probPercent}%` }}
                />
              </div>
            )}

            {/* Expanded Tooltip Details on Hover or Select */}
            {(isHovered || isSelected) && (
              <div className="pt-1.5 mt-1 border-t border-white/10 text-[9px] font-mono text-white/80 max-w-[150px] leading-tight">
                <p className="font-semibold text-white/95">{landmark.fullName}</p>
                <p className="text-white/60 text-[8px] mt-0.5">{landmark.clinicalTerritory}</p>
              </div>
            )}
          </div>
        </div>
      </Html>
    </group>
  );
}

// ─── Existing Heart Scene (Coronary Model) ─────────────────────────────
function ExistingHeartScene({
  isRotating,
  targetRotationY,
}: {
  isRotating: boolean;
  targetRotationY: number | null;
}) {
  const { prediction } = usePatientStore();
  const heartGroupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/heart0088_coronary_arteries.glb');

  useFrame((state, delta) => {
    if (heartGroupRef.current) {
      if (targetRotationY !== null) {
        heartGroupRef.current.rotation.y = THREE.MathUtils.lerp(
          heartGroupRef.current.rotation.y,
          targetRotationY,
          delta * 3.5
        );
      } else if (isRotating) {
        heartGroupRef.current.rotation.y += delta * 0.35;
      }
      const beat = Math.sin(state.clock.elapsedTime * 5) * 0.02;
      heartGroupRef.current.scale.setScalar(1 + beat);
    }
  });

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

  const getVesselColor = (vesselData: any) => {
    if (!vesselData) return '#38bdf8';
    return vesselData.label === 1 ? '#f43f5e' : '#38bdf8';
  };

  return (
    <group ref={heartGroupRef}>
      <Center scale={0.03} position={[0, 0, 0]}>
        <primitive object={scene} />
      </Center>

      {/* Schematic Splines */}
      <VesselTube path={ladPath} name="LAD" color={getVesselColor(prediction?.predictions.lad)} isStenotic={prediction?.predictions.lad?.label === 1} probability={prediction?.predictions.lad?.probability} />
      <VesselTube path={lcxPath} name="LCX" color={getVesselColor(prediction?.predictions.lcx)} isStenotic={prediction?.predictions.lcx?.label === 1} probability={prediction?.predictions.lcx?.probability} />
      <VesselTube path={rcaPath} name="RCA" color={getVesselColor(prediction?.predictions.rca)} isStenotic={prediction?.predictions.rca?.label === 1} probability={prediction?.predictions.rca?.probability} />
    </group>
  );
}

function VesselTube({ path, color, name, isStenotic, probability }: { path: THREE.Vector3[]; color: string; name: string; isStenotic: boolean; probability?: number }) {
  const curve = new THREE.CatmullRomCurve3(path);
  const materialRef = useRef<any>(null);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = isStenotic
        ? 2 + Math.sin(state.clock.elapsedTime * 6) * 1.5
        : 1;
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
      <Html position={path[Math.floor(path.length / 2)]} center className="pointer-events-none select-none">
        <div className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase backdrop-blur-md border shadow-lg ${isStenotic ? 'bg-rose-500/20 border-rose-500 text-rose-400 text-glow-high' : 'bg-sky-500/10 border-sky-500/50 text-sky-400 text-glow'}`}>
          {name} {probability !== undefined ? `(${(probability * 100).toFixed(0)}%)` : ''}
        </div>
      </Html>
    </group>
  );
}

// ─── Anatomical (GLB) Heart Scene with Pinpoint Vessel Markers ───────────
function AnatomicalHeartScene({
  isRotating,
  targetRotationY,
  selectedVessel,
  setSelectedVessel,
  isVisible = true,
}: {
  isRotating: boolean;
  targetRotationY: number | null;
  selectedVessel: string | null;
  setSelectedVessel: (vessel: string | null) => void;
  isVisible?: boolean;
}) {
  const { prediction } = usePatientStore();
  const heartGroupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/anatomical_heart_-_codominance.glb');

  // Deep clone once so we can modify materials without affecting the cached original
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  // Apply risk-based colouring to the Arteries2 mesh
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const oldMat = child.material as THREE.MeshStandardMaterial;

      if (child.name.includes('Arteries2')) {
        const hasRisk = prediction?.predictions.cad?.label === 1;
        const prob = prediction?.predictions.cad?.probability ?? 0;
        const healthyColor = new THREE.Color('#38bdf8');
        const riskColor = new THREE.Color('#f43f5e');
        const arteryColor = hasRisk != null ? healthyColor.clone().lerp(riskColor, prob) : healthyColor;

        child.material = new THREE.MeshPhysicalMaterial({
          color: arteryColor,
          emissive: arteryColor,
          emissiveIntensity: hasRisk ? 1.6 : 0.7,
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

  // Smooth rotation: either lerp towards targeted camera view, or gentle auto-spin
  useFrame((state, delta) => {
    if (heartGroupRef.current) {
      if (targetRotationY !== null) {
        heartGroupRef.current.rotation.y = THREE.MathUtils.lerp(
          heartGroupRef.current.rotation.y,
          targetRotationY,
          delta * 4.0
        );
      } else if (isRotating) {
        heartGroupRef.current.rotation.y += delta * 0.35;
      }
      const beat = Math.sin(state.clock.elapsedTime * 5) * 0.02;
      heartGroupRef.current.scale.setScalar(1 + beat);
    }
  });

  // CAD probability & label
  const cadProb = prediction?.predictions.cad?.probability;
  const cadLabel = prediction?.predictions.cad?.label;

  return (
    <group ref={heartGroupRef}>
      {/* Centered realistic anatomical 3D heart */}
      <Center scale={0.018} position={[0, 0, 0]}>
        <primitive object={clonedScene} />
      </Center>

      {/* ─── 3 Exact Anatomical Vessel Pins (LAD, LCX, RCA) ─── */}
      {ANATOMICAL_LANDMARKS.map((landmark) => (
        <AnatomicalVesselPin
          key={landmark.id}
          landmark={landmark}
          predictionData={prediction?.predictions[landmark.id]}
          isSelected={selectedVessel === landmark.id}
          onSelect={() => setSelectedVessel(selectedVessel === landmark.id ? null : landmark.id)}
          isVisible={isVisible}
        />
      ))}

      {/* Sleek Top Crown Badge: CAD Overall Risk above aortic arch */}
      {isVisible && cadProb !== undefined && (
        <Html position={[0, 2.85, 0]} center className="pointer-events-none select-none">
          <div
            className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest backdrop-blur-xl border shadow-2xl flex items-center gap-2 ${
              cadLabel === 1
                ? 'bg-rose-950/80 border-rose-500/60 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
            }`}
          >
            {cadLabel === 1 ? (
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>CAD RISK: {(cadProb * 100).toFixed(1)}%</span>
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
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 10, 5]} intensity={2.6} color="#ffffff" />
      <directionalLight position={[-5, -10, -5]} intensity={1.5} color="#f43f5e" />
      <pointLight position={[0, 0, 0]} intensity={1.2} color="#38bdf8" />
    </>
  );
}

// ─── Camera Reset Helper ───────────────────────────────────────────────
function CameraController({ selectedModel }: { selectedModel: HeartModel }) {
  const { camera } = useThree();
  const prevModel = useRef(selectedModel);

  useEffect(() => {
    if (prevModel.current !== selectedModel) {
      camera.position.set(0, 0, 5.5);
      camera.lookAt(0, 0, 0);
      prevModel.current = selectedModel;
    }
  }, [selectedModel, camera]);

  return null;
}

// ─── Model Segmented Control Toggle ────────────────────────────────────
function ModelToggle() {
  const { selectedModel, setSelectedModel } = usePatientStore();

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl">
      <button
        onClick={() => setSelectedModel('existing')}
        className={`px-3.5 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all duration-300 cursor-pointer whitespace-nowrap ${
          selectedModel === 'existing'
            ? 'bg-primary text-white shadow-[0_0_14px_rgba(59,130,246,0.5)] font-bold'
            : 'text-white/60 hover:text-white/90 hover:bg-white/5'
        }`}
      >
        Coronary Model
      </button>
      <button
        onClick={() => setSelectedModel('glb')}
        className={`px-3.5 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all duration-300 cursor-pointer whitespace-nowrap ${
          selectedModel === 'glb'
            ? 'bg-primary text-white shadow-[0_0_14px_rgba(59,130,246,0.5)] font-bold'
            : 'text-white/60 hover:text-white/90 hover:bg-white/5'
        }`}
      >
        Anatomical Model
      </button>
    </div>
  );
}

// ─── Main CommandDeck Component ────────────────────────────────────────
export function CommandDeck() {
  const { selectedModel } = usePatientStore();
  const [isRotating, setIsRotating] = useState(true);
  const [targetRotationY, setTargetRotationY] = useState<number | null>(null);
  const [selectedVessel, setSelectedVessel] = useState<string | null>(null);

  // Focus on vessel handler
  const handleFocus = (angle: number | null, vesselKey: string | null) => {
    setTargetRotationY(angle);
    setSelectedVessel(vesselKey);
    if (angle !== null) {
      setIsRotating(false); // Pause auto-spin when inspecting specific vessel
    }
  };

  return (
    <div className="w-full h-full relative bg-transparent rounded-lg overflow-hidden flex flex-col">
      {/* Top Unified Header: Left Badge, Center Model Toggle, Right Quick Views */}
      <div className="absolute top-3.5 left-4 right-4 z-30 flex items-center justify-between gap-2 pointer-events-none select-none">
        {/* Left: Section Indicator */}
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-widest text-primary text-glow flex items-center gap-2 pointer-events-auto shrink-0 shadow-lg">
          <Activity className="w-3.5 h-3.5 text-primary animate-pulse" />
          <span className="hidden sm:inline">Coronary Topography</span>
        </div>

        {/* Center: Model Toggle */}
        <div className="pointer-events-auto shrink-0">
          <ModelToggle />
        </div>

        {/* Right: Quick View Presets (LAD / LCX / RCA / All) */}
        <div className="pointer-events-auto shrink-0 flex items-center gap-1 bg-black/60 backdrop-blur-xl border border-white/10 p-1 rounded-xl shadow-2xl">
          <button
            onClick={() => handleFocus(0, null)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              targetRotationY === 0 && selectedVessel === null
                ? 'bg-white/20 text-white font-bold'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
            title="Front Anterior View"
          >
            Front
          </button>
          <button
            onClick={() => handleFocus(-0.35, 'lad')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              selectedVessel === 'lad'
                ? 'bg-sky-500/30 text-sky-300 font-bold border border-sky-500/40'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
            title="Focus on LAD (Left Anterior Descending)"
          >
            LAD
          </button>
          <button
            onClick={() => handleFocus(-0.85, 'lcx')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              selectedVessel === 'lcx'
                ? 'bg-sky-500/30 text-sky-300 font-bold border border-sky-500/40'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
            title="Focus on LCX (Left Circumflex Artery)"
          >
            LCX
          </button>
          <button
            onClick={() => handleFocus(0.45, 'rca')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              selectedVessel === 'rca'
                ? 'bg-sky-500/30 text-sky-300 font-bold border border-sky-500/40'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
            title="Focus on RCA (Right Coronary Artery)"
          >
            RCA
          </button>
          <div className="w-px h-4 bg-white/10 mx-0.5" />
          <button
            onClick={() => {
              setIsRotating(!isRotating);
              setTargetRotationY(null);
            }}
            className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            title={isRotating ? 'Pause Rotation' : 'Resume Auto-Rotation'}
          >
            {isRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-sky-400" />}
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas */}
      <div className="absolute inset-0 z-10">
        <Suspense
          fallback={
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <Activity className="w-7 h-7 text-primary animate-pulse" />
              <div className="text-primary font-mono text-xs uppercase tracking-widest animate-pulse">
                Initializing Coronary Anatomy...
              </div>
            </div>
          }
        >
          <Canvas camera={{ position: [0, 0, 5.5], fov: 45 }} gl={{ antialias: true, alpha: true }}>
            <SceneLighting />
            <CameraController selectedModel={selectedModel} />

            {/* Persistent group rendering to prevent React 19 unmount race conditions */}
            <group visible={selectedModel === 'existing'}>
              <ExistingHeartScene
                isRotating={isRotating && selectedModel === 'existing'}
                targetRotationY={targetRotationY}
              />
            </group>

            <group visible={selectedModel === 'glb'}>
              <AnatomicalHeartScene
                isRotating={isRotating && selectedModel === 'glb'}
                targetRotationY={targetRotationY}
                selectedVessel={selectedVessel}
                setSelectedVessel={setSelectedVessel}
                isVisible={selectedModel === 'glb'}
              />
            </group>

            <OrbitControls
              enablePan={true}
              minDistance={1.2}
              maxDistance={18}
              enableDamping={true}
              dampingFactor={0.05}
              onChange={() => {
                // If user drags to rotate manually, release targeted lock
                if (targetRotationY !== null) {
                  setTargetRotationY(null);
                }
              }}
            />
          </Canvas>
        </Suspense>
      </div>

      {/* Scanline CRT overlay effect */}
      <div className="absolute inset-0 z-20 pointer-events-none opacity-15 bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px]" />

      {/* Bottom Footer Info Bar */}
      <div className="absolute bottom-5 left-6 right-6 z-30 pointer-events-none flex justify-center">
        <div className="bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex gap-2.5 items-center shadow-2xl">
          <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <p className="text-[11px] text-sky-100/70 font-mono tracking-wide">
            {selectedModel === 'existing'
              ? 'Schematic vessel paths • Toggle to Anatomical Model for realistic 3D topography'
              : 'Interactive 3D Coronary Topology • Exact anatomical anchors mapped for LAD, LCX & RCA'}
          </p>
        </div>
      </div>
    </div>
  );
}

useGLTF.preload('/heart0088_coronary_arteries.glb');
useGLTF.preload('/anatomical_heart_-_codominance.glb');

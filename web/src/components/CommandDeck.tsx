import { useRef, Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center, Html } from '@react-three/drei';
import * as THREE from 'three';
import { usePatientStore } from '../store/store';
import type { HeartModel } from '../store/store';
import {
  RotateCcw,
  Layers,
  BookOpen,
  Network,
  Box,
  MousePointerClick,
  RotateCw,
  ZoomIn,
  Activity,
  Maximize2,
  HeartPulse,
} from 'lucide-react';

// ─── Artery Pathway & Anatomical Landmark Definitions ─────────────────────
export interface ArteryPathway {
  id: 'lad' | 'lcx' | 'rca';
  title: string;
  fullName: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  cardBorder: string;
  surfacePos: [number, number, number];
  arrowDir: [number, number, number];
  splinePoints: [number, number, number][];
}

export const ARTERY_DATA: ArteryPathway[] = [
  {
    id: 'rca',
    title: 'RCA',
    fullName: 'Right Coronary Artery',
    color: '#3b82f6', // Apple Blue
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    cardBorder: 'border-blue-200/90',
    surfacePos: [-0.60, 0.05, 1.95],
    arrowDir: [0.35, -0.15, -0.2],
    splinePoints: [
      [-0.50, 0.35, 1.95],
      [-0.58, 0.10, 1.95],
      [-0.60, 0.05, 1.95],
      [-0.65, -0.35, 1.70],
      [-0.78, -0.80, 2.30],
      [-0.85, -1.10, 2.35],
      [-1.15, -1.50, 2.20],
      [-1.08, -1.85, 2.10],
    ],
  },
  {
    id: 'lcx',
    title: 'LCX',
    fullName: 'Left Circumflex Artery',
    color: '#0d9488', // Apple Teal
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-700',
    badgeBorder: 'border-teal-200',
    cardBorder: 'border-teal-200/90',
    surfacePos: [1.32, -0.05, 1.55],
    arrowDir: [-0.35, -0.15, -0.15],
    splinePoints: [
      [0.98, 0.30, 1.12],
      [1.08, 0.20, 1.25],
      [1.32, -0.05, 1.55],
      [1.48, -0.30, 1.55],
      [1.65, -0.65, 1.68],
      [1.60, -0.92, 1.85],
    ],
  },
  {
    id: 'lad',
    title: 'LAD',
    fullName: 'Left Anterior Descending Artery',
    color: '#ef4444', // Apple Coral/Red
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200',
    cardBorder: 'border-rose-200/90',
    surfacePos: [0.58, -0.65, 1.52],
    arrowDir: [-0.4, -0.2, -0.2],
    splinePoints: [
      [0.78, 0.35, 1.15],
      [0.71, 0.21, 1.20],
      [0.65, -0.25, 1.40],
      [0.58, -0.65, 1.52],
      [0.40, -1.15, 1.95],
      [0.30, -1.65, 2.05],
      [0.20, -2.10, 2.20],
      [0.13, -2.35, 2.37],
    ],
  },
];

// ─── 1. Animated Flowing Blood Particles along Artery Paths ───────────────
function ArteryAnimatedFlow({
  artery,
  isSelected,
  onSelect,
  isVisible = true,
}: {
  artery: ArteryPathway;
  isSelected: boolean;
  onSelect: () => void;
  isVisible?: boolean;
}) {
  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3(artery.splinePoints.map((p) => new THREE.Vector3(...p)));
  }, [artery.splinePoints]);

  const p1Ref = useRef<THREE.Mesh>(null);
  const p2Ref = useRef<THREE.Mesh>(null);
  const p3Ref = useRef<THREE.Mesh>(null);
  const p4Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const speed = isSelected ? 0.45 : 0.22;
    const time = state.clock.elapsedTime * speed;
    const refs = [p1Ref, p2Ref, p3Ref, p4Ref];
    refs.forEach((ref, idx) => {
      if (ref.current) {
        const t = (time + idx * 0.25) % 1;
        ref.current.position.copy(curve.getPointAt(t));
      }
    });
  });

  if (!isVisible) return null;

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className="cursor-pointer"
    >
      {/* Translucent Glowing Guide Tube */}
      <mesh>
        <tubeGeometry args={[curve, 64, isSelected ? 0.026 : 0.018, 8, false]} />
        <meshStandardMaterial
          color={artery.color}
          emissive={artery.color}
          emissiveIntensity={isSelected ? 1.1 : 0.55}
          roughness={0.25}
          metalness={0.3}
          transparent
          opacity={isSelected ? 0.95 : 0.8}
        />
      </mesh>

      {/* 4 Animated Flowing Blood-Pulse Beads */}
      <mesh ref={p1Ref}>
        <sphereGeometry args={[0.038, 14, 14]} />
        <meshStandardMaterial color="#ffffff" emissive={artery.color} emissiveIntensity={2.0} />
      </mesh>
      <mesh ref={p2Ref}>
        <sphereGeometry args={[0.038, 14, 14]} />
        <meshStandardMaterial color="#ffffff" emissive={artery.color} emissiveIntensity={2.0} />
      </mesh>
      <mesh ref={p3Ref}>
        <sphereGeometry args={[0.038, 14, 14]} />
        <meshStandardMaterial color="#ffffff" emissive={artery.color} emissiveIntensity={2.0} />
      </mesh>
      <mesh ref={p4Ref}>
        <sphereGeometry args={[0.038, 14, 14]} />
        <meshStandardMaterial color="#ffffff" emissive={artery.color} emissiveIntensity={2.0} />
      </mesh>
    </group>
  );
}

// ─── 2. 3D Surface Glow Beacon on Vessel ──────────────────────────────────
function SurfaceGlowBeacon({
  surfacePos,
  color,
  isSelected,
  isVisible = true,
}: {
  surfacePos: [number, number, number];
  color: string;
  isSelected: boolean;
  isVisible?: boolean;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  const ringMatRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const t = (time * (isSelected ? 2.5 : 1.5)) % 1;
    if (ringRef.current) {
      ringRef.current.scale.setScalar(1 + t * 2.2);
    }
    if (ringMatRef.current) {
      ringMatRef.current.opacity = 0.85 * (1 - t);
    }
  });

  if (!isVisible) return null;

  return (
    <group position={surfacePos}>
      {/* 3D Core Sphere Dot */}
      <mesh>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 1.6 : 1.0}
          roughness={0.1}
        />
      </mesh>

      {/* Pulsing Ripple Disk */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.04, 0.08, 32]} />
        <meshBasicMaterial
          ref={ringMatRef}
          color={color}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ─── 3. Screen Projection Tracker for 60fps Dynamic Leader Lines ──────────
function DynamicScreenTracker({
  containerRef,
  heartGroupRef,
  cardRefs,
  lineRefs,
  pinRefs,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  heartGroupRef: React.RefObject<THREE.Group | null>;
  cardRefs: { [key: string]: React.RefObject<HTMLDivElement | null> };
  lineRefs: { [key: string]: React.RefObject<SVGLineElement | null> };
  pinRefs: { [key: string]: React.RefObject<SVGGElement | null> };
}) {
  const { camera } = useThree();

  useFrame(() => {
    if (!containerRef.current || !heartGroupRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    if (containerRect.width === 0 || containerRect.height === 0) return;

    ARTERY_DATA.forEach((artery) => {
      // 1. Convert local surface landmark to world coordinate
      const localPt = new THREE.Vector3(...artery.surfacePos);
      const worldPt = localPt.applyMatrix4(heartGroupRef.current!.matrixWorld);

      // 2. Project 3D point to 2D container screen space
      const projected = worldPt.clone().project(camera);
      const targetX = (projected.x * 0.5 + 0.5) * containerRect.width;
      const targetY = (-projected.y * 0.5 + 0.5) * containerRect.height;
      const isFacing = projected.z < 1.0;

      // 3. Measure card connector position
      const cardEl = cardRefs[artery.id]?.current;
      let cardX = targetX;
      let cardY = targetY;
      if (cardEl) {
        const cardRect = cardEl.getBoundingClientRect();
        // RCA card is on the left -> connects from right edge
        // LCX & LAD cards are on the right -> connect from left edge
        cardX =
          artery.id === 'rca'
            ? cardRect.right - containerRect.left
            : cardRect.left - containerRect.left;
        cardY = cardRect.top + cardRect.height / 2 - containerRect.top;
      }

      // 4. Update SVG leader line
      const lineEl = lineRefs[artery.id]?.current;
      if (lineEl) {
        lineEl.setAttribute('x1', `${cardX}`);
        lineEl.setAttribute('y1', `${cardY}`);
        lineEl.setAttribute('x2', `${targetX}`);
        lineEl.setAttribute('y2', `${targetY}`);
        lineEl.style.opacity = isFacing ? '1' : '0.2';
      }

      // 5. Update SVG target pin position
      const pinEl = pinRefs[artery.id]?.current;
      if (pinEl) {
        pinEl.setAttribute('transform', `translate(${targetX}, ${targetY})`);
        pinEl.style.opacity = isFacing ? '1' : '0.2';
      }
    });
  });

  return null;
}

// ─── Existing Heart Scene (Coronary Model Fallback) ───────────────────────
function ExistingHeartScene({
  isRotating,
  targetRotationY,
  isVisible = true,
}: {
  isRotating: boolean;
  targetRotationY: number | null;
  isVisible?: boolean;
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
        heartGroupRef.current.rotation.y += delta * 0.25;
      }
      const beat = Math.sin(state.clock.elapsedTime * 4) * 0.015;
      heartGroupRef.current.scale.setScalar(1 + beat);
    }
  });

  if (!isVisible) return null;

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
      <Center scale={0.03} position={[0, 0, 0]}>
        <primitive object={scene} />
      </Center>

      <VesselTube
        path={ladPath}
        name="LAD"
        color="#ef4444"
        probability={prediction?.predictions?.lad?.probability ?? 0.378}
        isVisible={isVisible}
      />
      <VesselTube
        path={lcxPath}
        name="LCX"
        color="#0d9488"
        probability={prediction?.predictions?.lcx?.probability ?? 0.186}
        isVisible={isVisible}
      />
      <VesselTube
        path={rcaPath}
        name="RCA"
        color="#3b82f6"
        probability={prediction?.predictions?.rca?.probability ?? 0.353}
        isVisible={isVisible}
      />
    </group>
  );
}

function VesselTube({
  path,
  color,
  name,
  probability,
  isVisible = true,
}: {
  path: THREE.Vector3[];
  color: string;
  name: string;
  probability?: number;
  isVisible?: boolean;
}) {
  const curve = new THREE.CatmullRomCurve3(path);

  if (!isVisible) return null;

  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 128, 0.07, 16, false]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.5}
        />
      </mesh>
      <Html
        position={path[Math.floor(path.length / 2)]}
        center
        className="pointer-events-none select-none"
      >
        <div className="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-md border border-slate-200 text-slate-800">
          {name} {probability !== undefined ? `(${(probability * 100).toFixed(1)}%)` : ''}
        </div>
      </Html>
    </group>
  );
}

// ─── Anatomical Heart 3D Model Scene ──────────────────────────────────────
function AnatomicalHeartScene({
  isRotating,
  targetRotationY,
  selectedVessel,
  setSelectedVessel,
  heartGroupRef,
  isVisible = true,
}: {
  isRotating: boolean;
  targetRotationY: number | null;
  selectedVessel: string | null;
  setSelectedVessel: (vessel: string | null) => void;
  heartGroupRef: React.RefObject<THREE.Group | null>;
  isVisible?: boolean;
}) {
  const { scene } = useGLTF('/anatomical_heart_-_codominance.glb');
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    clonedScene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const oldMat = child.material as THREE.MeshStandardMaterial;

      if (child.name.includes('Arteries2')) {
        child.material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#38bdf8'),
          emissive: new THREE.Color('#0284c7'),
          emissiveIntensity: 0.8,
          roughness: 0.25,
          metalness: 0.5,
          clearcoat: 0.8,
        });
      } else if (child.name.includes('Hart_basis')) {
        child.material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#bd283c'),
          roughness: 0.45,
          metalness: 0.2,
          clearcoat: 0.35,
          map: oldMat.map || null,
          normalMap: oldMat.normalMap || null,
        });
      } else if (child.name.includes('Aorta') || child.name.includes('Pulmonary_trunk')) {
        child.material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#c53b4e'),
          roughness: 0.4,
          metalness: 0.3,
          clearcoat: 0.4,
          map: oldMat.map || null,
          normalMap: oldMat.normalMap || null,
        });
      } else if (child.name.includes('Veins')) {
        child.material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#3b6495'),
          roughness: 0.45,
          metalness: 0.25,
          clearcoat: 0.3,
          map: oldMat.map || null,
          normalMap: oldMat.normalMap || null,
        });
      } else {
        child.material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#c99285'),
          roughness: 0.55,
          metalness: 0.15,
          clearcoat: 0.2,
          map: oldMat.map || null,
          normalMap: oldMat.normalMap || null,
        });
      }
    });
  }, [clonedScene]);

  useFrame((state, delta) => {
    if (heartGroupRef.current) {
      if (targetRotationY !== null) {
        heartGroupRef.current.rotation.y = THREE.MathUtils.lerp(
          heartGroupRef.current.rotation.y,
          targetRotationY,
          delta * 4.0
        );
      } else if (isRotating) {
        heartGroupRef.current.rotation.y += delta * 0.25;
      }
      const beat = Math.sin(state.clock.elapsedTime * 4) * 0.015;
      heartGroupRef.current.scale.setScalar(1 + beat);
    }
  });

  return (
    <group ref={heartGroupRef} rotation={[0, 0, 0]}>
      <Center scale={0.018} position={[0, 0, 0]}>
        <primitive object={clonedScene} />
      </Center>

      {/* 3D Animated Flow Paths along LAD, LCX, RCA */}
      {ARTERY_DATA.map((artery) => (
        <ArteryAnimatedFlow
          key={`flow-${artery.id}`}
          artery={artery}
          isSelected={selectedVessel === artery.id}
          onSelect={() => {
            const next = selectedVessel === artery.id ? null : artery.id;
            setSelectedVessel(next);
          }}
          isVisible={isVisible}
        />
      ))}

      {/* 3D Surface Glow Beacons at each artery landmark */}
      {ARTERY_DATA.map((artery) => (
        <SurfaceGlowBeacon
          key={`beacon-${artery.id}`}
          surfacePos={artery.surfacePos}
          color={artery.color}
          isSelected={selectedVessel === artery.id}
          isVisible={isVisible}
        />
      ))}
    </group>
  );
}

// ─── Crisp Medical Studio Lighting ─────────────────────────────────────
function SceneLighting() {
  return (
    <>
      <ambientLight intensity={1.15} />
      <directionalLight position={[6, 12, 8]} intensity={2.2} color="#ffffff" />
      <directionalLight position={[-6, -8, -6]} intensity={0.7} color="#f87171" />
      <directionalLight position={[-4, 8, -4]} intensity={1.1} color="#93c5fd" />
    </>
  );
}

// ─── Camera Controller ─────────────────────────────────────────────────
function CameraController({ selectedModel }: { selectedModel: HeartModel }) {
  const { camera } = useThree();
  const prevModel = useRef(selectedModel);

  useEffect(() => {
    if (prevModel.current !== selectedModel) {
      if (selectedModel === 'glb') {
        camera.position.set(0, -0.2, 9.8);
      } else {
        camera.position.set(0, 0, 4.5);
      }
      camera.lookAt(0, -0.2, 0);
      prevModel.current = selectedModel;
    }
  }, [selectedModel, camera]);

  return null;
}

// ─── Main CommandDeck Viewport ─────────────────────────────────────────
export function CommandDeck() {
  const { selectedModel, setSelectedModel, prediction } = usePatientStore();
  const [isRotating, setIsRotating] = useState(false);
  const [targetRotationY, setTargetRotationY] = useState<number | null>(null);
  const [selectedVessel, setSelectedVessel] = useState<string | null>(null);

  // References for dynamic 2D/3D synchronization
  const containerRef = useRef<HTMLDivElement>(null);
  const heartGroupRef = useRef<THREE.Group>(null);

  const cardRcaRef = useRef<HTMLDivElement>(null);
  const cardLcxRef = useRef<HTMLDivElement>(null);
  const cardLadRef = useRef<HTMLDivElement>(null);

  const lineRcaRef = useRef<SVGLineElement>(null);
  const lineLcxRef = useRef<SVGLineElement>(null);
  const lineLadRef = useRef<SVGLineElement>(null);

  const pinRcaRef = useRef<SVGGElement>(null);
  const pinLcxRef = useRef<SVGGElement>(null);
  const pinLadRef = useRef<SVGGElement>(null);

  const cardRefs = useMemo(
    () => ({
      rca: cardRcaRef,
      lcx: cardLcxRef,
      lad: cardLadRef,
    }),
    []
  );

  const lineRefs = useMemo(
    () => ({
      rca: lineRcaRef,
      lcx: lineLcxRef,
      lad: lineLadRef,
    }),
    []
  );

  const pinRefs = useMemo(
    () => ({
      rca: pinRcaRef,
      lcx: pinLcxRef,
      lad: pinLadRef,
    }),
    []
  );

  const resetCamera = () => {
    setTargetRotationY(0);
    setSelectedVessel(null);
    setIsRotating(false);
  };

  const getProb = (id: 'lad' | 'lcx' | 'rca') => {
    const raw = prediction?.predictions?.[id]?.probability;
    if (raw !== undefined) return (raw * 100).toFixed(1);
    if (id === 'lad') return '37.8';
    if (id === 'lcx') return '18.6';
    return '35.3';
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative bg-gradient-to-b from-slate-50/50 to-white rounded-2xl overflow-hidden flex flex-col select-none"
    >
      {/* ── Top Bar: Segmented Tabs & Action Icons ── */}
      <div className="absolute top-3.5 left-4 right-4 z-30 flex items-center justify-between gap-3 pointer-events-none">
        {/* Segmented Control Pill */}
        <div className="bg-slate-100/90 backdrop-blur-md p-1 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-1 pointer-events-auto">
          <button
            type="button"
            onClick={() => setSelectedModel('existing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              selectedModel === 'existing'
                ? 'bg-white text-slate-800 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Coronary Topography</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedModel('existing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              selectedModel === 'existing'
                ? 'bg-white text-slate-800 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-slate-500" />
            <span>Coronary Model</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedModel('glb')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
              selectedModel === 'glb'
                ? 'bg-[#0f766e] text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Anatomical Model</span>
          </button>
        </div>

        {/* Top-Right Floating Tool Icons */}
        <div className="flex flex-col gap-1.5 bg-white/90 backdrop-blur-md border border-slate-200/80 p-1 rounded-xl shadow-xs pointer-events-auto">
          <button
            type="button"
            onClick={resetCamera}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Reset Camera"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsRotating(!isRotating)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title={isRotating ? 'Pause Rotation' : 'Auto Rotate'}
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Layers & Vessels"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── 3D WebGL Canvas ── */}
      <div className="absolute inset-0 z-10">
        <Suspense
          fallback={
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-500">
              <Activity className="w-7 h-7 text-teal-600 animate-pulse" />
              <div className="text-xs font-medium animate-pulse">Loading 3D Anatomy...</div>
            </div>
          }
        >
          <Canvas
            camera={{ position: [0, -0.2, 9.8], fov: 38 }}
            gl={{ antialias: true, alpha: true }}
          >
            <SceneLighting />
            <CameraController selectedModel={selectedModel} />

            <group visible={selectedModel === 'existing'}>
              <ExistingHeartScene
                isRotating={isRotating && selectedModel === 'existing'}
                targetRotationY={targetRotationY}
                isVisible={selectedModel === 'existing'}
              />
            </group>

            <group visible={selectedModel === 'glb'}>
              <AnatomicalHeartScene
                isRotating={isRotating && selectedModel === 'glb'}
                targetRotationY={targetRotationY}
                selectedVessel={selectedVessel}
                setSelectedVessel={setSelectedVessel}
                heartGroupRef={heartGroupRef}
                isVisible={selectedModel === 'glb'}
              />
              <DynamicScreenTracker
                containerRef={containerRef}
                heartGroupRef={heartGroupRef}
                cardRefs={cardRefs}
                lineRefs={lineRefs}
                pinRefs={pinRefs}
              />
            </group>

            <OrbitControls
              enablePan={true}
              minDistance={3.0}
              maxDistance={15}
              enableDamping={true}
              dampingFactor={0.05}
              onChange={() => {
                if (targetRotationY !== null) {
                  setTargetRotationY(null);
                }
              }}
            />
          </Canvas>
        </Suspense>
      </div>

      {/* ── Dynamic SVG Leader Lines & Arrow Markers Overlay ── */}
      <svg
        className={`absolute inset-0 w-full h-full pointer-events-none z-20 ${
          selectedModel === 'glb' ? 'block' : 'hidden'
        }`}
      >
        <defs>
          {/* Arrow markers for each artery */}
          {ARTERY_DATA.map((artery) => (
            <marker
              key={`arrow-head-${artery.id}`}
              id={`arrow-head-${artery.id}`}
              viewBox="0 0 10 10"
              refX="14"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill={artery.color} />
            </marker>
          ))}
        </defs>

        {/* Dynamic Leader Lines */}
        <line
          ref={lineRcaRef}
          stroke="#3b82f6"
          strokeWidth="1.8"
          strokeLinecap="round"
          markerEnd="url(#arrow-head-rca)"
          className="transition-opacity duration-150"
        />
        <line
          ref={lineLcxRef}
          stroke="#0d9488"
          strokeWidth="1.8"
          strokeLinecap="round"
          markerEnd="url(#arrow-head-lcx)"
          className="transition-opacity duration-150"
        />
        <line
          ref={lineLadRef}
          stroke="#ef4444"
          strokeWidth="1.8"
          strokeLinecap="round"
          markerEnd="url(#arrow-head-lad)"
          className="transition-opacity duration-150"
        />

        {/* Target Bullseye Pins on Vessel Surface */}
        <g ref={pinRcaRef} className="transition-opacity duration-150">
          <circle r="14" fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.4" />
          <circle r="8.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2.5" />
          <circle r="3" fill="#ffffff" />
        </g>
        <g ref={pinLcxRef} className="transition-opacity duration-150">
          <circle r="14" fill="none" stroke="#0d9488" strokeWidth="1.5" opacity="0.4" />
          <circle r="8.5" fill="#0d9488" stroke="#ffffff" strokeWidth="2.5" />
          <circle r="3" fill="#ffffff" />
        </g>
        <g ref={pinLadRef} className="transition-opacity duration-150">
          <circle r="14" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.4" />
          <circle r="8.5" fill="#ef4444" stroke="#ffffff" strokeWidth="2.5" />
          <circle r="3" fill="#ffffff" />
        </g>
      </svg>

      {/* ── Apple-Inspired Artery Callout Cards (HUD Overlay) ── */}
      {selectedModel === 'glb' && (
        <div className="absolute inset-0 pointer-events-none z-20">
          {/* 1. RCA Card (Top-Left) */}
          <div
            ref={cardRcaRef}
            onClick={() => setSelectedVessel(selectedVessel === 'rca' ? null : 'rca')}
            className={`absolute left-5 top-[23%] md:left-8 pointer-events-auto cursor-pointer transition-all duration-200 ${
              selectedVessel === 'rca' ? 'scale-106 -translate-y-0.5' : 'hover:scale-102'
            }`}
          >
            <div
              className={`bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-md border transition-all duration-200 flex flex-col min-w-[152px] ${
                selectedVessel === 'rca'
                  ? 'ring-2 ring-blue-500 shadow-xl border-blue-300'
                  : 'border-blue-200/90 hover:shadow-lg'
              }`}
            >
              {/* Header: Icon + Title */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <HeartPulse className="w-3 h-3" />
                  </div>
                  <span className="font-extrabold text-xs text-slate-800 tracking-tight">RCA</span>
                </div>
                {selectedVessel === 'rca' && (
                  <span className="text-[9px] font-semibold text-blue-600 bg-blue-50 px-1 py-0.2 rounded-sm">
                    Active
                  </span>
                )}
              </div>

              {/* Metric Row: % + RISK pill */}
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="font-extrabold text-base text-slate-900 leading-none">
                  {getProb('rca')}%
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md border bg-blue-50 text-blue-700 border-blue-200">
                  RISK
                </span>
              </div>

              {/* Subtitle: Full Name */}
              <div className="text-[10px] text-slate-500 font-medium truncate mt-1">
                Right Coronary Artery
              </div>
            </div>
          </div>

          {/* 2. LCX Card (Mid-Right) */}
          <div
            ref={cardLcxRef}
            onClick={() => setSelectedVessel(selectedVessel === 'lcx' ? null : 'lcx')}
            className={`absolute right-5 top-[34%] md:right-8 pointer-events-auto cursor-pointer transition-all duration-200 ${
              selectedVessel === 'lcx' ? 'scale-106 -translate-y-0.5' : 'hover:scale-102'
            }`}
          >
            <div
              className={`bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-md border transition-all duration-200 flex flex-col min-w-[152px] ${
                selectedVessel === 'lcx'
                  ? 'ring-2 ring-teal-500 shadow-xl border-teal-300'
                  : 'border-teal-200/90 hover:shadow-lg'
              }`}
            >
              {/* Header: Icon + Title */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
                    <HeartPulse className="w-3 h-3" />
                  </div>
                  <span className="font-extrabold text-xs text-slate-800 tracking-tight">LCX</span>
                </div>
                {selectedVessel === 'lcx' && (
                  <span className="text-[9px] font-semibold text-teal-600 bg-teal-50 px-1 py-0.2 rounded-sm">
                    Active
                  </span>
                )}
              </div>

              {/* Metric Row: % + RISK pill */}
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="font-extrabold text-base text-slate-900 leading-none">
                  {getProb('lcx')}%
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md border bg-teal-50 text-teal-700 border-teal-200">
                  RISK
                </span>
              </div>

              {/* Subtitle: Full Name */}
              <div className="text-[10px] text-slate-500 font-medium truncate mt-1">
                Left Circumflex Artery
              </div>
            </div>
          </div>

          {/* 3. LAD Card (Bottom-Right) */}
          <div
            ref={cardLadRef}
            onClick={() => setSelectedVessel(selectedVessel === 'lad' ? null : 'lad')}
            className={`absolute right-5 top-[68%] md:right-8 pointer-events-auto cursor-pointer transition-all duration-200 ${
              selectedVessel === 'lad' ? 'scale-106 -translate-y-0.5' : 'hover:scale-102'
            }`}
          >
            <div
              className={`bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-md border transition-all duration-200 flex flex-col min-w-[152px] ${
                selectedVessel === 'lad'
                  ? 'ring-2 ring-rose-500 shadow-xl border-rose-300'
                  : 'border-rose-200/90 hover:shadow-lg'
              }`}
            >
              {/* Header: Icon + Title */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                    <HeartPulse className="w-3 h-3" />
                  </div>
                  <span className="font-extrabold text-xs text-slate-800 tracking-tight">LAD</span>
                </div>
                {selectedVessel === 'lad' && (
                  <span className="text-[9px] font-semibold text-rose-600 bg-rose-50 px-1 py-0.2 rounded-sm">
                    Active
                  </span>
                )}
              </div>

              {/* Metric Row: % + RISK pill */}
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="font-extrabold text-base text-slate-900 leading-none">
                  {getProb('lad')}%
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md border bg-rose-50 text-rose-700 border-rose-200">
                  RISK
                </span>
              </div>

              {/* Subtitle: Full Name */}
              <div className="text-[10px] text-slate-500 font-medium truncate mt-1">
                Left Anterior Descending Artery
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom Controls & Gestures Toolbar ── */}
      <div className="absolute bottom-4 left-0 right-0 z-30 pointer-events-none flex justify-center">
        <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 px-4 py-1.5 rounded-full shadow-xs flex items-center gap-4 text-[11px] text-slate-500 pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <RotateCw className="w-3 h-3 text-slate-400" />
            <span>Drag to rotate</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1.5">
            <ZoomIn className="w-3 h-3 text-slate-400" />
            <span>Scroll to zoom</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1.5">
            <MousePointerClick className="w-3 h-3 text-slate-400" />
            <span>Click on vessel to view details</span>
          </div>
        </div>
      </div>
    </div>
  );
}

useGLTF.preload('/heart0088_coronary_arteries.glb');
useGLTF.preload('/anatomical_heart_-_codominance.glb');

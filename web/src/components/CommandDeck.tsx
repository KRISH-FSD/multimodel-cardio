import { useRef, Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
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
} from 'lucide-react';

// ─── Artery Pathway & Anatomical Landmark Definitions ─────────────────────
export interface ArteryPathway {
  id: 'lad' | 'lcx' | 'rca';
  title: string;
  fullName: string;
  anatomicalCourse: string;
  territoryShort: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  cardBorder: string;
  activeRing: string;
  surfacePos: [number, number, number];
  focusRotationY: number;
  splinePoints: [number, number, number][];
}

export const ARTERY_DATA: ArteryPathway[] = [
  {
    id: 'lcx',
    title: 'LCX',
    fullName: 'Left Circumflex Artery',
    anatomicalCourse: 'Left Atrioventricular Groove',
    territoryShort: 'Left AV Sulcus',
    color: '#0d9488', // Apple Teal
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-700',
    badgeBorder: 'border-teal-200',
    cardBorder: 'border-teal-200/90',
    activeRing: 'ring-teal-500 border-teal-400',
    // Verified surface vertex on Arteries2 Left Atrioventricular Groove
    surfacePos: [-0.901, 0.146, 2.137],
    focusRotationY: -0.65, // Smoothly turns Left AV Groove to front
    splinePoints: [
      [-0.845, 0.405, 2.026],
      [-0.934, 0.221, 2.105],
      [-0.901, 0.146, 2.137],
      [-0.707, -0.140, 2.280],
      [-0.611, -0.198, 2.299],
      [-0.740, -0.516, 2.310],
      [-0.667, -0.717, 2.335],
    ],
  },
  {
    id: 'rca',
    title: 'RCA',
    fullName: 'Right Coronary Artery',
    anatomicalCourse: 'Right Atrioventricular Groove',
    territoryShort: 'Right AV Sulcus',
    color: '#3b82f6', // Apple Blue
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    cardBorder: 'border-blue-200/90',
    activeRing: 'ring-blue-500 border-blue-400',
    // Verified surface vertex on Arteries2 Right Atrioventricular Groove
    surfacePos: [2.216, -0.267, 1.163],
    focusRotationY: 0.75, // Smoothly turns Right AV Groove to front
    splinePoints: [
      [1.423, 0.507, 1.580],
      [2.315, 0.175, 1.013],
      [2.286, -0.032, 1.091],
      [2.216, -0.267, 1.163],
      [2.158, -0.434, 1.236],
      [2.027, -0.675, 1.348],
      [1.834, -0.940, 1.548],
      [1.750, -1.092, 1.580],
    ],
  },
  {
    id: 'lad',
    title: 'LAD',
    fullName: 'Left Anterior Descending',
    anatomicalCourse: 'Anterior Interventricular Groove',
    territoryShort: 'Ant. IV Groove',
    color: '#ef4444', // Apple Coral/Red
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200',
    cardBorder: 'border-rose-200/90',
    activeRing: 'ring-rose-500 border-rose-400',
    // Verified surface vertex on Arteries2 Anterior Interventricular Groove (true front surface, Z > 2.4)
    surfacePos: [-0.281, -0.683, 2.406],
    focusRotationY: 0.05, // Front anterior view
    splinePoints: [
      [-0.473, -0.331, 2.323],
      [-0.408, -0.536, 2.385],
      [-0.281, -0.683, 2.406],
      [-0.191, -0.744, 2.412],
      [-0.475, -1.208, 2.391],
      [-0.258, -1.399, 2.370],
      [-0.373, -1.674, 2.334],
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
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Translucent Glowing Guide Tube */}
      <mesh>
        <tubeGeometry args={[curve, 64, isSelected ? 0.026 : 0.018, 8, false]} />
        <meshStandardMaterial
          color={artery.color}
          emissive={artery.color}
          emissiveIntensity={isSelected ? 1.2 : 0.6}
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
  onSelect,
  beaconRef,
  isVisible = true,
}: {
  surfacePos: [number, number, number];
  color: string;
  isSelected: boolean;
  onSelect?: () => void;
  beaconRef?: React.RefObject<THREE.Group | null>;
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
    <group
      ref={beaconRef}
      position={surfacePos}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      {/* 3D Core Sphere Dot */}
      <mesh>
        <sphereGeometry args={[0.048, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 1.8 : 1.1}
          roughness={0.1}
        />
      </mesh>

      {/* Pulsing Ripple Disk */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.04, 0.085, 32]} />
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

// ─── 3. Screen Projection Tracker for 60fps Dynamic Leader Lines ───────────
function DynamicScreenTracker({
  containerRef,
  heartGroupRef,
  beaconRefs,
  cardRefs,
  lineRefs,
  pinRefs,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  heartGroupRef: React.RefObject<THREE.Group | null>;
  beaconRefs: { [key: string]: React.RefObject<THREE.Group | null> };
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
      const beaconGroup = beaconRefs[artery.id]?.current;
      if (!beaconGroup) return;

      // 1. Live 3D World Position directly from Three.js scene graph
      const worldSurfacePt = new THREE.Vector3();
      beaconGroup.getWorldPosition(worldSurfacePt);

      // 2. Project 3D point to 2D screen coordinate
      const projectedSurface = worldSurfacePt.clone().project(camera);
      const pinX = (projectedSurface.x * 0.5 + 0.5) * containerRect.width;
      const pinY = (-projectedSurface.y * 0.5 + 0.5) * containerRect.height;

      // 3. True facing calculation relative to camera view direction
      const normalWorld = new THREE.Vector3(...artery.surfacePos)
        .normalize()
        .applyEuler(heartGroupRef.current!.rotation);
      const viewDir = camera.position.clone().sub(worldSurfacePt).normalize();
      const dotFacing = normalWorld.dot(viewDir);
      const isFacing = dotFacing > -0.2 && projectedSurface.z < 1.0;

      // 4. Update SVG Leader Line from Docked Card to 3D Pin
      const cardEl = cardRefs[artery.id]?.current;
      const lineEl = lineRefs[artery.id]?.current;

      if (cardEl && lineEl) {
        const cardBox = cardEl.getBoundingClientRect();
        const cardRelLeft = cardBox.left - containerRect.left;
        const cardRelTop = cardBox.top - containerRect.top;
        const cardW = cardBox.width;
        const cardH = cardBox.height;

        let lineStartX = cardRelLeft;
        if (pinX > cardRelLeft + cardW) {
          lineStartX = cardRelLeft + cardW;
        } else if (pinX < cardRelLeft) {
          lineStartX = cardRelLeft;
        } else {
          lineStartX = cardRelLeft + cardW / 2;
        }

        let lineStartY = cardRelTop + cardH / 2;
        if (pinY < cardRelTop) {
          lineStartY = cardRelTop;
        } else if (pinY > cardRelTop + cardH) {
          lineStartY = cardRelTop + cardH;
        }

        lineEl.setAttribute('x1', `${lineStartX}`);
        lineEl.setAttribute('y1', `${lineStartY}`);
        lineEl.setAttribute('x2', `${pinX}`);
        lineEl.setAttribute('y2', `${pinY}`);
        lineEl.style.opacity = isFacing ? '0.9' : '0.2';
        if (!isFacing) {
          lineEl.setAttribute('stroke-dasharray', '4 4');
        } else {
          lineEl.removeAttribute('stroke-dasharray');
        }
      }

      // 5. Update Bullseye Surface Pin
      const pinEl = pinRefs[artery.id]?.current;
      if (pinEl) {
        pinEl.setAttribute('transform', `translate(${pinX}, ${pinY})`);
        pinEl.style.opacity = isFacing ? '1' : '0.25';
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
          delta * 4.0
        );
        if (Math.abs(heartGroupRef.current.rotation.y - targetRotationY) < 0.005) {
          heartGroupRef.current.rotation.y = targetRotationY;
        }
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
      <group scale={0.03} position={[0, 0, 0]}>
        <primitive object={scene} />
      </group>

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
  handleSelectVessel,
  heartGroupRef,
  beaconRefs,
  isVisible = true,
}: {
  isRotating: boolean;
  targetRotationY: number | null;
  selectedVessel: string | null;
  handleSelectVessel: (vessel: 'lad' | 'lcx' | 'rca') => void;
  heartGroupRef: React.RefObject<THREE.Group | null>;
  beaconRefs: { [key: string]: React.RefObject<THREE.Group | null> };
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
          color: new THREE.Color('#dc2626'),
          roughness: 0.3,
          metalness: 0.25,
          clearcoat: 0.7,
          clearcoatRoughness: 0.2,
          emissive: new THREE.Color('#991b1b'),
          emissiveIntensity: 0.35,
        });
      } else if (child.name.includes('Hart_basis')) {
        child.material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#9e2232'),
          roughness: 0.55,
          metalness: 0.15,
          clearcoat: 0.3,
          map: oldMat.map || null,
          normalMap: oldMat.normalMap || null,
        });
      } else if (child.name.includes('Aorta') || child.name.includes('Pulmonary_trunk')) {
        child.material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#b91c1c'),
          roughness: 0.4,
          metalness: 0.25,
          clearcoat: 0.4,
          map: oldMat.map || null,
          normalMap: oldMat.normalMap || null,
        });
      } else if (child.name.includes('Veins')) {
        child.material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#2563eb'),
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
        if (Math.abs(heartGroupRef.current.rotation.y - targetRotationY) < 0.005) {
          heartGroupRef.current.rotation.y = targetRotationY;
        }
      } else if (isRotating) {
        heartGroupRef.current.rotation.y += delta * 0.25;
      }
      const beat = Math.sin(state.clock.elapsedTime * 4) * 0.015;
      heartGroupRef.current.scale.setScalar(1 + beat);
    }
  });

  return (
    <group ref={heartGroupRef} rotation={[0, 0, 0]}>
      {/* 
        Fixed Centered Heart Model Group:
        Mesh center offset [-0.3928, 0.7500, -0.2112] mathematically centers the heart at (0, 0, 0).
      */}
      <group scale={0.018} position={[-0.3928, 0.7500, -0.2112]}>
        <primitive object={clonedScene} />
      </group>

      {/* 3D Animated Flow Paths along LAD, LCX, RCA */}
      {ARTERY_DATA.map((artery) => (
        <ArteryAnimatedFlow
          key={`flow-${artery.id}`}
          artery={artery}
          isSelected={selectedVessel === artery.id}
          onSelect={() => handleSelectVessel(artery.id)}
          isVisible={isVisible}
        />
      ))}

      {/* 3D Surface Glow Beacons anchored to exact mesh vertices */}
      {ARTERY_DATA.map((artery) => (
        <SurfaceGlowBeacon
          key={`beacon-${artery.id}`}
          beaconRef={beaconRefs[artery.id]}
          surfacePos={artery.surfacePos}
          color={artery.color}
          isSelected={selectedVessel === artery.id}
          onSelect={() => handleSelectVessel(artery.id)}
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

  const beaconRcaRef = useRef<THREE.Group>(null);
  const beaconLcxRef = useRef<THREE.Group>(null);
  const beaconLadRef = useRef<THREE.Group>(null);

  const cardRcaRef = useRef<HTMLDivElement>(null);
  const cardLcxRef = useRef<HTMLDivElement>(null);
  const cardLadRef = useRef<HTMLDivElement>(null);

  const lineRcaRef = useRef<SVGLineElement>(null);
  const lineLcxRef = useRef<SVGLineElement>(null);
  const lineLadRef = useRef<SVGLineElement>(null);

  const pinRcaRef = useRef<SVGGElement>(null);
  const pinLcxRef = useRef<SVGGElement>(null);
  const pinLadRef = useRef<SVGGElement>(null);

  const beaconRefs = useMemo(
    () => ({
      rca: beaconRcaRef,
      lcx: beaconLcxRef,
      lad: beaconLadRef,
    }),
    []
  );

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

  // Auto-focus and rotate to vessel when clicking card or 3D pin
  const handleSelectVessel = (id: 'lad' | 'lcx' | 'rca') => {
    if (selectedVessel === id) {
      setSelectedVessel(null);
      setTargetRotationY(0);
    } else {
      setSelectedVessel(id);
      setIsRotating(false);
      const art = ARTERY_DATA.find((a) => a.id === id);
      if (art) {
        setTargetRotationY(art.focusRotationY);
      }
    }
  };

  const resetCamera = () => {
    setTargetRotationY(0);
    setSelectedVessel(null);
    setIsRotating(false);
  };

  const getProbNumber = (id: 'lad' | 'lcx' | 'rca'): number => {
    const raw = prediction?.predictions?.[id]?.probability;
    if (raw !== undefined) return raw;
    if (id === 'lad') return 0.378;
    if (id === 'lcx') return 0.186;
    return 0.353;
  };

  const getProb = (id: 'lad' | 'lcx' | 'rca') => {
    return (getProbNumber(id) * 100).toFixed(1);
  };

  const getRiskTier = (prob: number) => {
    if (prob >= 0.5) return { label: 'High Risk', badge: 'bg-rose-50 text-rose-700 border-rose-200' };
    if (prob >= 0.35) return { label: 'Moderate-High', badge: 'bg-rose-50/80 text-rose-600 border-rose-200/80' };
    if (prob >= 0.25) return { label: 'Moderate', badge: 'bg-blue-50 text-blue-700 border-blue-200' };
    return { label: 'Low-Moderate', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
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
            title="Reset Camera & Center View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRotating(!isRotating);
              if (targetRotationY !== null) setTargetRotationY(null);
            }}
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
                handleSelectVessel={handleSelectVessel}
                heartGroupRef={heartGroupRef}
                beaconRefs={beaconRefs}
                isVisible={selectedModel === 'glb'}
              />
              <DynamicScreenTracker
                containerRef={containerRef}
                heartGroupRef={heartGroupRef}
                beaconRefs={beaconRefs}
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
              onStart={() => {
                // Cancel active auto-focus only when user begins manual dragging
                setTargetRotationY(null);
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
          ref={lineLcxRef}
          stroke="#0d9488"
          strokeWidth="1.8"
          strokeLinecap="round"
          markerEnd="url(#arrow-head-lcx)"
          className="transition-opacity duration-150"
        />
        <line
          ref={lineRcaRef}
          stroke="#3b82f6"
          strokeWidth="1.8"
          strokeLinecap="round"
          markerEnd="url(#arrow-head-rca)"
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
        <g ref={pinLcxRef} className="transition-opacity duration-150">
          <circle r="13" fill="none" stroke="#0d9488" strokeWidth="1.5" opacity="0.4" />
          <circle r="7.5" fill="#0d9488" stroke="#ffffff" strokeWidth="2.5" />
          <circle r="2.5" fill="#ffffff" />
        </g>
        <g ref={pinRcaRef} className="transition-opacity duration-150">
          <circle r="13" fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.4" />
          <circle r="7.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2.5" />
          <circle r="2.5" fill="#ffffff" />
        </g>
        <g ref={pinLadRef} className="transition-opacity duration-150">
          <circle r="13" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.4" />
          <circle r="7.5" fill="#ef4444" stroke="#ffffff" strokeWidth="2.5" />
          <circle r="2.5" fill="#ffffff" />
        </g>
      </svg>

      {/* ── Apple-Inspired Artery Callout Cards (Docked HUD Overlay) ── */}
      {selectedModel === 'glb' && (
        <div className="absolute inset-0 pointer-events-none z-20">
          {ARTERY_DATA.map((artery) => {
            const probNum = getProbNumber(artery.id);
            const probStr = getProb(artery.id);
            const riskTier = getRiskTier(probNum);
            const isSelected = selectedVessel === artery.id;
            const cardRef = cardRefs[artery.id];

            // Clean non-crossing docked HUD layout:
            // LCX -> Left side (top-24 left-4), directly facing left AV groove
            // RCA -> Right side (top-28 right-4), directly facing right AV groove below top-right tools
            // LAD -> Lower right (bottom-16 right-4), directly facing anterior IV groove
            const dockClass =
              artery.id === 'lcx'
                ? 'top-24 left-4'
                : artery.id === 'rca'
                ? 'top-28 right-4'
                : 'bottom-16 right-4';

            return (
              <div
                key={`card-${artery.id}`}
                id={`card-vessel-${artery.id}`}
                ref={cardRef}
                onClick={() => handleSelectVessel(artery.id)}
                className={`absolute ${dockClass} pointer-events-auto cursor-pointer select-none transition-all duration-300 ${
                  isSelected ? 'z-30 scale-[1.03]' : 'z-20 hover:scale-[1.01]'
                }`}
              >
                <div
                  className={`w-[215px] sm:w-[225px] bg-white/94 backdrop-blur-xl rounded-2xl p-3 border transition-all duration-200 flex flex-col gap-1.5 shadow-[0_6px_24px_-4px_rgba(0,0,0,0.08)] ${
                    isSelected
                      ? `ring-2 ${artery.activeRing} shadow-xl ${artery.cardBorder} bg-white/98`
                      : `${artery.cardBorder} hover:shadow-lg`
                  }`}
                >
                  {/* Header: Acronym Pill + Anatomical Territory Badge + Active Dot */}
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${artery.color}25` }}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'animate-ping' : ''}`}
                          style={{ backgroundColor: artery.color }}
                        />
                      </div>
                      <span className="font-extrabold text-xs text-slate-900 tracking-tight">
                        {artery.title}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                        {artery.territoryShort}
                      </span>
                    </div>
                    {isSelected ? (
                      <span
                        className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${artery.badgeBg} ${artery.badgeText} border ${artery.badgeBorder}`}
                      >
                        Focus Active
                      </span>
                    ) : (
                      <span className="text-[8px] text-slate-400 font-mono">
                        Click to Focus
                      </span>
                    )}
                  </div>

                  {/* Metric Row: Bold Probability + Risk Level Pill */}
                  <div className="flex items-baseline justify-between mt-0.5">
                    <div className="flex items-baseline gap-1">
                      <span className="font-extrabold text-xl text-slate-900 font-mono tracking-tight leading-none">
                        {probStr}%
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        Risk Prob.
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${riskTier.badge}`}
                    >
                      {riskTier.label}
                    </span>
                  </div>

                  {/* Mini Risk Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden mt-0.5">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(5, probNum * 100))}%`,
                        backgroundColor: artery.color,
                      }}
                    />
                  </div>

                  {/* Footer: Full Anatomical Name + Clinical Distinction */}
                  <div className="flex flex-col text-[10px] text-slate-500 font-medium leading-tight gap-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 whitespace-nowrap">
                        {artery.fullName}
                      </span>
                      <span className="text-[8px] text-slate-400 font-mono uppercase bg-slate-100 border border-slate-200/60 px-1 py-0.2 rounded shrink-0">
                        Not Stenosis %
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400">{artery.anatomicalCourse}</span>
                  </div>
                </div>
              </div>
            );
          })}
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
            <span>Click card or vessel pin to auto-focus</span>
          </div>
        </div>
      </div>
    </div>
  );
}

useGLTF.preload('/heart0088_coronary_arteries.glb');
useGLTF.preload('/anatomical_heart_-_codominance.glb');

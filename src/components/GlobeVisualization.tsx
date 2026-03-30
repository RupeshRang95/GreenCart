import React, { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { userLocation } from "@/data/mockData";

type TransportKey = "ship" | "truck" | "air" | "rail";

interface GlobeProps {
  origin: { lat: number; lng: number; country: string; flag: string };
  transport: TransportKey;
  distance: number;
}

// Convert lat/lng to 3D position on sphere
const latLngToVec3 = (lat: number, lng: number, radius: number): THREE.Vector3 => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
};

// Create a curved arc between two points on the globe
const createArc = (start: THREE.Vector3, end: THREE.Vector3, altitude: number, segments = 64): THREE.Vector3[] => {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const point = new THREE.Vector3().lerpVectors(start, end, t);
    const midFactor = Math.sin(t * Math.PI);
    const baseLen = point.length();
    point.normalize().multiplyScalar(baseLen + altitude * midFactor);
    points.push(point);
  }
  return points;
};

// Simplified continent outlines as lat/lng pairs
const continentData: [number, number][][] = [
  // North America
  [[60,-140],[55,-130],[48,-125],[35,-120],[30,-115],[25,-110],[20,-105],[15,-90],[20,-87],[25,-80],[30,-82],[35,-75],[40,-74],[42,-70],[45,-67],[50,-60],[55,-58],[60,-65],[65,-70],[70,-80],[72,-95],[70,-110],[65,-125],[60,-140]],
  // South America
  [[10,-75],[5,-77],[0,-80],[-5,-80],[-10,-77],[-15,-75],[-20,-70],[-25,-65],[-30,-60],[-35,-58],[-40,-65],[-50,-73],[-55,-70],[-45,-60],[-35,-55],[-25,-45],[-15,-40],[-5,-35],[0,-50],[5,-60],[10,-75]],
  // Europe
  [[35,-10],[38,-8],[42,0],[45,10],[50,15],[54,10],[58,15],[62,25],[70,28],[70,40],[60,38],[55,35],[48,25],[42,28],[38,22],[36,25],[35,30],[38,40],[36,35],[35,15],[35,-10]],
  // Africa
  [[35,-5],[30,0],[25,10],[15,18],[5,10],[-5,12],[-15,18],[-25,25],[-35,25],[-35,20],[-25,15],[-10,40],[5,48],[15,50],[25,35],[32,35],[35,35],[37,10],[35,-5]],
  // Asia
  [[40,30],[45,50],[55,60],[65,70],[72,100],[70,130],[60,140],[50,130],[40,130],[30,120],[20,105],[10,100],[0,105],[-8,115],[5,100],[15,100],[25,90],[35,70],[38,45],[40,30]],
  // Australia
  [[-15,130],[-20,115],[-30,115],[-38,145],[-35,150],[-25,153],[-15,145],[-12,137],[-15,130]],
];

// ── Globe Sphere ──
const GlobeMesh: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshPhongMaterial
        color="#0f1f11"
        emissive="#0a150b"
        specular="#1a3a1e"
        shininess={10}
        transparent
        opacity={0.95}
      />
    </mesh>
  );
};

// ── Atmosphere Glow ──
const Atmosphere: React.FC = () => (
  <mesh>
    <sphereGeometry args={[2.08, 64, 64]} />
    <meshBasicMaterial color="#4ADE80" transparent opacity={0.04} side={THREE.BackSide} />
  </mesh>
);

// ── Grid Lines ──
const GridLines: React.FC = () => {
  const gridGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    // Latitude lines
    for (let lat = -60; lat <= 60; lat += 30) {
      for (let lng = -180; lng < 180; lng += 3) {
        points.push(latLngToVec3(lat, lng, 2.005));
        points.push(latLngToVec3(lat, lng + 3, 2.005));
      }
    }
    // Longitude lines
    for (let lng = -180; lng < 180; lng += 30) {
      for (let lat = -80; lat < 80; lat += 3) {
        points.push(latLngToVec3(lat, lng, 2.005));
        points.push(latLngToVec3(lat + 3, lng, 2.005));
      }
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, []);

  return (
    <lineSegments geometry={gridGeometry}>
      <lineBasicMaterial color="#4ADE80" transparent opacity={0.06} />
    </lineSegments>
  );
};

// ── Continent Outlines ──
const Continents: React.FC = () => {
  const geometries = useMemo(() => {
    return continentData.map(continent => {
      const verts = continent.map(([lat, lng]) => latLngToVec3(lat, lng, 2.01));
      // Build line segment pairs for lineSegments (each pair = one segment)
      const segPoints: THREE.Vector3[] = [];
      for (let i = 0; i < verts.length; i++) {
        segPoints.push(verts[i]);
        segPoints.push(verts[(i + 1) % verts.length]);
      }
      return new THREE.BufferGeometry().setFromPoints(segPoints);
    });
  }, []);

  return (
    <group>
      {geometries.map((geo, i) => (
        <lineSegments key={i} geometry={geo}>
          <lineBasicMaterial color="#4ADE80" transparent opacity={0.35} />
        </lineSegments>
      ))}
    </group>
  );
};

// ── Pulsing Dot ──
const PulsingDot: React.FC<{ position: THREE.Vector3; color: string; label?: string }> = ({ position, color }) => {
  const ref = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ringRef.current) {
      const scale = 1 + Math.sin(t * 2) * 0.5;
      ringRef.current.scale.setScalar(scale);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.3 - Math.sin(t * 2) * 0.2;
    }
  });

  return (
    <group position={position}>
      {/* Core dot */}
      <mesh ref={ref}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Pulse ring */}
      <mesh ref={ringRef}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>
      {/* Glow */}
      <pointLight color={color} intensity={0.5} distance={0.5} />
    </group>
  );
};

const TransportMesh: React.FC<{ transport: TransportKey; color: string }> = ({ transport, color }) => {
  switch (transport) {
    case "air":
      return (
        <group rotation={[0, 0, Math.PI / 2]}>
          <mesh>
            <coneGeometry args={[0.022, 0.07, 8]} />
            <meshBasicMaterial color={color} />
          </mesh>
          <mesh position={[0, 0, 0.04]}>
            <boxGeometry args={[0.05, 0.02, 0.06]} />
            <meshBasicMaterial color={color} />
          </mesh>
        </group>
      );
    case "ship":
      return (
        <mesh>
          <boxGeometry args={[0.08, 0.025, 0.04]} />
          <meshBasicMaterial color={color} />
        </mesh>
      );
    case "rail":
      return (
        <group>
          <mesh>
            <boxGeometry args={[0.07, 0.03, 0.04]} />
            <meshBasicMaterial color={color} />
          </mesh>
          <mesh position={[0.03, -0.02, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.008, 8]} />
            <meshBasicMaterial color={color} />
          </mesh>
        </group>
      );
    case "truck":
    default:
      return (
        <group>
          <mesh>
            <boxGeometry args={[0.06, 0.028, 0.035]} />
            <meshBasicMaterial color={color} />
          </mesh>
          <mesh position={[-0.035, -0.015, 0]}>
            <boxGeometry args={[0.02, 0.02, 0.035]} />
            <meshBasicMaterial color={color} />
          </mesh>
        </group>
      );
  }
};

// ── Animated Arc with Vehicle ──
const AnimatedArc: React.FC<{
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: string;
  altitude: number;
  transport: TransportKey;
}> = ({ start, end, color, altitude, transport }) => {
  const arcPoints = useMemo(() => createArc(start, end, altitude, 80), [start, end, altitude]);
  const vehicleRef = useRef<THREE.Group>(null);

  const curve = useMemo(() => new THREE.CatmullRomCurve3(arcPoints), [arcPoints]);

  useFrame(({ clock }) => {
    const t = (clock.getElapsedTime() * 0.12) % 1;
    if (vehicleRef.current) {
      const pos = curve.getPointAt(t);
      vehicleRef.current.position.copy(pos);
      const lookAt = curve.getPointAt(Math.min(t + 0.02, 1));
      vehicleRef.current.lookAt(lookAt);
    }
  });

  const tubeGeometry = useMemo(() => new THREE.TubeGeometry(curve, 80, 0.008, 8, false), [curve]);

  return (
    <group>
      <mesh geometry={tubeGeometry}>
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </mesh>
      <mesh geometry={tubeGeometry}>
        <meshBasicMaterial color={color} transparent opacity={0.12} />
      </mesh>
      <group ref={vehicleRef}>
        <TransportMesh transport={transport} color={color} />
        <pointLight color={color} intensity={1.2} distance={0.55} />
      </group>
    </group>
  );
};

// ── Main Scene ──
const GlobeScene: React.FC<{
  originPos: THREE.Vector3;
  destPos: THREE.Vector3;
  arcColor: string;
  altitude: number;
  transport: TransportKey;
}> = ({ originPos, destPos, arcColor, altitude, transport }) => {
  const groupRef = useRef<THREE.Group>(null);

  // Auto-rotate to show the route on load
  useEffect(() => {
    if (groupRef.current) {
      const mid = new THREE.Vector3().lerpVectors(originPos, destPos, 0.5).normalize();
      const targetRotY = Math.atan2(mid.x, mid.z);
      groupRef.current.rotation.y = -targetRotY;
    }
  }, [originPos, destPos]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group ref={groupRef}>
      <GlobeMesh />
      <Atmosphere />
      <GridLines />
      <Continents />
      <PulsingDot position={originPos} color={arcColor} />
      <PulsingDot position={destPos} color="#4ADE80" />
      <AnimatedArc start={originPos} end={destPos} color={arcColor} altitude={altitude} transport={transport} />
    </group>
  );
};

// ── Exported Component ──
const GlobeVisualization: React.FC<GlobeProps> = ({ origin, transport, distance }) => {
  const dest = userLocation;
  const originPos = latLngToVec3(origin.lat, origin.lng, 2.015);
  const destPos = latLngToVec3(dest.lat, dest.lng, 2.015);

  const transportColors: Record<string, string> = { ship: "#378ADD", truck: "#FBBF24", air: "#F87171", rail: "#1D9E75" };
  const transportIcons: Record<string, string> = { ship: "🚢", truck: "🚛", air: "✈️", rail: "🚂" };
  const arcColor = transportColors[transport] || "#4ADE80";
  const altitude = transport === "air" ? 0.8 : transport === "ship" ? 0.4 : 0.3;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-full rounded-2xl overflow-hidden" style={{ height: 260, background: "#060e07" }}>
        <Canvas
          camera={{ position: [0, 0, 5.5], fov: 40 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: "transparent" }}
        >
          <ambientLight intensity={0.3} />
          <directionalLight position={[5, 3, 5]} intensity={0.5} color="#4ADE80" />
          <directionalLight position={[-5, -3, -5]} intensity={0.2} color="#1a3a1e" />
          <GlobeScene
            originPos={originPos}
            destPos={destPos}
            arcColor={arcColor}
            altitude={altitude}
            transport={transport}
          />
          <OrbitControls
            enableZoom={true}
            enablePan={false}
            minDistance={4}
            maxDistance={8}
            autoRotate={false}
            rotateSpeed={0.5}
          />
        </Canvas>
      </div>

      {/* Info bar */}
      <div className="flex items-center justify-between w-full px-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">{origin.flag}</span>
          <div>
            <div className="text-[11px] text-foreground-secondary">{origin.country}</div>
            <div className="text-[10px] text-foreground-tertiary">Origin</div>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-xs font-mono font-semibold" style={{ color: arcColor }}>{distance.toLocaleString()} km</div>
          <div className="flex items-center gap-1 text-[10px] text-foreground-tertiary">
            <span>{transportIcons[transport]}</span>
            <span className="capitalize">{transport}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-[11px] text-foreground-secondary">
              {userLocation.city}, {userLocation.province}
            </div>
            <div className="text-[10px] text-foreground-tertiary">You</div>
          </div>
          <span className="text-lg">📍</span>
        </div>
      </div>
    </div>
  );
};

export default GlobeVisualization;

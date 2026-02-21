import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

const GlobeInner = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.08;
      meshRef.current.rotation.x = Math.sin(t * 0.03) * 0.1;
    }
    if (lightRef.current) {
      // Gentle pulsing glow — not distracting
      lightRef.current.intensity = 1.8 + Math.sin(t * 0.8) * 0.6;
    }
  });

  const wireframeMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("hsl(38, 85%, 55%)"),
        wireframe: true,
        transparent: true,
        opacity: 0.12,
      }),
    []
  );

  return (
    <>
      {/* Ambient */}
      <ambientLight intensity={0.3} color="#c4a55a" />

      {/* Pulsing highlight */}
      <pointLight
        ref={lightRef}
        position={[3, 2, 4]}
        intensity={2}
        color="#e8c35a"
        distance={12}
      />
      <pointLight position={[-3, -1, 2]} intensity={0.6} color="#4a6fa5" distance={10} />

      {/* Main globe — distorted sphere for organic feel */}
      <Sphere ref={meshRef} args={[2, 64, 64]} position={[0, 0, 0]}>
        <MeshDistortMaterial
          color="#1a2a52"
          emissive="#2a3a6a"
          emissiveIntensity={0.4}
          roughness={0.7}
          metalness={0.3}
          distort={0.15}
          speed={1.2}
          transparent
          opacity={0.85}
        />
      </Sphere>

      {/* Wireframe overlay for globe grid lines */}
      <Sphere args={[2.02, 24, 24]} position={[0, 0, 0]} material={wireframeMat} />

      {/* Outer glow ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.3, 2.5, 64]} />
        <meshBasicMaterial
          color="#e8c35a"
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>
    </>
  );
};

const HeroGlobe = () => (
  <div className="absolute inset-0 z-0">
    <Canvas
      camera={{ position: [0, 0, 5.5], fov: 45 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: "transparent" }}
      dpr={[1, 1.5]}
    >
      <GlobeInner />
    </Canvas>
  </div>
);

export default HeroGlobe;

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial, Html } from "@react-three/drei";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";

const GlobeInner = ({ onClick }: { onClick: () => void }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.08;
      meshRef.current.rotation.x = Math.sin(t * 0.03) * 0.1;
    }
    if (lightRef.current) {
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
      <ambientLight intensity={0.3} color="#c4a55a" />
      <pointLight
        ref={lightRef}
        position={[3, 2, 4]}
        intensity={2}
        color="#e8c35a"
        distance={12}
      />
      <pointLight position={[-3, -1, 2]} intensity={0.6} color="#4a6fa5" distance={10} />

      {/* Main globe — clickable */}
      <Sphere
        ref={meshRef}
        args={[2, 64, 64]}
        position={[0, 0, 0]}
        onClick={onClick}
        onPointerOver={(e) => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "default";
        }}
      >
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

      <Sphere args={[2.02, 24, 24]} position={[0, 0, 0]} material={wireframeMat} />

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.3, 2.5, 64]} />
        <meshBasicMaterial
          color="#e8c35a"
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Label */}
      <Html position={[0, -2.8, 0]} center>
        <div
          className="text-xs text-accent/80 font-medium whitespace-nowrap cursor-pointer hover:text-accent transition-colors animate-pulse-soft"
          onClick={onClick}
        >
          🌍 Click to enter Prayer Room
        </div>
      </Html>
    </>
  );
};

const HeroGlobe = () => {
  const navigate = useNavigate();
  const handleClick = () => navigate("/prayer-room");

  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
        dpr={[1, 1.5]}
      >
        <GlobeInner onClick={handleClick} />
      </Canvas>
    </div>
  );
};

export default HeroGlobe;

"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  Sparkles,
  RoundedBox,
  Edges,
  MeshDistortMaterial,
  ContactShadows,
  Environment,
  Lightformer,
} from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

const VIOLET = "#8b5cf6";
const MAGENTA = "#d946ef";
const EMERALD = "#34d399";

function Vault({ solvent }: { solvent?: boolean }) {
  const group = useRef<THREE.Group>(null);
  const dialA = useRef<THREE.Mesh>(null);
  const dialB = useRef<THREE.Mesh>(null);
  const coreColor = solvent === false ? "#fb7185" : solvent ? EMERALD : VIOLET;

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      // slow auto-spin + gentle parallax toward the pointer
      group.current.rotation.y = t * 0.12 + state.pointer.x * 0.35;
      group.current.rotation.x = THREE.MathUtils.lerp(
        group.current.rotation.x,
        state.pointer.y * -0.18,
        0.05
      );
    }
    if (dialA.current) dialA.current.rotation.z += delta * 0.5;
    if (dialB.current) dialB.current.rotation.z -= delta * 0.32;
  });

  return (
    <group ref={group} scale={1.15}>
      {/* glowing distorted core */}
      <mesh>
        <icosahedronGeometry args={[0.62, 6]} />
        <MeshDistortMaterial
          color={coreColor}
          emissive={coreColor}
          emissiveIntensity={2.4}
          distort={0.32}
          speed={2.2}
          roughness={0.1}
          metalness={0.2}
        />
      </mesh>

      {/* matte-black vault shell with glowing beveled edges */}
      <RoundedBox args={[1.7, 1.7, 1.7]} radius={0.2} smoothness={6}>
        <meshStandardMaterial
          color="#050308"
          metalness={0.9}
          roughness={0.38}
          transparent
          opacity={0.94}
          envMapIntensity={1.1}
        />
        <Edges threshold={15} color={VIOLET} />
      </RoundedBox>

      {/* neon lock dials */}
      <mesh ref={dialA} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.18, 0.02, 16, 128]} />
        <meshStandardMaterial
          color={MAGENTA}
          emissive={MAGENTA}
          emissiveIntensity={2.4}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>
      <mesh ref={dialB} rotation={[Math.PI / 2.5, Math.PI / 3, 0]}>
        <torusGeometry args={[1.34, 0.014, 16, 128]} />
        <meshStandardMaterial
          color={VIOLET}
          emissive={VIOLET}
          emissiveIntensity={2.2}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

function SceneContents({ solvent }: { solvent?: boolean }) {
  return (
    <>
      <ambientLight intensity={0.28} />
      <pointLight position={[4, 4, 4]} intensity={45} color={VIOLET} />
      <pointLight position={[-4, -2, 3]} intensity={38} color={MAGENTA} />
      <pointLight position={[0, 3, -4]} intensity={20} color={VIOLET} />

      <Float speed={1.4} rotationIntensity={0.35} floatIntensity={0.8}>
        <Vault solvent={solvent} />
      </Float>

      <Sparkles
        count={150}
        scale={[9, 6, 6]}
        size={2.4}
        speed={0.35}
        opacity={0.75}
        color={VIOLET}
      />
      <Sparkles
        count={70}
        scale={[10, 7, 5]}
        size={1.8}
        speed={0.25}
        opacity={0.6}
        color={MAGENTA}
      />

      <ContactShadows
        position={[0, -2, 0]}
        opacity={0.55}
        scale={12}
        blur={2.6}
        far={4}
        color={VIOLET}
      />

      {/* CDN-free environment for reflections on the metal shell */}
      <Environment resolution={128}>
        <Lightformer
          form="rect"
          intensity={2}
          color={VIOLET}
          position={[3, 3, 3]}
          scale={5}
        />
        <Lightformer
          form="rect"
          intensity={1.8}
          color={MAGENTA}
          position={[-3, -1, 2]}
          scale={5}
        />
        <Lightformer
          form="circle"
          intensity={1}
          color="#ffffff"
          position={[0, 4, -3]}
          scale={4}
        />
      </Environment>

      <EffectComposer>
        <Bloom
          intensity={1.35}
          luminanceThreshold={0.15}
          luminanceSmoothing={0.6}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.22} darkness={0.92} />
      </EffectComposer>
    </>
  );
}

export default function VaultScene({ solvent }: { solvent?: boolean }) {
  return (
    <Canvas
      camera={{ position: [0, 0.4, 5.4], fov: 42 }}
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <Suspense fallback={null}>
        <SceneContents solvent={solvent} />
      </Suspense>
    </Canvas>
  );
}

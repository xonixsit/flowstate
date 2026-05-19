import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Sparkles, Float, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { getAudioIntensity } from '../audioEngine';

const FocusScene = ({ isPlaying }) => {
  const groupRef = useRef(null);
  const sparklesRef = useRef(null);
  useFrame((state, delta) => {
    const intensity = isPlaying ? getAudioIntensity() : 0;
    if (groupRef.current) {
      // Speed increases with audio intensity
      groupRef.current.position.z = (groupRef.current.position.z + delta * (5 + intensity * 20)) % 20;
    }
    if (sparklesRef.current) {
      sparklesRef.current.scale.setScalar(1 + intensity * 2);
    }
  });
  return (
    <group ref={groupRef}>
      <Stars radius={50} depth={50} count={5000} factor={4} saturation={1} fade speed={2} />
      <group ref={sparklesRef}>
        <Sparkles count={200} scale={15} size={4} speed={0.4} color="#8a2be2" />
      </group>
    </group>
  );
};

const BreakScene = ({ isPlaying }) => {
  const floatRef = useRef(null);
  return (
    <Float ref={floatRef} speed={1.5} rotationIntensity={1} floatIntensity={2}>
      <Sparkles count={100} scale={10} size={2} speed={0.2} color="#00bfff" />
    </Float>
  );
};

const MeditateScene = ({ isPlaying }) => {
  return (
    <group>
      <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={0.5} />
      <Sparkles count={50} scale={8} size={6} speed={0.1} color="#e0e0ff" />
    </group>
  );
};

const AwakenScene = ({ isPlaying }) => {
  return (
    <group>
      <Stars radius={100} depth={50} count={3000} factor={6} saturation={1} fade speed={1.5} />
      <Sparkles count={150} scale={12} size={5} speed={0.8} color="#f59e0b" />
    </group>
  );
};

const DetoxScene = ({ isPlaying }) => {
  const sparklesRef = useRef(null);
  useFrame((state, delta) => {
    const intensity = isPlaying ? getAudioIntensity() : 0;
    if (sparklesRef.current) {
      // Rain falls faster and scales slightly with audio
      sparklesRef.current.position.y -= delta * (0.5 + intensity * 2);
      if (sparklesRef.current.position.y < -5) sparklesRef.current.position.y = 5;
      sparklesRef.current.scale.setScalar(1 + intensity);
    }
  });
  return (
    <group>
      <group ref={sparklesRef}>
        <Sparkles count={300} scale={[20, 20, 20]} size={3} speed={0} color="#2ecc71" opacity={0.5} />
      </group>
      <ambientLight intensity={0.2} />
      <directionalLight position={[0, 5, 5]} intensity={0.5} color="#2ecc71" />
    </group>
  );
};

export default function BackgroundVisuals({ mode, isPlaying }) {
  if (!isPlaying) {
    return (
      <div className="bg-canvas-container" style={{ position: 'absolute', inset: 0, zIndex: -1 }}>
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
           <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={0.2} />
        </Canvas>
      </div>
    );
  }

  return (
    <div className="bg-canvas-container" style={{ position: 'absolute', inset: 0, zIndex: -1 }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        {mode === 'focus' && <FocusScene isPlaying={isPlaying} />}
        {mode === 'break' && <BreakScene isPlaying={isPlaying} />}
        {mode === 'meditate' && <MeditateScene isPlaying={isPlaying} />}
        {mode === 'detox' && <DetoxScene isPlaying={isPlaying} />}
        {mode === 'awaken' && <AwakenScene isPlaying={isPlaying} />}
      </Canvas>
    </div>
  );
}

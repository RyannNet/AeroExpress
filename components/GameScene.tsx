
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, Environment, Stars, Fog } from '@react-three/drei';
import { Plane } from './Plane';
import { World } from './World';
import { Multiplayer } from './Multiplayer';

export const GameScene = () => {
  return (
    <Canvas shadows camera={{ position: [0, 20, 50], fov: 60 }}>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[100, 100, 50]} 
        intensity={2} 
        castShadow 
        shadow-mapSize-width={2048} 
        shadow-mapSize-height={2048}
        color="#fff5e6" // Luz solar levemente quente
      />

      {/* Environment Map for Reflections and Fill Light */}
      <Environment preset="sunset" />

      {/* Environment */}
      <Sky sunPosition={[100, 20, 100]} turbidity={0.5} rayleigh={0.5} mieCoefficient={0.005} />
      <Stars radius={200} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <fog attach="fog" args={['#ffcc80', 200, 4000]} /> {/* Nevoeiro levemente alaranjado para combinar com o por do sol */}

      {/* Game Objects */}
      <Plane />
      <Multiplayer />
      <World />
    </Canvas>
  );
};

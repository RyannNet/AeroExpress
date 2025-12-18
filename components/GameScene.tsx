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
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[100, 100, 50]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize-width={2048} 
        shadow-mapSize-height={2048}
      />

      {/* Environment */}
      <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.5} />
      <Stars radius={200} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <fog attach="fog" args={['#87CEEB', 200, 3000]} />

      {/* Game Objects */}
      <Plane />
      <Multiplayer />
      <World />
    </Canvas>
  );
};

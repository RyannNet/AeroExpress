import React, { Suspense } from 'react';
import { GameScene } from './components/GameScene';
import { HUD } from './components/HUD';
import { SplashScreen } from './components/SplashScreen';

export default function App() {
  return (
    <div className="relative w-full h-full bg-slate-900">
      <SplashScreen />
      <Suspense fallback={null}>
        <GameScene />
      </Suspense>
      <HUD />
    </div>
  );
}
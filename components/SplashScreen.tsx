
import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store';
import { Plane, ShieldCheck, Cpu, Wifi } from 'lucide-react';

export const SplashScreen = () => {
  const { gameState, setGameState } = useGameStore();
  const [progress, setProgress] = useState(0);
  const [bootStep, setBootStep] = useState(0);
  
  // Fake boot sequence logic
  useEffect(() => {
    if (gameState !== 'SPLASH') return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2; // Speed of loading
      });
    }, 30);

    // Sequence for text changes
    const timeouts = [
      setTimeout(() => setBootStep(1), 500),
      setTimeout(() => setBootStep(2), 1500),
      setTimeout(() => setBootStep(3), 2500),
    ];

    return () => {
      clearInterval(interval);
      timeouts.forEach(clearTimeout);
    };
  }, [gameState]);

  const handleStart = () => {
      // Tenta entrar em tela cheia
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
          elem.requestFullscreen().catch(err => console.log(err));
      }
      setGameState('MENU');
  };

  if (gameState !== 'SPLASH') return null;

  return (
    <div className="absolute inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center text-white overflow-hidden">
      {/* Background Grid Animation */}
      <div className="absolute inset-0 opacity-10" 
           style={{ 
             backgroundImage: 'linear-gradient(#0ea5e9 1px, transparent 1px), linear-gradient(90deg, #0ea5e9 1px, transparent 1px)', 
             backgroundSize: '40px 40px',
             transform: 'perspective(500px) rotateX(60deg) translateY(-100px) scale(2)' 
           }}>
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6 scale-75 md:scale-100">
        {/* Logo Animation */}
        <div className={`transition-all duration-1000 transform ${bootStep >= 1 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
          <div className="flex items-center gap-2 md:gap-4 mb-2">
             <div className="p-2 md:p-4 bg-sky-600 rounded-2xl shadow-[0_0_50px_rgba(14,165,233,0.5)]">
                <Plane size={24} className="text-white md:w-12 md:h-12" />
             </div>
             <div className="text-left">
                <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter">
                  AERO<span className="text-sky-500">EXPRESS</span>
                </h1>
                <p className="text-sky-300 tracking-[0.2em] text-[8px] md:text-xs uppercase font-bold">Flight Logistics Simulator</p>
             </div>
          </div>
        </div>

        {/* Loading Bar Container */}
        <div className="w-full bg-slate-800 h-1 mt-6 md:mt-12 mb-4 rounded-full overflow-hidden border border-slate-700">
          <div 
            className="h-full bg-sky-500 shadow-[0_0_20px_#0ea5e9] transition-all duration-75 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* System Status Text */}
        <div className="w-full flex justify-between text-[8px] md:text-xs font-mono text-slate-400 h-6 md:h-8">
            <span className="flex items-center gap-2">
                {progress < 100 ? (
                    <span className="animate-pulse text-sky-400">LOADING ASSETS... {progress}%</span>
                ) : (
                    <span className="text-green-400">SYSTEM READY</span>
                )}
            </span>
            <span className="text-slate-600">{bootStep > 0 && "v1.0.5-fix"}</span>
        </div>

        {/* System Checks Visualization */}
        <div className="grid grid-cols-3 gap-2 w-full mt-2 md:mt-4">
             <SystemCheck icon={<Cpu size={10} className="md:w-3 md:h-3"/>} label="PHYSICS" active={progress > 20} done={progress > 40} />
             <SystemCheck icon={<Wifi size={10} className="md:w-3 md:h-3"/>} label="NETWORK" active={progress > 40} done={progress > 70} />
             <SystemCheck icon={<ShieldCheck size={10} className="md:w-3 md:h-3"/>} label="SECURITY" active={progress > 70} done={progress > 90} />
        </div>

        {/* Start Button */}
        <div className={`mt-6 md:mt-12 transition-all duration-500 ${progress === 100 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <button 
            onClick={handleStart}
            className="group relative px-6 py-2 md:px-10 md:py-4 bg-white text-slate-900 font-black text-sm md:text-lg uppercase tracking-widest hover:bg-sky-400 transition-colors clip-path-slant active:scale-95"
            style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' }}
          >
            INITIALIZE FLIGHT
            <div className="absolute inset-0 border-2 border-white opacity-50 group-hover:scale-105 transition-transform" style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' }}></div>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-2 md:bottom-4 text-slate-600 text-[6px] md:text-[10px] font-mono">
        © 2024 AEROEXPRESS FLIGHT SYSTEMS. ALL RIGHTS RESERVED.
      </div>
    </div>
  );
};

const SystemCheck = ({ icon, label, active, done }: { icon: any, label: string, active: boolean, done: boolean }) => (
    <div className={`flex items-center gap-2 p-1 md:p-2 rounded border transition-colors duration-300 ${done ? 'border-green-500/30 bg-green-500/10 text-green-400' : active ? 'border-sky-500/30 bg-sky-500/10 text-sky-400' : 'border-slate-800 bg-slate-900 text-slate-600'}`}>
        {icon}
        <span className="text-[6px] md:text-[10px] font-bold">{label}</span>
    </div>
)

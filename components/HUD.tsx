
import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store';
import { Mission, CITIES, SHOP_ITEMS, ShopCategory, PlaneSystems } from '../types';
import { 
  Plane, Navigation, CheckCircle, AlertTriangle, Play, ArrowLeft,
  Settings, Wrench, Coins, Hash, ChevronRight, Crosshair, Map, Speaker, PaintBucket, Zap, MoreHorizontal, Power, Wifi, Coffee, Mic, Fan, Thermometer
} from 'lucide-react';

// --- MINIMAP COMPONENT ---
const Minimap = () => {
    const { planePosition, planeRotation, currentMission } = useGameStore();
    
    // Config
    const MAP_SIZE = 140; // px
    const RANGE = 5000; // units in game
    
    if (!currentMission) return null;

    const targetX = currentMission.targetOffsetX || 0;
    const targetZ = -currentMission.distanceKm * 1000;

    // Relative calculation
    const dx = targetX - planePosition.x;
    const dz = targetZ - planePosition.z;

    // Rotate vector to align with plane heading (Radar style)
    const theta = planeRotation;
    const rX = dx * Math.cos(theta) - dz * Math.sin(theta);
    const rZ = dx * Math.sin(theta) + dz * Math.cos(theta);

    // Scale to map (Map Y goes down, 3D Z goes 'forward' (up on map if -Z))
    // We want -rZ to be Up (Negative Y).
    const scale = (MAP_SIZE / 2) / RANGE;
    
    // Clamp dot to circle
    let dotX = rX * scale;
    let dotY = rZ * scale; // Inverted Z for screen Y
    
    const dist = Math.sqrt(dotX*dotX + dotY*dotY);
    const maxDist = (MAP_SIZE / 2) - 5;
    
    if (dist > maxDist) {
        const ratio = maxDist / dist;
        dotX *= ratio;
        dotY *= ratio;
    }

    return (
        <div className="relative rounded-full border-2 border-slate-600 bg-slate-900/80 backdrop-blur overflow-hidden shadow-xl"
             style={{ width: MAP_SIZE, height: MAP_SIZE }}>
            
            {/* Grid / Radar Rings */}
            <div className="absolute inset-0 opacity-20 flex items-center justify-center">
                 <div className="border border-green-500 rounded-full w-[60%] h-[60%]"></div>
            </div>
            <div className="absolute inset-0 opacity-20 flex items-center justify-center">
                 <div className="w-full h-[1px] bg-green-500"></div>
            </div>
            <div className="absolute inset-0 opacity-20 flex items-center justify-center">
                 <div className="h-full w-[1px] bg-green-500"></div>
            </div>

            {/* Player Icon (Fixed Center) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white">
                <Plane size={16} fill="white" className="text-white" />
            </div>

            {/* Destination Dot */}
            <div 
                className={`absolute w-3 h-3 rounded-full border border-black transition-transform duration-100 ${dist > maxDist ? 'bg-yellow-500 animate-pulse' : 'bg-green-400'}`}
                style={{ 
                    top: '50%', 
                    left: '50%', 
                    transform: `translate(${dotX - 6}px, ${dotY - 6}px)` 
                }}
            />
            
            {/* North Indicator */}
            <div 
                className="absolute text-[8px] font-bold text-sky-500"
                style={{
                    top: '50%',
                    left: '50%',
                    transform: `translate(${Math.sin(theta) * (maxDist-10)}px, ${-Math.cos(theta) * (maxDist-10)}px)`
                }}
            >
                N
            </div>
        </div>
    )
};

export const HUD = () => {
  const { 
    gameState, 
    setGameState, 
    planeSpeed, 
    planeAltitude, 
    distanceToTarget, 
    currentMission, 
    setCurrentMission,
    money,
    addMoney,
    inventory,
    buyItem,
    equippedSkin,
    saveGame,
    loadGame,
    playerNameTag,
    setPlayerNameTag,
    systems,
    toggleSystem,
    setSystemMessage,
    controls,
    setControl
  } = useGameStore();

  const [menuSection, setMenuSection] = useState<'HOME' | 'GARAGE' | 'SETTINGS' | 'MISSIONS'>('HOME');
  const [garageTab, setGarageTab] = useState<ShopCategory>('PLANES');
  const [redeemCode, setRedeemCode] = useState('');
  const [codeMessage, setCodeMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const [showSystemMenu, setShowSystemMenu] = useState(false);

  useEffect(() => { loadGame(); }, []);

  // Clear system messages after 3s
  useEffect(() => {
      if(systems.passengerAnnouncement) {
          const t = setTimeout(() => setSystemMessage(null), 3000);
          return () => clearTimeout(t);
      }
  }, [systems.passengerAnnouncement]);

  const handleStartMission = (km: number) => {
    const randomCity = CITIES[Math.floor(Math.random() * CITIES.length)];
    const maxOffset = km * 400; 
    const randomOffsetX = (Math.random() - 0.5) * 2 * maxOffset;

    const newMission: Mission = {
      id: Math.random().toString(),
      distanceKm: km,
      reward: km * 100,
      destinationName: randomCity,
      targetOffsetX: randomOffsetX
    };
    setCurrentMission(newMission);
    setGameState('PLAYING');
    setMenuSection('HOME');
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const code = redeemCode.trim();
      
      if (code === 'G*b1_BFF') {
          setPlayerNameTag("Kazada com Matheus 🌈");
          setCodeMessage({ text: "TAG ESPECIAL: KAZADA COM MATHEUS 🌈", type: 'success' });
          saveGame();
      } else if (code === 'PEDRO_DEV') {
          setPlayerNameTag("Pedro gostoso");
          setCodeMessage({ text: "TAG ESPECIAL: PEDRO GOSTOSO", type: 'success' });
          saveGame();
      } else {
          setCodeMessage({ text: "CÓDIGO INVÁLIDO OU EXPIRADO", type: 'error' });
      }
      setTimeout(() => setCodeMessage(null), 3000);
      setRedeemCode('');
  };

  // --- BACKGROUND COMPONENT ---
  const MenuBackground = () => (
    <div className="absolute inset-0 z-0 bg-slate-950 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-20" 
            style={{ 
                backgroundImage: 'linear-gradient(#0ea5e9 1px, transparent 1px), linear-gradient(90deg, #0ea5e9 1px, transparent 1px)', 
                backgroundSize: '40px 40px',
                transform: 'perspective(500px) rotateX(60deg) translateY(-100px) scale(2)' 
            }}>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950"></div>
    </div>
  );

  // --- SUB-SCREENS ---
  const renderHome = () => (
      <div className="flex flex-col items-center justify-center h-full w-full animate-in fade-in zoom-in-95 duration-500 pb-1 md:pb-2">
          {/* Main Cards */}
          <div className="flex flex-row gap-2 md:gap-8 w-full max-w-6xl px-4 items-stretch justify-center h-32 md:h-80">
              <MenuCard title="DECOLAR" subtitle="INICIAR" icon={<Play className="w-5 h-5 md:w-12 md:h-12" />} color="sky" onClick={() => setMenuSection('MISSIONS')} highlight />
              <MenuCard title="GARAGEM" subtitle="VISUAL" icon={<Wrench className="w-5 h-5 md:w-12 md:h-12" />} color="yellow" onClick={() => setMenuSection('GARAGE')} />
              <MenuCard title="SISTEMA" subtitle="OPÇÕES" icon={<Settings className="w-5 h-5 md:w-12 md:h-12" />} color="slate" onClick={() => setMenuSection('SETTINGS')} />
          </div>
          {/* Footer Bar */}
          <div className="mt-4 md:mt-16 w-full max-w-6xl px-4 flex justify-between items-end border-t border-slate-800 pt-2 md:pt-8">
              <div className="bg-slate-900 border-l-2 md:border-l-4 border-green-500 p-2 pl-3 md:p-4 md:pl-6 flex items-center gap-2 md:gap-6 shadow-2xl">
                  <div className="text-green-500"><Coins className="w-4 h-4 md:w-8 md:h-8" strokeWidth={1.5} /></div>
                  <div>
                      <div className="text-[6px] md:text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">Saldo</div>
                      <div className="text-lg md:text-4xl font-mono text-white font-bold tracking-tighter leading-none">R$ {money.toFixed(0)}</div>
                  </div>
              </div>

               <div className="flex flex-col items-end">
                 {codeMessage && (
                      <div className={`mb-1 md:mb-2 text-[6px] md:text-[10px] font-bold uppercase tracking-widest px-1 md:px-2 py-0.5 md:py-1 ${codeMessage.type === 'success' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
                          {codeMessage.text}
                      </div>
                  )}
                  <form onSubmit={handleCodeSubmit} className="flex items-center bg-slate-900 border border-slate-700 hover:border-sky-500 transition-colors p-0.5 md:p-1">
                      <div className="bg-slate-800 p-1 md:p-2 text-slate-500"><Hash className="w-3 h-3 md:w-5 md:h-5"/></div>
                      <input 
                          type="text" 
                          value={redeemCode}
                          onChange={(e) => setRedeemCode(e.target.value)}
                          placeholder="CÓDIGO"
                          className="bg-transparent border-none outline-none text-white font-mono text-xs md:text-lg px-2 md:px-4 w-24 md:w-64 uppercase placeholder:text-slate-700"
                      />
                      <button type="submit" className="bg-slate-800 hover:bg-sky-500 hover:text-white text-slate-400 p-1 md:p-3 transition-colors">
                          <ChevronRight className="w-3 h-3 md:w-5 md:h-5" />
                      </button>
                  </form>
              </div>
          </div>
      </div>
  );

  const renderMissions = () => (
       <div className="w-full max-w-6xl h-[70vh] md:h-[80vh] flex flex-col animate-in slide-in-from-right fade-in duration-300 mt-4 md:mt-0">
          <MenuHeader title="SELETOR DE MISSÃO" subtitle="DESTINO" onBack={() => setMenuSection('HOME')} />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-0 border-t border-l border-slate-800 overflow-y-auto custom-scrollbar">
              {[1, 2, 5, 7, 17, 35].map((km, i) => (
                  <button key={km} onClick={() => handleStartMission(km)} className="group relative bg-slate-950 border-r border-b border-slate-800 hover:bg-slate-900 transition-all p-3 md:p-8 flex flex-col text-left overflow-hidden h-32 md:h-64">
                      <div className="absolute top-2 right-2 md:top-6 md:right-6 opacity-20 group-hover:opacity-100 group-hover:text-sky-500 transition-all duration-500"><Map className="w-6 h-6 md:w-12 md:h-12" strokeWidth={1} /></div>
                      <div className="text-[8px] md:text-xs text-slate-500 font-mono mb-1 md:mb-4 tracking-widest">CONTRATO // {2040 + i}</div>
                      <div className="mt-auto">
                          <div className="text-3xl md:text-6xl font-black italic text-white mb-1 md:mb-2 group-hover:text-sky-400 transition-colors leading-none">{km}<span className="text-xs md:text-lg text-slate-600 not-italic ml-1 md:ml-2 font-light">KM</span></div>
                          <div className="flex items-center gap-2 md:gap-3 text-green-500 font-mono"><span className="text-sm md:text-xl font-bold">R$ {km * 100}</span></div>
                      </div>
                  </button>
              ))}
          </div>
      </div>
  );

  const renderGarage = () => <div className="text-white text-center">Garage Not Loaded</div>; 
  const renderSettings = () => <div className="text-white text-center">Settings Not Loaded</div>;

  if (gameState === 'SPLASH') return null;

  if (gameState === 'MENU') {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center font-sans overflow-hidden">
        <MenuBackground />
        <div className={`z-10 transition-all duration-500 flex flex-col items-center ${menuSection !== 'HOME' ? 'scale-50 md:scale-75 mb-1 mt-1 absolute top-0' : 'scale-50 md:scale-100 mb-2 md:mb-16 mt-2 md:mt-0'}`}>
            <div className="flex items-center gap-2 md:gap-4">
                 <div className="bg-sky-600 p-1.5 md:p-3 transform skew-x-[-12deg] shadow-[0_0_30px_#0ea5e9]">
                    <Plane className="text-white transform -rotate-45 skew-x-[12deg] w-4 h-4 md:w-8 md:h-8" />
                 </div>
                 <h1 className="text-4xl md:text-7xl font-black italic text-white tracking-tighter leading-none drop-shadow-2xl">AERO<span className="text-sky-500">EXPRESS</span></h1>
            </div>
        </div>
        <div className="z-10 w-full flex justify-center px-4 md:px-6 h-full items-center">
            {menuSection === 'HOME' && renderHome()}
            {menuSection === 'MISSIONS' && renderMissions()}
            {menuSection === 'GARAGE' && <div className="text-white">Garage (Use previous implementation)</div>} 
            {menuSection === 'SETTINGS' && <div className="text-white">Settings (Use previous implementation)</div>}
        </div>
      </div>
    );
  }

  if (gameState === 'SUCCESS' || gameState === 'CRASHED') {
      return (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 text-white z-50">
              <div className="text-center">
                  <h1 className="text-4xl font-bold mb-4">{gameState === 'SUCCESS' ? 'MISSÃO CUMPRIDA' : 'CRITICAL FAILURE'}</h1>
                  <button onClick={() => { if(gameState==='SUCCESS') addMoney(currentMission?.reward || 0); setGameState('MENU'); }} className="px-8 py-4 bg-sky-600 hover:bg-sky-500 font-bold rounded">CONTINUAR</button>
              </div>
          </div>
      )
  }

  // --- IN-GAME HUD (CONTROLS) ---
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-0 font-sans">
      
      {/* Top Bar (Info) */}
      <div className="flex justify-between items-start p-4 pointer-events-auto">
        <div className="bg-slate-900/80 border border-slate-700 p-2 rounded flex gap-4 text-white">
             <div>
                 <div className="text-[10px] text-slate-400 font-bold">ALTITUDE</div>
                 <div className="text-xl font-mono">{planeAltitude} <span className="text-xs">ft</span></div>
             </div>
             <div>
                 <div className="text-[10px] text-slate-400 font-bold">SPEED</div>
                 <div className="text-xl font-mono">{planeSpeed} <span className="text-xs">km/h</span></div>
             </div>
             <div>
                 <div className="text-[10px] text-slate-400 font-bold">DIST</div>
                 <div className="text-xl font-mono text-sky-400">{distanceToTarget} <span className="text-xs">km</span></div>
             </div>
        </div>

        {/* 3 DOTS MENU BUTTON */}
        <div className="relative z-50">
            <button 
                onClick={() => setShowSystemMenu(!showSystemMenu)}
                className={`p-3 rounded-full text-white transition-all duration-300 shadow-lg ${showSystemMenu ? 'bg-sky-600 rotate-90' : 'bg-slate-950/40 backdrop-blur-md hover:bg-white/10'}`}
            >
                <MoreHorizontal size={24} />
            </button>

            {/* DROPDOWN MENU - MODERN GLASS DESIGN */}
            {showSystemMenu && (
                <div className="absolute top-16 right-0 w-72 bg-slate-950/90 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl p-4 max-h-[70vh] overflow-y-auto custom-scrollbar animate-in slide-in-from-top-5 fade-in duration-200 border-none">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Ship Systems</span>
                        <div className="flex gap-1">
                            <div className="w-1 h-1 rounded-full bg-slate-600"></div>
                            <div className="w-1 h-1 rounded-full bg-slate-600"></div>
                            <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                        <div className="space-y-1">
                            <div className="text-[9px] text-slate-600 font-bold uppercase px-2 mb-1">Exterior</div>
                            <SystemToggle label="Luzes Nav" active={systems.navLights} onClick={() => toggleSystem('navLights')} icon={<Zap size={16}/>} />
                            <SystemToggle label="Luzes Strobe" active={systems.strobeLights} onClick={() => toggleSystem('strobeLights')} icon={<Zap size={16}/>} />
                            <SystemToggle label="Trem de Pouso" active={systems.landingGear} onClick={() => toggleSystem('landingGear')} icon={<ArrowLeft size={16} className="rotate-90"/>} warning={planeAltitude > 500 && !systems.landingGear} />
                            <SystemToggle label="Porta Cabine" active={systems.doorOpen} onClick={() => toggleSystem('doorOpen')} icon={<Power size={16}/>} warning={planeSpeed > 50} />
                        </div>

                        <div className="h-px bg-slate-800/50 my-2"></div>

                        <div className="space-y-1">
                             <div className="text-[9px] text-slate-600 font-bold uppercase px-2 mb-1">Passageiros</div>
                            <SystemAction label="Avisar Passageiros" onClick={() => setSystemMessage("Senhores passageiros, apertem os cintos!")} icon={<Mic size={16}/>} />
                            <SystemAction label="Aviso Turbulência" onClick={() => setSystemMessage("Atenção: Turbulência à frente.")} icon={<AlertTriangle size={16} className="text-yellow-500"/>} />
                            <SystemToggle label="Sinal Cintos" active={systems.seatbeltSign} onClick={() => toggleSystem('seatbeltSign')} icon={<AlertTriangle size={16}/>} />
                            <SystemToggle label="Proibido Fumar" active={systems.noSmokingSign} onClick={() => toggleSystem('noSmokingSign')} icon={<AlertTriangle size={16}/>} />
                        </div>

                        <div className="h-px bg-slate-800/50 my-2"></div>

                        <div className="space-y-1">
                            <div className="text-[9px] text-slate-600 font-bold uppercase px-2 mb-1">Conforto</div>
                            <SystemToggle label="Wi-Fi a Bordo" active={systems.wifi} onClick={() => toggleSystem('wifi')} icon={<Wifi size={16}/>} />
                            <SystemToggle label="Ar Condicionado" active={systems.cabinAC} onClick={() => toggleSystem('cabinAC')} icon={<Fan size={16}/>} />
                            <SystemToggle label="Serviço de Bordo" active={systems.mealService} onClick={() => toggleSystem('mealService')} icon={<Coffee size={16}/>} />
                            <SystemAction label="Fazer Café" onClick={() => setSystemMessage("Café sendo preparado na galley.")} icon={<Coffee size={16}/>} />
                            <SystemAction label="Descarga Toalete" onClick={() => setSystemMessage("Vuuuush!")} icon={<Wrench size={16}/>} />
                        </div>

                        <div className="h-px bg-slate-800/50 my-2"></div>

                        <div className="space-y-1">
                            <div className="text-[9px] text-slate-600 font-bold uppercase px-2 mb-1">Técnico</div>
                            <SystemToggle label="Aquecer Pitot" active={systems.pitotHeat} onClick={() => toggleSystem('pitotHeat')} icon={<Thermometer size={16}/>} />
                            <SystemToggle label="Sistema De-Ice" active={systems.deIce} onClick={() => toggleSystem('deIce')} icon={<Thermometer size={16}/>} />
                            <SystemToggle label="APU Generator" active={systems.apu} onClick={() => toggleSystem('apu')} icon={<Zap size={16}/>} />
                            <SystemToggle label="Despejo Combust." active={systems.fuelDump} onClick={() => toggleSystem('fuelDump')} icon={<AlertTriangle size={16} className="text-red-500"/>} />
                            <SystemAction label="Slide Emergência" onClick={() => setSystemMessage("Escorregadores armados!")} icon={<AlertTriangle size={16}/>} />
                            <SystemToggle label="SOS Beacon" active={systems.distressBeacon} onClick={() => toggleSystem('distressBeacon')} icon={<Wifi size={16} className="text-red-500"/>} />
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* MOBILE CONTROLS AND RADAR */}
      <div className="absolute inset-0 pointer-events-none flex justify-between items-end p-8 pb-12">
          {/* LEFT SIDE: THROTTLE & RADAR */}
          <div className="pointer-events-auto flex gap-4 items-end">
              <div className="bg-slate-900/50 backdrop-blur rounded-lg p-2 border border-slate-700 h-48 w-16 relative">
                  <div className="absolute -left-8 bottom-1/2 -rotate-90 text-xs font-bold text-slate-400 tracking-widest">THROTTLE</div>
                  <input 
                    type="range" 
                    min="0" max="1" step="0.01" 
                    value={controls.throttle}
                    onChange={(e) => setControl('throttle', parseFloat(e.target.value))}
                    className="w-40 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90"
                  />
                  <div className="absolute bottom-2 left-0 right-0 text-center font-mono text-sky-400 text-sm">{(controls.throttle * 100).toFixed(0)}%</div>
              </div>
              
              {/* RADAR / MINIMAP */}
              <Minimap />
          </div>

          {/* RIGHT SIDE: JOYSTICK */}
          <div className="pointer-events-auto">
              <VirtualJoystick onChange={(x, y) => {
                  setControl('roll', x);
                  setControl('pitch', y);
              }} />
          </div>
      </div>
    </div>
  );
};

// --- UPDATED HELPER COMPONENTS FOR BORDERLESS DESIGN ---

const SystemToggle = ({ label, active, onClick, icon, warning }: any) => (
    <button onClick={onClick} className="group w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 hover:bg-white/5 active:scale-95">
        <div className={`flex items-center gap-3 transition-colors ${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>
            <div className={`${active ? 'text-sky-400' : 'text-slate-600'} transition-colors duration-300`}>{icon}</div>
            <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
        </div>
        
        {/* Modern Indicator Dot */}
        <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_10px_currentColor] transition-all duration-300 ${active ? (warning ? 'bg-red-500 shadow-red-500/50' : 'bg-sky-400 shadow-sky-400/50 scale-125') : 'bg-slate-800'}`}></div>
    </button>
)

const SystemAction = ({ label, onClick, icon }: any) => (
    <button onClick={onClick} className="group w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:bg-white/5 active:scale-95 text-left">
        <div className="text-slate-600 group-hover:text-slate-300 transition-colors">{icon}</div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-white transition-colors">{label}</span>
    </button>
)

const MenuCard = ({ title, subtitle, icon, color, onClick, highlight }: any) => {
    const colors = { sky: "hover:bg-sky-600 hover:border-sky-400", yellow: "hover:bg-yellow-600 hover:border-yellow-400", slate: "hover:bg-slate-600 hover:border-slate-400" }
    return (
        <button onClick={onClick} className={`group relative h-full flex-1 transform skew-x-[-10deg] bg-slate-900 border-l-2 md:border-l-8 border-r border-y border-slate-800 transition-all duration-200 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden ${colors[color as keyof typeof colors]} ${highlight ? 'border-l-sky-500' : 'border-l-slate-700'}`}>
            <div className="transform skew-x-[10deg] h-full flex flex-col items-center justify-center gap-1 md:gap-6">
                <div className={`p-0 text-slate-500 transition-colors group-hover:text-white duration-300`}>{icon}</div>
                <div className="text-center z-10">
                    <div className="text-lg md:text-4xl font-black italic text-white uppercase tracking-tighter leading-none">{title}</div>
                    <div className="text-[6px] md:text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mt-0.5 md:mt-2 group-hover:text-white/80">{subtitle}</div>
                </div>
            </div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"></div>
        </button>
    )
}
const MenuHeader = ({ title, subtitle, onBack }: any) => (
    <div className="flex items-center gap-2 md:gap-6 mb-2 md:mb-8 bg-slate-900 p-2 md:p-4 border-l-2 md:border-l-4 border-white">
        <button onClick={onBack} className="p-1 md:p-3 bg-slate-800 text-slate-400 hover:bg-white hover:text-black transition-colors"><ArrowLeft className="w-4 h-4 md:w-6 md:h-6" /></button>
        <div>
            <h2 className="text-xl md:text-4xl font-black italic text-white uppercase tracking-tighter leading-none">{title}</h2>
            <div className="text-[6px] md:text-xs font-bold text-slate-500 uppercase tracking-[0.3em]">{subtitle}</div>
        </div>
    </div>
)
const VirtualJoystick = ({ onChange }: { onChange: (x: number, y: number) => void }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const stickRef = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(false);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const handleStart = () => setActive(true);
    const handleEnd = () => { setActive(false); setPos({ x: 0, y: 0 }); onChange(0, 0); };
    const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
        if (!active || !containerRef.current) return;
        let clientX, clientY;
        if ('touches' in e) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; } else { clientX = (e as React.MouseEvent).clientX; clientY = (e as React.MouseEvent).clientY; }
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const maxDist = rect.width / 2;
        let dx = clientX - centerX;
        let dy = clientY - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > maxDist) { const angle = Math.atan2(dy, dx); dx = Math.cos(angle) * maxDist; dy = Math.sin(angle) * maxDist; }
        setPos({ x: dx, y: dy });
        onChange(dx / maxDist, dy / maxDist);
    };
    return (
        <div ref={containerRef} className="w-32 h-32 md:w-48 md:h-48 bg-slate-900/50 backdrop-blur rounded-full border-2 border-slate-600 relative touch-none shadow-xl" onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd} onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd} onMouseLeave={handleEnd}>
            <div ref={stickRef} className="absolute w-12 h-12 md:w-16 md:h-16 bg-sky-500 rounded-full shadow-[0_0_20px_#0ea5e9] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-linear pointer-events-none border-4 border-sky-300" style={{ transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))` }}></div>
            <div className="absolute top-1/2 left-2 right-2 h-px bg-slate-600/50 pointer-events-none"></div>
            <div className="absolute left-1/2 top-2 bottom-2 w-px bg-slate-600/50 pointer-events-none"></div>
        </div>
    )
}

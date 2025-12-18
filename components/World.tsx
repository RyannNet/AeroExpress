
import React, { useMemo } from 'react';
import { useGameStore } from '../store';
import { Vector3, Color } from 'three';
import { Text, Instance, Instances } from '@react-three/drei';

// --- CONFIGURAÇÃO VISUAL ---
const COLORS = {
    water: "#29b6f6", // Azul caribe
    sand: "#f6e0b5",  // Areia clara
    grass: "#66bb6a", // Verde vibrante
    rock: "#78909c",  // Cinza azulado
    snow: "#ffffff",
    asphalt: "#37474f",
    markings: "#eceff1"
};

export const World = () => {
  const { currentMission } = useGameStore();

  // Coordenadas do destino
  const targetZ = currentMission ? -currentMission.distanceKm * 1000 : -10000;
  const targetX = currentMission?.targetOffsetX || 0;

  // Gerar cenário proceduralmente baseado na semente da missão (ou aleatório se sem missão)
  // Usamos useMemo para não recalcular a cada frame, apenas quando a missão muda
  const scenery = useMemo(() => {
      const islands: any[] = [];
      const clouds: any[] = [];
      
      // 1. ILHAS NO CAMINHO (Arquipélago)
      // Gerar ilhas a cada ~1000m a ~2000m ao longo do caminho até o destino
      const distance = Math.abs(targetZ);
      const numIslands = Math.floor(distance / 1500) + 5; 

      for (let i = 0; i < numIslands; i++) {
          // Progresso de 0 a 1 do caminho
          const t = i / numIslands;
          
          // Posição base interpolada entre HQ (0,0,0) e Destino (targetX, 0, targetZ)
          const baseX = t * targetX;
          const baseZ = t * targetZ;

          // Adicionar "jitter" (desvio aleatório) para não ficar uma linha reta de ilhas
          // Quanto mais longe, maior a dispersão lateral
          const spread = 2000; 
          const posX = baseX + (Math.random() - 0.5) * spread;
          const posZ = baseZ + (Math.random() - 0.5) * spread;

          // Não colocar ilha muito perto do HQ (0,0) nem do destino exato agora
          if (Math.abs(posZ) < 1000 || Math.abs(posZ - targetZ) < 500) continue;

          const type = Math.random() > 0.7 ? 'volcano' : 'flat';
          const scale = 50 + Math.random() * 150;

          islands.push({ x: posX, z: posZ, scale, type });
      }

      // 2. NUVENS
      // Espalhar nuvens em altitudes variadas
      const numClouds = 100;
      for (let i = 0; i < numClouds; i++) {
           const cx = (Math.random() - 0.5) * 6000 + (targetX / 2); // Espalha ao redor da rota média
           const cz = (Math.random() * targetZ * 1.2) + 1000; // Do início até além do destino
           const cy = 200 + Math.random() * 400; // Altitude 200ft a 600ft
           const scale = 20 + Math.random() * 40;
           clouds.push({ x: cx, y: cy, z: cz, scale });
      }

      return { islands, clouds };
  }, [currentMission, targetX, targetZ]);

  return (
    <group>
      {/* --- OCEANO INFINITO --- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]} receiveShadow>
        <planeGeometry args={[100000, 100000]} />
        <meshStandardMaterial color={COLORS.water} roughness={0.2} metalness={0.1} />
      </mesh>

      {/* --- ILHA INICIAL (HQ) --- */}
      <group position={[0, -4, -200]}> {/* Centralizada na pista */}
          {/* Base Areia */}
          <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0, 0]} receiveShadow>
              <circleGeometry args={[900, 32]} />
              <meshStandardMaterial color={COLORS.sand} roughness={1} />
          </mesh>
          {/* Base Grama */}
          <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.5, 0]} receiveShadow>
              <circleGeometry args={[800, 32]} />
              <meshStandardMaterial color={COLORS.grass} roughness={1} />
          </mesh>
          
          {/* Vegetação do HQ */}
          <Trees count={50} area={700} offsetZ={0} />
          
          {/* Montanhas decorativas ao fundo do aeroporto */}
          <Mountain position={[600, 0, -500]} scale={200} />
          <Mountain position={[-500, 0, -700]} scale={150} />

          {/* Aeroporto HQ */}
          <Runway />
      </group>

      {/* --- ILHAS PROCEDURAIS (O CAMINHO) --- */}
      {scenery.islands.map((island, i) => (
          <group key={`isl-${i}`} position={[island.x, -4, island.z]}>
              {island.type === 'volcano' ? (
                  <VolcanicIsland scale={island.scale} />
              ) : (
                  <FlatIsland scale={island.scale} />
              )}
          </group>
      ))}

      {/* --- NUVENS --- */}
      {scenery.clouds.map((cloud, i) => (
          <Cloud key={`cld-${i}`} position={[cloud.x, cloud.y, cloud.z]} scale={cloud.scale} />
      ))}

      {/* --- ILHA DE DESTINO --- */}
      {currentMission && (
        <group position={[targetX, -4, targetZ]}>
          {/* Base da Ilha da Cidade */}
          <mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow>
              <circleGeometry args={[1200, 64]} />
              <meshStandardMaterial color={COLORS.sand} />
          </mesh>
          <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 1, 0]} receiveShadow>
              <circleGeometry args={[1100, 64]} />
              <meshStandardMaterial color="#8d6e63" /> {/* Terra mais escura/urbana */}
          </mesh>

          {/* Cidade */}
          <CityCenter />

          {/* Pista de Pouso do Destino */}
          <group position={[0, 2, 800]} rotation={[0, Math.PI, 0]}> 
               <Runway simple />
          </group>

          {/* Label Flutuante */}
           <Text
            position={[0, 400, 0]}
            color="white"
            fontSize={80}
            anchorX="center"
            anchorY="middle"
            outlineWidth={2}
            outlineColor="#000"
          >
            {currentMission.destinationName}
          </Text>
          
          {/* Marcador de Anéis */}
          <mesh position={[0, 150, 0]}>
             <torusGeometry args={[80, 5, 16, 100]} />
             <meshBasicMaterial color="#ffff00" />
             <GlowingRing color="#ffff00" />
          </mesh>
        </group>
      )}
    </group>
  );
};

// --- COMPONENTES DE CENÁRIO ---

const Runway = ({ simple = false }) => (
    <group position={[0, 0.2, 0]}>
        {/* Asfalto */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[60, 1500]} />
            <meshStandardMaterial color={COLORS.asphalt} />
        </mesh>
        {/* Marcações */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
            <planeGeometry args={[2, 1200]} />
            <meshStandardMaterial color={COLORS.markings} />
        </mesh>
        
        {/* Prédios do Aeroporto (Apenas HQ) */}
        {!simple && (
            <group position={[60, 0, 200]}>
                <mesh position={[0, 15, 0]} castShadow>
                    <boxGeometry args={[40, 30, 80]} />
                    <meshStandardMaterial color="#90a4ae" />
                </mesh>
                <mesh position={[0, 35, 0]} castShadow>
                     <cylinderGeometry args={[5, 5, 10, 8]} />
                     <meshStandardMaterial color="#b0bec5" />
                     {/* Janelas da Torre */}
                     <meshStandardMaterial emissive="#81d4fa" emissiveIntensity={0.5} attach="material-1" />
                </mesh>
                <Text position={[0, 50, 0]} fontSize={10} color="white" anchorY="bottom">
                    TERMINAL 1
                </Text>
            </group>
        )}
    </group>
);

const FlatIsland = ({ scale }: { scale: number }) => (
    <group>
        <mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow>
            <cylinderGeometry args={[scale, scale + 20, 10, 7]} />
            <meshStandardMaterial color={COLORS.sand} />
        </mesh>
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 5, 0]} receiveShadow>
            <cylinderGeometry args={[scale * 0.8, scale * 0.9, 5, 7]} />
            <meshStandardMaterial color={COLORS.grass} />
        </mesh>
        <Trees count={Math.floor(scale / 5)} area={scale * 0.6} offsetZ={0} />
    </group>
);

const VolcanicIsland = ({ scale }: { scale: number }) => (
    <group>
        <mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow>
             <cylinderGeometry args={[scale, scale + 30, 10, 8]} />
             <meshStandardMaterial color={COLORS.sand} />
        </mesh>
        {/* Montanha Central */}
        <Mountain scale={scale * 2} position={[0, 0, 0]} />
    </group>
);

const Mountain = ({ scale, position }: { scale: number, position: any }) => (
    <group position={position}>
        <mesh position={[0, scale/2, 0]} castShadow>
            <coneGeometry args={[scale * 0.8, scale, 5]} />
            <meshStandardMaterial color={COLORS.rock} flatShading />
        </mesh>
        {/* Pico de Neve */}
        <mesh position={[0, scale * 0.8, 0]}>
            <coneGeometry args={[scale * 0.25, scale * 0.4, 5]} />
            <meshStandardMaterial color={COLORS.snow} />
        </mesh>
    </group>
);

const Trees = ({ count, area, offsetZ }: { count: number, area: number, offsetZ: number }) => {
    // Usando instanciamento simples visual (poderia ser Instances para performance extrema, mas map é ok pra <500)
    const trees = useMemo(() => {
        return new Array(count).fill(0).map(() => ({
            x: (Math.random() - 0.5) * area,
            z: (Math.random() - 0.5) * area + offsetZ,
            scale: 0.5 + Math.random() * 0.8
        }));
    }, [count, area, offsetZ]);

    return (
        <group>
            {trees.map((t, i) => (
                <group key={i} position={[t.x, 0, t.z]} scale={[t.scale * 4, t.scale * 4, t.scale * 4]}>
                    <mesh position={[0, 2, 0]} castShadow>
                        <cylinderGeometry args={[0.5, 0.8, 4, 5]} />
                        <meshStandardMaterial color="#5d4037" />
                    </mesh>
                    <mesh position={[0, 5, 0]} castShadow>
                        <coneGeometry args={[2.5, 6, 5]} />
                        <meshStandardMaterial color="#2e7d32" />
                    </mesh>
                    <mesh position={[0, 7, 0]} castShadow>
                        <coneGeometry args={[2, 5, 5]} />
                        <meshStandardMaterial color="#388e3c" />
                    </mesh>
                </group>
            ))}
        </group>
    );
};

const Cloud = ({ position, scale }: any) => (
    <group position={position}>
        <mesh position={[0, 0, 0]} scale={scale}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="white" transparent opacity={0.8} flatShading />
        </mesh>
        <mesh position={[scale * 0.8, scale * 0.3, 0]} scale={scale * 0.7}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="white" transparent opacity={0.8} flatShading />
        </mesh>
        <mesh position={[-scale * 0.8, scale * 0.2, scale * 0.5]} scale={scale * 0.6}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="white" transparent opacity={0.8} flatShading />
        </mesh>
    </group>
);

const CityCenter = () => {
    // Gerar um grid de prédios
    const buildings = useMemo(() => {
        const b = [];
        for(let x = -3; x <= 3; x++) {
            for(let z = -3; z <= 3; z++) {
                if (Math.abs(x) < 1 && Math.abs(z) < 1) continue; // Centro vazio
                const height = 50 + Math.random() * 150;
                b.push({ 
                    x: x * 80 + (Math.random()-0.5)*20, 
                    z: z * 80 + (Math.random()-0.5)*20, 
                    h: height,
                    color: Math.random() > 0.5 ? "#cfd8dc" : "#90a4ae"
                });
            }
        }
        return b;
    }, []);

    return (
        <group>
            {buildings.map((b, i) => (
                <group key={i} position={[b.x, b.h/2, b.z]}>
                     <mesh castShadow receiveShadow>
                         <boxGeometry args={[40, b.h, 40]} />
                         <meshStandardMaterial color={b.color} />
                     </mesh>
                     {/* Janelas Acesas Aleatórias */}
                     {[...Array(5)].map((_, j) => (
                         <mesh key={j} position={[
                             (Math.random()-0.5)*41, 
                             (Math.random()-0.5)*b.h*0.8, 
                             (Math.random()-0.5)*41
                         ]}>
                             <boxGeometry args={[2, 2, 2]} />
                             <meshStandardMaterial color="#ffeb3b" emissive="#ffeb3b" emissiveIntensity={1} />
                         </mesh>
                     ))}
                </group>
            ))}
        </group>
    )
}

const GlowingRing = ({ color }: { color: string }) => {
    const ref = React.useRef<any>();
    const [scale, setScale] = React.useState(1);
    
    React.useEffect(() => {
        const interval = setInterval(() => {
            setScale(s => s === 1 ? 1.4 : 1);
        }, 600);
        return () => clearInterval(interval);
    }, []);

    return (
        <mesh scale={scale} rotation={[Math.PI/2, 0, 0]}>
            <torusGeometry args={[80, 2, 16, 100]} />
            <meshBasicMaterial color={color} transparent opacity={0.6} />
        </mesh>
    )
}

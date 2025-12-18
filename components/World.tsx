
import React, { useMemo, useRef } from 'react';
import { useGameStore } from '../store';
import { Vector3, Color, RepeatWrapping, TextureLoader } from 'three';
import { Text, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

// --- CONFIGURAÇÃO VISUAL ---
const COLORS = {
    water: "#006994", // Azul oceano profundo
    sand: "#e6c288",  // Areia mais vibrante
    rock: "#78909c",
    snow: "#ffffff",
    markings: "#eceff1"
};

export const World = () => {
  const { currentMission } = useGameStore();

  // --- CARREGAMENTO DE TEXTURAS ---
  // Usando texturas CC0 placeholder confiáveis
  const textures = useTexture({
      grass: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/terrain/grasslight-big.jpg',
      waterNormal: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/water/Water_1_M_Normal.jpg',
      asphalt: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/uv_grid_opengl.jpg', 
  });

  // Configuração de repetição das texturas
  useMemo(() => {
      textures.grass.wrapS = textures.grass.wrapT = RepeatWrapping;
      textures.grass.repeat.set(50, 50);

      textures.waterNormal.wrapS = textures.waterNormal.wrapT = RepeatWrapping;
      textures.waterNormal.repeat.set(20, 20);
      
      textures.asphalt.wrapS = textures.asphalt.wrapT = RepeatWrapping;
      textures.asphalt.repeat.set(1, 20);
  }, [textures]);

  // Animação da Água
  useFrame((state, delta) => {
      textures.waterNormal.offset.x += delta * 0.05;
      textures.waterNormal.offset.y += delta * 0.05;
  });

  // Coordenadas do destino
  const targetZ = currentMission ? -currentMission.distanceKm * 1000 : -10000;
  const targetX = currentMission?.targetOffsetX || 0;

  // Gerar cenário proceduralmente
  const scenery = useMemo(() => {
      const islands: any[] = [];
      const clouds: any[] = [];
      
      const distance = Math.abs(targetZ);
      const numIslands = Math.floor(distance / 1500) + 5; 

      for (let i = 0; i < numIslands; i++) {
          const t = i / numIslands;
          const baseX = t * targetX;
          const baseZ = t * targetZ;
          const spread = 2000; 
          const posX = baseX + (Math.random() - 0.5) * spread;
          const posZ = baseZ + (Math.random() - 0.5) * spread;

          if (Math.abs(posZ) < 1000 || Math.abs(posZ - targetZ) < 500) continue;

          const type = Math.random() > 0.7 ? 'volcano' : 'flat';
          const scale = 50 + Math.random() * 150;

          islands.push({ x: posX, z: posZ, scale, type });
      }

      const numClouds = 100;
      for (let i = 0; i < numClouds; i++) {
           const cx = (Math.random() - 0.5) * 6000 + (targetX / 2); 
           const cz = (Math.random() * targetZ * 1.2) + 1000; 
           const cy = 200 + Math.random() * 400; 
           const scale = 20 + Math.random() * 40;
           clouds.push({ x: cx, y: cy, z: cz, scale });
      }

      return { islands, clouds };
  }, [currentMission, targetX, targetZ]);

  return (
    <group>
      {/* --- OCEANO INFINITO (COM TEXTURA) --- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]} receiveShadow>
        <planeGeometry args={[100000, 100000]} />
        <meshStandardMaterial 
            color={COLORS.water} 
            normalMap={textures.waterNormal} 
            normalScale={new Vector3(1, 1, 1)}
            roughness={0} 
            metalness={0.8} 
        />
      </mesh>

      {/* --- ILHA INICIAL (HQ) --- */}
      <group position={[0, -4, -200]}> 
          {/* Base Areia */}
          <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0, 0]} receiveShadow>
              <circleGeometry args={[900, 32]} />
              <meshStandardMaterial color={COLORS.sand} roughness={1} />
          </mesh>
          {/* Base Grama (Texturizada) */}
          <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.5, 0]} receiveShadow>
              <circleGeometry args={[800, 32]} />
              <meshStandardMaterial map={textures.grass} roughness={0.8} />
          </mesh>
          
          <Trees count={50} area={700} offsetZ={0} />
          <Mountain position={[600, 0, -500]} scale={200} />
          <Mountain position={[-500, 0, -700]} scale={150} />

          {/* Pista elevada para não bugar com o chão (y=0.6 > y=0.5 da grama) */}
          <group position={[0, 0.6, 0]}>
            <Runway />
          </group>
      </group>

      {/* --- ILHAS PROCEDURAIS --- */}
      {scenery.islands.map((island, i) => (
          <group key={`isl-${i}`} position={[island.x, -4, island.z]}>
              {island.type === 'volcano' ? (
                  <VolcanicIsland scale={island.scale} />
              ) : (
                  <FlatIsland scale={island.scale} grassTexture={textures.grass} />
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
          <mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow>
              <circleGeometry args={[1200, 64]} />
              <meshStandardMaterial color={COLORS.sand} />
          </mesh>
          <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 1, 0]} receiveShadow>
              <circleGeometry args={[1100, 64]} />
              {/* Chão da cidade */}
              <meshStandardMaterial color="#5d4037" roughness={0.9} />
          </mesh>

          <CityCenter />

          {/* Pista elevada sobre o terreno da cidade (y=2 é mais alto que y=1 da base da cidade) */}
          <group position={[0, 2, 800]} rotation={[0, Math.PI, 0]}> 
               <Runway simple />
          </group>

           <Text position={[0, 400, 800]} color="white" fontSize={80} anchorX="center" anchorY="middle" outlineWidth={2} outlineColor="#000">
            {currentMission.destinationName}
          </Text>
          
          <mesh position={[0, 150, 800]}>
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
    <group position={[0, 0, 0]}>
        {/* Asfalto Escuro */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[60, 1500]} />
            <meshStandardMaterial 
                color="#263238" 
                roughness={0.6} 
                metalness={0.1} 
                // Polygon Offset evita z-fighting com o chão logo abaixo
                polygonOffset={true}
                polygonOffsetFactor={-1} 
            />
        </mesh>
        {/* Marcações */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
            <planeGeometry args={[2, 1200]} />
            <meshStandardMaterial 
                color={COLORS.markings} 
                emissive={COLORS.markings} 
                emissiveIntensity={0.5} 
                // Garante que a marcação fique sobre o asfalto
                polygonOffset={true}
                polygonOffsetFactor={-2}
            />
        </mesh>
        
        {!simple && (
            <group position={[60, 0, 200]}>
                <mesh position={[0, 15, 0]} castShadow>
                    <boxGeometry args={[40, 30, 80]} />
                    <meshStandardMaterial color="#90a4ae" />
                </mesh>
                <mesh position={[0, 35, 0]} castShadow>
                     <cylinderGeometry args={[5, 5, 10, 8]} />
                     <meshStandardMaterial color="#b0bec5" />
                     <meshStandardMaterial emissive="#81d4fa" emissiveIntensity={0.5} attach="material-1" />
                </mesh>
                <Text position={[0, 50, 0]} fontSize={10} color="white" anchorY="bottom">
                    TERMINAL 1
                </Text>
            </group>
        )}
    </group>
);

const FlatIsland = ({ scale, grassTexture }: { scale: number, grassTexture: any }) => (
    <group>
        <mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow>
            <cylinderGeometry args={[scale, scale + 20, 10, 7]} />
            <meshStandardMaterial color={COLORS.sand} />
        </mesh>
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 5.05, 0]} receiveShadow>
            <cylinderGeometry args={[scale * 0.8, scale * 0.9, 5, 7]} />
            <meshStandardMaterial map={grassTexture} />
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
        <Mountain scale={scale * 2} position={[0, 0, 0]} />
    </group>
);

const Mountain = ({ scale, position }: { scale: number, position: any }) => (
    <group position={position}>
        <mesh position={[0, scale/2, 0]} castShadow>
            <coneGeometry args={[scale * 0.8, scale, 5]} />
            <meshStandardMaterial color={COLORS.rock} flatShading roughness={0.9} />
        </mesh>
        <mesh position={[0, scale * 0.8, 0]}>
            <coneGeometry args={[scale * 0.25, scale * 0.4, 5]} />
            <meshStandardMaterial 
                color={COLORS.snow} 
                roughness={0.1} 
                metalness={0.1} 
                polygonOffset={true}
                polygonOffsetFactor={-1}
            />
        </mesh>
    </group>
);

const Trees = ({ count, area, offsetZ }: { count: number, area: number, offsetZ: number }) => {
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
                        <meshStandardMaterial color="#2e7d32" roughness={0.8} />
                    </mesh>
                    <mesh position={[0, 7, 0]} castShadow>
                        <coneGeometry args={[2, 5, 5]} />
                        <meshStandardMaterial color="#43a047" roughness={0.8} />
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
    const buildings = useMemo(() => {
        const b = [];
        for(let x = -3; x <= 3; x++) {
            for(let z = -3; z <= 3; z++) {
                if (Math.abs(x) < 1 && Math.abs(z) < 1) continue;
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
                         <meshStandardMaterial color={b.color} roughness={0.2} metalness={0.5} />
                     </mesh>
                     {[...Array(5)].map((_, j) => (
                         <mesh key={j} position={[
                             (Math.random()-0.5)*41, 
                             (Math.random()-0.5)*b.h*0.8, 
                             (Math.random()-0.5)*41
                         ]}>
                             <boxGeometry args={[2, 2, 2]} />
                             <meshStandardMaterial 
                                color="#ffeb3b" 
                                emissive="#ffeb3b" 
                                emissiveIntensity={2}
                                polygonOffset={true}
                                polygonOffsetFactor={-2}
                             />
                         </mesh>
                     ))}
                </group>
            ))}
        </group>
    )
}

const GlowingRing = ({ color }: { color: string }) => {
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

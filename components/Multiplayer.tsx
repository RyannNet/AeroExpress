
import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../store';
import { api } from '../services/api';
import { Vector3, Euler } from 'three';
import { Text, Html } from '@react-three/drei';

interface RemotePlaneProps {
  position: [number, number, number];
  rotation: [number, number, number];
  skin?: string;
  id: string;
  nameTag?: string; // Nome sincronizado
}

const RemotePlane: React.FC<RemotePlaneProps> = ({ position, rotation, skin, id, nameTag }) => {
    // Determine color based on skin ID
    let color = "#e74c3c"; // Default Red
    if (skin === 'skin_gold') color = "#ffd700";
    if (skin === 'skin_stealth') color = "#2d3436";

    // --- LÓGICA DE ESTILO (MESMA DO PLANE.TSX) ---
    const displayName = nameTag || `Pilot ${id.substring(0,4)}`;
    const isGabiStyle = displayName === "Kazada com Matheus 🌈";

    // Estilos dinâmicos
    const labelBg = isGabiStyle ? 'rgba(255, 0, 132, 0.42)' : 'rgba(0, 160, 255, 0.49)';
    const textGradientFrom = isGabiStyle ? '#FFEDF8' : '#E0F7FA';
    const textGradientTo = isGabiStyle ? '#FFD7F0' : '#81D4FA';

    return (
        <group position={position} rotation={new Euler(...rotation)}>
             {/* Name Tag */}
             <Html position={[0, 3, 0]} center distanceFactor={15}>
                 <div 
                    className="px-3 py-1.5 rounded-xl backdrop-blur-md shadow-lg flex items-center justify-center min-w-[100px]"
                    style={{ 
                        backgroundColor: labelBg,
                        fontFamily: "'Host Grotesk', sans-serif"
                    }}
                 >
                     <span 
                        className="font-bold text-sm bg-clip-text text-transparent bg-gradient-to-br"
                        style={{ 
                            backgroundImage: `linear-gradient(35deg, ${textGradientFrom}, ${textGradientTo})`
                        }}
                     >
                        {displayName}
                     </span>
                 </div>
             </Html>

             {/* Simple Low Poly Plane Model for remote players */}
            <mesh>
                <boxGeometry args={[1, 1, 4]} />
                <meshStandardMaterial color={color} />
            </mesh>
            <mesh position={[0, 0, -0.5]}>
                <boxGeometry args={[8, 0.2, 1.5]} />
                <meshStandardMaterial color={color} />
            </mesh>
            <mesh position={[0, 0.5, 1.5]}>
                <boxGeometry args={[3, 0.2, 1]} />
                <meshStandardMaterial color={color} />
            </mesh>
        </group>
    );
}

export const Multiplayer = () => {
    const { remotePlayers, updateRemotePlayers, playerId, equippedSkin } = useGameStore();

    useEffect(() => {
        // Connect to WebSocket
        api.connectMultiplayer((players) => {
            // Filter out self if server echoes back
            updateRemotePlayers(players.filter(p => p.id !== playerId));
        });

        return () => api.disconnect();
    }, []);

    return (
        <group>
            {remotePlayers.map((player) => (
                <RemotePlane 
                    key={player.id} 
                    id={player.id}
                    position={player.position} 
                    rotation={player.rotation}
                    skin={player.skin}
                    nameTag={player.nameTag}
                />
            ))}
        </group>
    );
};

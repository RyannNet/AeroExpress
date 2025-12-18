
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3, Quaternion, Euler, MathUtils } from 'three';
import { PerspectiveCamera, Html, Text } from '@react-three/drei';
import { useGameStore } from '../store';
import { api } from '../services/api';

const MIN_SPEED = 0; // Can stop
const MAX_SPEED_GROUND = 0.5;
const TAKEOFF_SPEED = 0.8;
const GRAVITY = 0.01;
const LIFT_COEFFICIENT = 0.015;

// Helper to smooth angles
const lerp = (start: number, end: number, t: number) => {
  return start * (1 - t) + end * t;
};

export const Plane = () => {
  const groupRef = useRef<Group>(null);
  const { 
    gameState, 
    setGameState, 
    setDistanceToTarget, 
    currentMission, 
    setPlaneSpeed, 
    setPlaneAltitude,
    updatePlanePhysics,
    playerId,
    equippedSkin,
    inventory,
    playerNameTag,
    controls, // Virtual controls
    systems,
    setSystemMessage
  } = useGameStore();

  const hasTurbo = inventory.includes('engine_turbo');
  const MAX_SPEED_AIR = hasTurbo ? 3.5 : 2.5;

  // Physics state
  const velocity = useRef(new Vector3(0, 0, 0));
  const currentSpeed = useRef(0);
  const position = useRef(new Vector3(0, 2, 0)); // Start on ground (height 2 for wheels)
  const rotation = useRef(new Euler(0, 0, 0));
  const isGrounded = useRef(true);

  // Blink state
  const [blink, setBlink] = useState(false);
  useEffect(() => {
      const interval = setInterval(() => setBlink(b => !b), 1000);
      return () => clearInterval(interval);
  }, []);

  // --- LÓGICA DE ESTILO BASEADA NO CÓDIGO/NICK ---
  const isGabiStyle = playerNameTag === "Kazada com Matheus 🌈";
  
  // Estilos dinâmicos
  const labelBg = isGabiStyle ? 'rgba(255, 0, 132, 0.42)' : 'rgba(0, 160, 255, 0.49)';
  const textGradientFrom = isGabiStyle ? '#FFEDF8' : '#E0F7FA';
  const textGradientTo = isGabiStyle ? '#FFD7F0' : '#81D4FA';

  // Frame loop
  useFrame((state, delta) => {
    if (gameState !== 'PLAYING' || !groupRef.current) return;

    // --- INPUT HANDLING ---
    // Throttle Control
    const targetSpeed = controls.throttle * MAX_SPEED_AIR;
    // Smooth acceleration
    currentSpeed.current = MathUtils.lerp(currentSpeed.current, targetSpeed, delta * 0.5);

    // Stop if door is open
    if (systems.doorOpen && currentSpeed.current > 0.1) {
        currentSpeed.current = 0;
        if(Math.random() > 0.95) setSystemMessage("FECHE A PORTA PARA DECOLAR!");
    }

    // --- PHYSICS ---
    
    // Pitch & Roll based on Joystick
    const targetPitch = -controls.pitch * 0.8; // Invert Joystick Y for flight feel
    const targetRoll = -controls.roll * 0.8;
    
    // Ground Handling vs Air Handling
    if (isGrounded.current) {
        // Taxiing
        rotation.current.x = 0; // Keep flat on ground
        rotation.current.z = 0;
        // Yaw with roll stick on ground for taxiing
        rotation.current.y += -controls.roll * delta * 0.5 * (currentSpeed.current > 0.1 ? 1 : 0);

        // Takeoff logic
        if (currentSpeed.current > TAKEOFF_SPEED && -controls.pitch > 0.2) {
             isGrounded.current = false;
             velocity.current.y = 0.1; // Jump up slightly
        }
    } else {
        // Flying
        rotation.current.x = lerp(rotation.current.x, targetPitch, delta * 2);
        rotation.current.z = lerp(rotation.current.z, targetRoll, delta * 3);
        
        // Banking turns
        rotation.current.y += rotation.current.z * delta * 0.8;
    }

    // Apply Rotation
    groupRef.current.rotation.set(rotation.current.x, rotation.current.y, rotation.current.z);

    // Calculate Velocity Vector
    const forward = new Vector3(0, 0, -1);
    forward.applyEuler(rotation.current);
    velocity.current.copy(forward).multiplyScalar(currentSpeed.current);

    // Gravity & Lift
    if (!isGrounded.current) {
        const lift = currentSpeed.current * LIFT_COEFFICIENT;
        velocity.current.y -= GRAVITY;
        velocity.current.y += lift * Math.cos(rotation.current.z) * Math.cos(rotation.current.x);
        
        // Stall
        if (currentSpeed.current < 0.3) {
            rotation.current.x += delta * 0.5; // Nose down
        }
    }

    // Update Position
    position.current.add(velocity.current);

    // Ground Collision
    if (position.current.y <= 2) {
        position.current.y = 2;
        isGrounded.current = true;
        velocity.current.y = 0;
        
        // Crash if landing too hard
        if (rotation.current.x < -0.3 || Math.abs(rotation.current.z) > 0.3 || currentSpeed.current > 1.5) {
             // Simplify crash logic for now, maybe bounce?
             // setGameState('CRASHED'); 
        }
        
        // Auto level on ground
        rotation.current.x = 0;
        rotation.current.z = 0;
    } else {
        isGrounded.current = false;
    }

    groupRef.current.position.copy(position.current);

    // --- UPDATES ---
    setPlaneSpeed(Math.round(currentSpeed.current * 400));
    setPlaneAltitude(Math.round((position.current.y - 2) * 10));

    // Update global store state for Minimap (throttled slightly by component render, but good enough)
    updatePlanePhysics(position.current.x, position.current.y, position.current.z, rotation.current.y);

    // Multiplayer Sync
    if (state.clock.elapsedTime % 0.1 < 0.02) {
        api.sendPosition(
            playerId, 
            [position.current.x, position.current.y, position.current.z],
            [rotation.current.x, rotation.current.y, rotation.current.z],
            equippedSkin,
            playerNameTag // Enviando TAG para outros verem o estilo
        );
    }

    // Mission Check with Euclidean Distance
    if (currentMission) {
      const RUNWAY_OFFSET_Z = 800; // Pista de pouso está deslocada 800 unidades no eixo Z relativo à ilha
      
      const targetIslandZ = -currentMission.distanceKm * 1000;
      const targetRunwayZ = targetIslandZ + RUNWAY_OFFSET_Z; // Coordenada Z real da pista
      const targetX = currentMission.targetOffsetX || 0;
      
      // Calculate 3D distance ignoring much of Y
      const dx = position.current.x - targetX;
      const dz = position.current.z - targetRunwayZ;
      const distance = Math.sqrt(dx*dx + dz*dz);

      setDistanceToTarget(Math.round(distance / 10));

      // Sucesso se parar PERTO da pista (raio 300)
      if (distance < 300 && isGrounded.current && currentSpeed.current < 0.1) {
        setGameState('SUCCESS');
      }
    }
    
    // --- CAMERA ---
    // Smooth Orbit-like Follow Camera
    const cameraOffset = new Vector3(0, 8, 25);
    cameraOffset.applyEuler(new Euler(0, rotation.current.y, 0)); // Rotate camera with plane heading only
    
    // Smooth Lerp
    state.camera.position.lerp(position.current.clone().add(cameraOffset), 0.1);
    state.camera.lookAt(position.current.clone().add(new Vector3(0, 0, -10))); // Look slightly ahead
  });

  // Colors
  let fuselageColor = "#e74c3c";
  let wingsColor = "#c0392b";
  if (equippedSkin === 'skin_gold') { fuselageColor = "#ffd700"; wingsColor = "#d4af37"; }
  else if (equippedSkin === 'skin_stealth') { fuselageColor = "#2d3436"; wingsColor = "#000000"; }

  return (
    <group ref={groupRef} position={[0, 2, 0]}>
      
      {/* Name Tag - HTML Overlay */}
      <Html position={[0, 4, 0]} center distanceFactor={15} zIndexRange={[100, 0]}>
         <div 
            className="px-4 py-2 rounded-xl backdrop-blur-md shadow-lg flex items-center justify-center min-w-[120px]"
            style={{ 
                backgroundColor: labelBg,
                fontFamily: "'Host Grotesk', sans-serif"
            }}
         >
             <span 
                className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-br"
                style={{ 
                    backgroundImage: `linear-gradient(35deg, ${textGradientFrom}, ${textGradientTo})`
                }}
             >
                {playerNameTag}
             </span>
         </div>
      </Html>

      {/* Message Bubble */}
      {systems.passengerAnnouncement && (
          <Html position={[0, 6, 0]} center>
              <div className="bg-black/80 text-white px-3 py-1 rounded-full text-xs font-mono whitespace-nowrap border border-white/20">
                  {systems.passengerAnnouncement}
              </div>
          </Html>
      )}

      {/* --- FUSELAGE MODEL --- */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1, 1, 4]} />
        <meshStandardMaterial color={fuselageColor} />
      </mesh>
      
      {/* Cockpit */}
      <mesh position={[0, 0.4, -0.5]}>
          <boxGeometry args={[0.8, 0.5, 1.5]} />
          <meshStandardMaterial color="#34495e" roughness={0.2} />
      </mesh>

      {/* Wings */}
      <mesh position={[0, 0, -0.5]}>
        <boxGeometry args={[8, 0.2, 1.5]} />
        <meshStandardMaterial color={wingsColor} />
      </mesh>

      {/* Wing Lights */}
      {systems.navLights && (
        <>
            <pointLight position={[4, 0, -0.5]} color="green" intensity={blink ? 2 : 0.5} distance={10} />
            <mesh position={[4, 0, -0.5]}>
                <sphereGeometry args={[0.1]} />
                <meshBasicMaterial color={blink ? "#00ff00" : "#003300"} />
            </mesh>
            
            <pointLight position={[-4, 0, -0.5]} color="red" intensity={blink ? 2 : 0.5} distance={10} />
            <mesh position={[-4, 0, -0.5]}>
                <sphereGeometry args={[0.1]} />
                <meshBasicMaterial color={blink ? "#ff0000" : "#330000"} />
            </mesh>
        </>
      )}

      {/* Strobe Light (Tail) */}
      {systems.strobeLights && blink && (
          <pointLight position={[0, 1, 2]} color="white" intensity={5} distance={20} />
      )}

      {/* Tail */}
      <mesh position={[0, 0.5, 1.5]}>
        <boxGeometry args={[3, 0.2, 1]} />
        <meshStandardMaterial color={wingsColor} />
      </mesh>
       {/* Rudder */}
       <mesh position={[0, 0.8, 1.5]}>
        <boxGeometry args={[0.2, 1.5, 1]} />
        <meshStandardMaterial color={wingsColor} />
      </mesh>

      {/* Propeller */}
      <mesh position={[0, 0, -2.1]}>
         <boxGeometry args={[0.5, 0.5, 0.2]} />
         <meshStandardMaterial color="#333" />
      </mesh>
      <PropellerSpinner speed={currentSpeed.current} />

      {/* Landing Gear (Retractable) */}
      {systems.landingGear && (
        <group>
            {/* Front Wheel */}
            <mesh position={[0, -0.8, -1.5]}>
                <cylinderGeometry args={[0.2, 0.2, 0.2, 8]} rotation={[0, 0, Math.PI/2]} />
                <meshStandardMaterial color="#111" />
            </mesh>
            <mesh position={[0, -0.4, -1.5]}>
                <cylinderGeometry args={[0.05, 0.05, 0.8]} />
                <meshStandardMaterial color="#7f8c8d" />
            </mesh>
            {/* Rear Wheels */}
            <mesh position={[1, -0.8, 0.5]}>
                <cylinderGeometry args={[0.2, 0.2, 0.2, 8]} rotation={[0, 0, Math.PI/2]} />
                <meshStandardMaterial color="#111" />
            </mesh>
            <mesh position={[1, -0.4, 0.5]}>
                <cylinderGeometry args={[0.05, 0.05, 0.8]} />
                <meshStandardMaterial color="#7f8c8d" />
            </mesh>
             <mesh position={[-1, -0.8, 0.5]}>
                <cylinderGeometry args={[0.2, 0.2, 0.2, 8]} rotation={[0, 0, Math.PI/2]} />
                <meshStandardMaterial color="#111" />
            </mesh>
            <mesh position={[-1, -0.4, 0.5]}>
                <cylinderGeometry args={[0.05, 0.05, 0.8]} />
                <meshStandardMaterial color="#7f8c8d" />
            </mesh>
        </group>
      )}

      {/* Door (Openable) */}
      <group position={[0.55, 0.2, 0]} rotation={[0, 0, systems.doorOpen ? -Math.PI/2 : 0]}>
         <mesh position={[0, -0.4, 0]}>
             <boxGeometry args={[0.1, 0.8, 0.6]} />
             <meshStandardMaterial color="#95a5a6" />
         </mesh>
      </group>

    </group>
  );
};

const PropellerSpinner = ({ speed }: { speed: number }) => {
    const ref = useRef<any>();
    useFrame((state, delta) => {
        if(ref.current) ref.current.rotation.z += (speed * 10 + 2) * delta * 5;
    });
    return (
        <group ref={ref} position={[0, 0, -2.1]}>
            <mesh>
             <boxGeometry args={[3.5, 0.1, 0.05]} />
             <meshStandardMaterial color="#111" />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
             <boxGeometry args={[3.5, 0.1, 0.05]} />
             <meshStandardMaterial color="#111" />
            </mesh>
        </group>
    )
}

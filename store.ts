
import { create } from 'zustand';
import { GameState, Mission, Trophy, ShopItem, RemotePlayer, AVAILABLE_TROPHIES, SHOP_ITEMS, PlaneSystems, VirtualControls } from './types';
import { api } from './services/api';

interface GameStore {
  // Game State
  gameState: GameState;
  setGameState: (state: GameState) => void;
  
  // Player Identity
  playerNameTag: string;
  setPlayerNameTag: (tag: string) => void;

  // Mission
  currentMission: Mission | null;
  setCurrentMission: (mission: Mission | null) => void;
  missionsCompleted: number;
  
  // Flight Data
  distanceToTarget: number;
  setDistanceToTarget: (dist: number) => void;
  planeSpeed: number;
  setPlaneSpeed: (speed: number) => void;
  planeAltitude: number;
  setPlaneAltitude: (alt: number) => void;
  
  // Position Data for Minimap
  planePosition: { x: number, y: number, z: number };
  planeRotation: number; // Y rotation (heading)
  updatePlanePhysics: (x: number, y: number, z: number, rotation: number) => void;

  // Controls & Systems
  controls: VirtualControls;
  setControl: (key: keyof VirtualControls, value: number) => void;
  
  systems: PlaneSystems;
  toggleSystem: (key: keyof PlaneSystems) => void;
  setSystemMessage: (msg: string | null) => void;

  // Economy & Inventory
  money: number;
  addMoney: (amount: number) => void;
  inventory: string[]; // IDs of owned items
  buyItem: (itemId: string) => boolean;
  equippedSkin: string;
  setEquippedSkin: (skinId: string) => void;

  // Trophies
  trophies: Trophy[];
  checkTrophies: () => void;

  // Multiplayer
  remotePlayers: RemotePlayer[];
  updateRemotePlayers: (players: RemotePlayer[]) => void;
  playerId: string;

  // System
  saveGame: () => Promise<void>;
  loadGame: () => Promise<void>;
}

const INITIAL_SYSTEMS: PlaneSystems = {
  navLights: true,
  strobeLights: false,
  landingGear: true,
  doorOpen: false,
  cargoRamp: false,
  seatbeltSign: true,
  noSmokingSign: true,
  cabinAC: true,
  wifi: false,
  mealService: false,
  coffeeMaker: false,
  toiletsFlushed: false,
  deIce: false,
  pitotHeat: false,
  apu: false,
  fuelDump: false,
  emergencySlide: false,
  distressBeacon: false,
  autoPilot: false,
  passengerAnnouncement: null
};

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: 'SPLASH',
  setGameState: (state) => set({ gameState: state }),

  playerNameTag: "Piloto", // Default name
  setPlayerNameTag: (tag) => set({ playerNameTag: tag }),

  currentMission: null,
  setCurrentMission: (mission) => set((state) => ({ 
      currentMission: mission,
  })),
  missionsCompleted: 0,

  distanceToTarget: 0,
  setDistanceToTarget: (dist) => set({ distanceToTarget: dist }),

  planeSpeed: 0,
  setPlaneSpeed: (speed) => set({ planeSpeed: speed }),

  planeAltitude: 0,
  setPlaneAltitude: (alt) => {
      set({ planeAltitude: alt });
      get().checkTrophies();
  },

  planePosition: { x: 0, y: 0, z: 0 },
  planeRotation: 0,
  updatePlanePhysics: (x, y, z, rotation) => set({ planePosition: { x, y, z }, planeRotation: rotation }),

  // Controls
  controls: { roll: 0, pitch: 0, throttle: 0, yaw: 0 },
  setControl: (key, value) => set((state) => ({
      controls: { ...state.controls, [key]: value }
  })),

  // Systems
  systems: INITIAL_SYSTEMS,
  toggleSystem: (key) => set((state) => {
      // Logic guards
      if (key === 'landingGear' && state.planeAltitude < 20) {
           // Can't retract gear on ground (simplified)
           if (state.systems.landingGear) return state; 
      }
      return { systems: { ...state.systems, [key]: !state.systems[key] } };
  }),
  setSystemMessage: (msg) => set(state => ({
      systems: { ...state.systems, passengerAnnouncement: msg }
  })),

  money: 0,
  addMoney: (amount) => {
      set((state) => ({ money: state.money + amount }));
      get().checkTrophies();
  },

  inventory: ['plane_default', 'skin_default', 'engine_v1', 'sound_stock'],
  equippedSkin: 'skin_default',
  setEquippedSkin: (skinId) => set({ equippedSkin: skinId }),

  buyItem: (itemId) => {
      const state = get();
      const item = SHOP_ITEMS.find(i => i.id === itemId);
      if (!item) return false;
      
      // If already owned, just equip if it's a skin/plane
      if (state.inventory.includes(itemId)) {
          if (item.type === 'skin') set({ equippedSkin: itemId });
          return true;
      }

      if (state.money >= item.price) {
          set({ 
              money: state.money - item.price, 
              inventory: [...state.inventory, itemId] 
          });
          if (item.type === 'skin') set({ equippedSkin: itemId });
          get().checkTrophies(); 
          get().saveGame(); 
          return true;
      }
      return false;
  },

  trophies: AVAILABLE_TROPHIES,
  checkTrophies: () => {
      const state = get();
      const newTrophies = state.trophies.map(t => {
          if (t.unlocked) return t;
          let unlocked = false;
          
          if (t.id === 'first_flight' && state.missionsCompleted >= 1) unlocked = true;
          if (t.id === 'rich' && state.money >= 5000) unlocked = true;
          if (t.id === 'high_flyer' && state.planeAltitude >= 800) unlocked = true;
          if (t.id === 'spender' && state.inventory.length > 4) unlocked = true;

          return unlocked ? { ...t, unlocked: true } : t;
      });
      
      if (JSON.stringify(newTrophies) !== JSON.stringify(state.trophies)) {
          set({ trophies: newTrophies });
      }
  },

  remotePlayers: [],
  updateRemotePlayers: (players) => set({ remotePlayers: players }),
  playerId: Math.random().toString(36).substr(2, 9),

  saveGame: async () => {
      const state = get();
      const data = {
          money: state.money,
          inventory: state.inventory,
          trophies: state.trophies.filter(t => t.unlocked).map(t => t.id),
          missionsCompleted: state.missionsCompleted,
          playerNameTag: state.playerNameTag
      };
      await api.saveGame(data);
  },

  loadGame: async () => {
      const data = await api.loadGame();
      if (data) {
          set((state) => ({
              money: data.money ?? 0,
              inventory: data.inventory ?? ['plane_default', 'skin_default'],
              missionsCompleted: data.missionsCompleted ?? 0,
              playerNameTag: data.playerNameTag ?? "Piloto",
              trophies: state.trophies.map(t => ({
                  ...t,
                  unlocked: data.trophies?.includes(t.id) || false
              }))
          }));
      }
  }
}));

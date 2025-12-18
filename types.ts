
export type GameState = 'SPLASH' | 'MENU' | 'PLAYING' | 'SUCCESS' | 'CRASHED';

export interface Mission {
  id: string;
  distanceKm: number;
  reward: number;
  destinationName: string;
  targetOffsetX: number; // Desvio lateral para não ser linha reta
}

export interface PlaneState {
  position: [number, number, number];
  rotation: [number, number, number];
  speed: number;
  altitude: number;
  heading: number; // degrees
}

export interface PlaneSystems {
  navLights: boolean;
  strobeLights: boolean;
  landingGear: boolean;
  doorOpen: boolean;
  cargoRamp: boolean;
  seatbeltSign: boolean;
  noSmokingSign: boolean;
  cabinAC: boolean;
  wifi: boolean;
  mealService: boolean;
  coffeeMaker: boolean;
  toiletsFlushed: boolean;
  deIce: boolean;
  pitotHeat: boolean;
  apu: boolean;
  fuelDump: boolean;
  emergencySlide: boolean;
  distressBeacon: boolean;
  autoPilot: boolean;
  passengerAnnouncement: string | null;
}

export interface VirtualControls {
  roll: number; // -1 to 1 (Left/Right)
  pitch: number; // -1 to 1 (Up/Down)
  throttle: number; // 0 to 1
  yaw: number; // -1 to 1 (Rudder)
}

export interface Trophy {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  condition?: (store: any) => boolean;
}

export type ShopCategory = 'PLANES' | 'CUSTOMIZATION' | 'PERFORMANCE' | 'AUDIO';

export interface ShopItem {
  id: string;
  name: string;
  category: ShopCategory;
  type: 'skin' | 'upgrade' | 'plane' | 'audio' | 'sticker';
  price: number;
  description: string;
  image?: string;
  statBoost?: number; // Para mostrar na UI de velocidade
}

export interface LeaderboardEntry {
  username: string;
  score: number;
}

export interface RemotePlayer {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  skin?: string;
  nameTag?: string;
}

export const CITIES = [
  "São Paulo", "Rio de Janeiro", "Salvador", "Brasília", "Fortaleza",
  "Belo Horizonte", "Manaus", "Curitiba", "Recife", "Porto Alegre"
];

export const AVAILABLE_TROPHIES: Trophy[] = [
  { id: 'first_flight', title: 'Primeiro Voo', description: 'Complete sua primeira missão.', icon: 'award', unlocked: false },
  { id: 'rich', title: 'Magnata', description: 'Acumule R$ 5.000.', icon: 'dollar-sign', unlocked: false },
  { id: 'high_flyer', title: 'Astronauta', description: 'Atinja 800ft de altitude.', icon: 'arrow-up', unlocked: false },
  { id: 'spender', title: 'Consumista', description: 'Compre um item na loja.', icon: 'shopping-bag', unlocked: false },
];

export const SHOP_ITEMS: ShopItem[] = [
  // PLANES
  { id: 'plane_default', name: 'Cessna Classic', category: 'PLANES', type: 'plane', price: 0, description: 'Confiável e estável.', statBoost: 10 },
  { id: 'plane_jet', name: 'F-22 Raptor', category: 'PLANES', type: 'plane', price: 50000, description: 'Supersônico militar.', statBoost: 90 },
  
  // CUSTOMIZATION (Skins/Colors/Stickers)
  { id: 'skin_default', name: 'Pintura Padrão', category: 'CUSTOMIZATION', type: 'skin', price: 0, description: 'Original de fábrica.', statBoost: 0 },
  { id: 'skin_gold', name: 'Ouro Real', category: 'CUSTOMIZATION', type: 'skin', price: 1500, description: 'Acabamento de luxo.', statBoost: 0 },
  { id: 'skin_stealth', name: 'Preto Tático', category: 'CUSTOMIZATION', type: 'skin', price: 3000, description: 'Indetectável à noite.', statBoost: 0 },
  { id: 'sticker_flames', name: 'Adesivo Chamas', category: 'CUSTOMIZATION', type: 'sticker', price: 500, description: 'Dá +5 cavalos psicológicos.', statBoost: 0 },

  // PERFORMANCE (Turbos/Speed)
  { id: 'engine_v1', name: 'Motor V1 Stock', category: 'PERFORMANCE', type: 'upgrade', price: 0, description: 'Motor padrão.', statBoost: 20 },
  { id: 'engine_turbo', name: 'Turbo MK1', category: 'PERFORMANCE', type: 'upgrade', price: 2000, description: '+20% Velocidade Máxima.', statBoost: 50 },
  { id: 'nitro_boost', name: 'Injeção Nitro', category: 'PERFORMANCE', type: 'upgrade', price: 5000, description: 'Aceleração explosiva.', statBoost: 80 },

  // AUDIO
  { id: 'sound_stock', name: 'Som Original', category: 'AUDIO', type: 'audio', price: 0, description: 'Ronco do motor padrão.', statBoost: 0 },
  { id: 'sound_jet', name: 'Turbina Jato', category: 'AUDIO', type: 'audio', price: 1000, description: 'Som de turbina de alta frequência.', statBoost: 0 },
  { id: 'sound_bass', name: 'Bass Boosted', category: 'AUDIO', type: 'audio', price: 800, description: 'Grave reforçado no turbo.', statBoost: 0 },
];

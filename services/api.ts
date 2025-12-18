
import { RemotePlayer } from '../types';

const API_URL = 'https://aeroexpress-w2bs.onrender.com';
const WS_URL = 'wss://aeroexpress-w2bs.onrender.com';

class APIService {
  private socket: WebSocket | null = null;
  private onPlayerUpdate: ((players: RemotePlayer[]) => void) | null = null;

  // --- REST API ---

  async saveGame(data: any) {
    try {
      const response = await fetch(`${API_URL}/api/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (e) {
      console.warn('Backend offline, saving locally');
      localStorage.setItem('aeroexpress_save', JSON.stringify(data));
      return { success: true, local: true };
    }
  }

  async loadGame() {
    try {
      const response = await fetch(`${API_URL}/api/load`);
      if (response.ok) return await response.json();
      throw new Error('Failed to load');
    } catch (e) {
      console.warn('Backend offline, loading locally');
      const local = localStorage.getItem('aeroexpress_save');
      return local ? JSON.parse(local) : null;
    }
  }

  async getLeaderboard() {
    try {
        const response = await fetch(`${API_URL}/api/leaderboard`);
        if(response.ok) return await response.json();
        // Mock se falhar
        return [
            { username: "AcePilot99", score: 150000 },
            { username: "BaronRed", score: 120000 },
            { username: "SkyWalker", score: 95000 },
            { username: "Goose", score: 80000 },
            { username: "Maverick", score: 500 },
        ];
    } catch (e) {
        return [
            { username: "OfflineUser", score: 0 },
        ];
    }
  }

  // --- MULTIPLAYER (WebSocket) ---

  connectMultiplayer(onUpdate: (players: RemotePlayer[]) => void) {
    this.onPlayerUpdate = onUpdate;
    try {
        this.socket = new WebSocket(WS_URL);
        
        this.socket.onopen = () => {
            console.log('Connected to Sky Ace Multiplayer Server');
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'PLAYERS_UPDATE') {
                    this.onPlayerUpdate?.(data.players);
                }
            } catch (e) {}
        };

        this.socket.onerror = (e) => {
            console.warn('WebSocket error, multiplayer disabled');
        };
    } catch (e) {
        console.warn('Could not connect to multiplayer');
    }
  }

  sendPosition(id: string, position: [number, number, number], rotation: [number, number, number], skin: string, nameTag: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({
            type: 'UPDATE_POS',
            payload: { id, position, rotation, skin, nameTag }
        }));
    }
  }

  disconnect() {
    if (this.socket) this.socket.close();
  }
}

export const api = new APIService();

import { CharacterId, MultiplayerRoomState, RoomPlayerInfo } from '../types';

export interface OpponentUpdatePayload {
  playerId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  hp: number;
  maxHp: number;
  superCharge?: number;
  isShielded?: boolean;
  walkCycle?: number;
  attackAnim?: number;
}

export interface OpponentShootPayload {
  playerId: string;
  bullets: Array<{
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    damage: number;
    radius: number;
    color: string;
    glowColor?: string;
    lifeTime: number;
    isShuriken?: boolean;
    isFlameArrow?: boolean;
    isMagicOrb?: boolean;
    isSwordWave?: boolean;
    isRocketFist?: boolean;
    isSuper?: boolean;
  }>;
}

export interface OpponentSuperPayload {
  playerId: string;
  charId: CharacterId;
  x: number;
  y: number;
}

export interface HitRegisteredPayload {
  targetId: string;
  damage: number;
  newHp: number;
}

type RoomUpdateListener = (state: MultiplayerRoomState) => void;
type BattleStartListener = (state: MultiplayerRoomState) => void;
type OpponentUpdateListener = (data: OpponentUpdatePayload) => void;
type OpponentShootListener = (data: OpponentShootPayload) => void;
type OpponentSuperListener = (data: OpponentSuperPayload) => void;
type HitRegisteredListener = (data: HitRegisteredPayload) => void;
type OpponentLeftListener = () => void;
type ConnectionListener = (connected: boolean) => void;

class MultiplayerService {
  private ws: WebSocket | null = null;
  private currentRoomCode: string | null = null;
  private isConnecting = false;
  private reconnectTimer: number | null = null;
  private playerId: string;
  private playerName: string;

  private roomUpdateListeners: Set<RoomUpdateListener> = new Set();
  private battleStartListeners: Set<BattleStartListener> = new Set();
  private opponentUpdateListeners: Set<OpponentUpdateListener> = new Set();
  private opponentShootListeners: Set<OpponentShootListener> = new Set();
  private opponentSuperListeners: Set<OpponentSuperListener> = new Set();
  private hitRegisteredListeners: Set<HitRegisteredListener> = new Set();
  private opponentLeftListeners: Set<OpponentLeftListener> = new Set();
  private connectionListeners: Set<ConnectionListener> = new Set();

  constructor() {
    // Generate or retrieve persistent playerId and name
    let storedId = '';
    let storedName = '';
    try {
      storedId = localStorage.getItem('brawl_player_id') || '';
      storedName = localStorage.getItem('brawl_player_name') || '';
    } catch {
      // ignore
    }

    if (!storedId) {
      storedId = 'p_' + Math.random().toString(36).substring(2, 9);
      try {
        localStorage.setItem('brawl_player_id', storedId);
      } catch {
        // ignore
      }
    }

    if (!storedName) {
      storedName = `אַלּוּף ${Math.floor(Math.random() * 899) + 100}`;
      try {
        localStorage.setItem('brawl_player_name', storedName);
      } catch {
        // ignore
      }
    }

    this.playerId = storedId;
    this.playerName = storedName;
  }

  public getPlayerId(): string {
    return this.playerId;
  }

  public getPlayerName(): string {
    return this.playerName;
  }

  public setPlayerName(name: string) {
    this.playerName = name;
    try {
      localStorage.setItem('brawl_player_name', name);
    } catch {
      // ignore
    }
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  public connect(): Promise<boolean> {
    if (this.isConnected()) return Promise.resolve(true);
    if (this.isConnecting) return Promise.resolve(false);

    this.isConnecting = true;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const url = `${protocol}//${host}/ws`;

    return new Promise((resolve) => {
      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          this.isConnecting = false;
          this.notifyConnection(true);
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            this.handleMessage(msg);
          } catch (err) {
            console.error('Failed to parse WS message', err);
          }
        };

        this.ws.onclose = () => {
          this.isConnecting = false;
          this.ws = null;
          this.notifyConnection(false);
          // Try to reconnect if in room
          if (this.currentRoomCode && !this.reconnectTimer) {
            this.reconnectTimer = window.setTimeout(() => {
              this.reconnectTimer = null;
              this.connect();
            }, 2500);
          }
        };

        this.ws.onerror = (err) => {
          console.warn('WS error', err);
          this.isConnecting = false;
          resolve(false);
        };
      } catch (e) {
        this.isConnecting = false;
        resolve(false);
      }
    });
  }

  public async joinRoom(
    roomCode: string,
    charId: CharacterId,
    skinIdx: number
  ): Promise<boolean> {
    this.currentRoomCode = roomCode.toUpperCase();
    if (!this.isConnected()) {
      await this.connect();
    }

    if (this.isConnected()) {
      this.send({
        type: 'join_room',
        code: this.currentRoomCode,
        playerId: this.playerId,
        playerName: this.playerName,
        charId,
        skinIdx,
      });
      return true;
    }
    return false;
  }

  public startBattle(roomCode: string) {
    this.send({
      type: 'start_battle',
      code: roomCode.toUpperCase(),
      playerId: this.playerId,
    });
  }

  public sendPlayerUpdate(data: Omit<OpponentUpdatePayload, 'playerId'>) {
    if (!this.currentRoomCode) return;
    this.send({
      type: 'player_update',
      code: this.currentRoomCode,
      playerId: this.playerId,
      ...data,
    });
  }

  public sendPlayerShoot(bullets: OpponentShootPayload['bullets']) {
    if (!this.currentRoomCode) return;
    this.send({
      type: 'player_shoot',
      code: this.currentRoomCode,
      playerId: this.playerId,
      bullets,
    });
  }

  public sendPlayerSuper(charId: CharacterId, x: number, y: number) {
    if (!this.currentRoomCode) return;
    this.send({
      type: 'player_super',
      code: this.currentRoomCode,
      playerId: this.playerId,
      charId,
      x,
      y,
    });
  }

  public sendHitRegistered(targetId: string, damage: number, newHp: number) {
    if (!this.currentRoomCode) return;
    this.send({
      type: 'hit_registered',
      code: this.currentRoomCode,
      targetId,
      damage,
      newHp,
    });
  }

  public leaveRoom() {
    if (this.currentRoomCode) {
      this.send({
        type: 'leave_room',
        code: this.currentRoomCode,
        playerId: this.playerId,
      });
      this.currentRoomCode = null;
    }
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private handleMessage(msg: any) {
    switch (msg.type) {
      case 'room_state':
        this.roomUpdateListeners.forEach((fn) => fn(msg.state));
        break;

      case 'battle_started':
        this.battleStartListeners.forEach((fn) => fn(msg.state));
        break;

      case 'player_update':
        if (msg.playerId !== this.playerId) {
          this.opponentUpdateListeners.forEach((fn) => fn(msg));
        }
        break;

      case 'player_shoot':
        if (msg.playerId !== this.playerId) {
          this.opponentShootListeners.forEach((fn) => fn(msg));
        }
        break;

      case 'player_super':
        if (msg.playerId !== this.playerId) {
          this.opponentSuperListeners.forEach((fn) => fn(msg));
        }
        break;

      case 'hit_registered':
        this.hitRegisteredListeners.forEach((fn) => fn(msg));
        break;

      case 'opponent_left':
        this.opponentLeftListeners.forEach((fn) => fn());
        break;

      default:
        break;
    }
  }

  // Event listener management
  public onRoomUpdate(fn: RoomUpdateListener) {
    this.roomUpdateListeners.add(fn);
    return () => this.roomUpdateListeners.delete(fn);
  }

  public onBattleStart(fn: BattleStartListener) {
    this.battleStartListeners.add(fn);
    return () => this.battleStartListeners.delete(fn);
  }

  public onOpponentUpdate(fn: OpponentUpdateListener) {
    this.opponentUpdateListeners.add(fn);
    return () => this.opponentUpdateListeners.delete(fn);
  }

  public onOpponentShoot(fn: OpponentShootListener) {
    this.opponentShootListeners.add(fn);
    return () => this.opponentShootListeners.delete(fn);
  }

  public onOpponentSuper(fn: OpponentSuperListener) {
    this.opponentSuperListeners.add(fn);
    return () => this.opponentSuperListeners.delete(fn);
  }

  public onHitRegistered(fn: HitRegisteredListener) {
    this.hitRegisteredListeners.add(fn);
    return () => this.hitRegisteredListeners.delete(fn);
  }

  public onOpponentLeft(fn: OpponentLeftListener) {
    this.opponentLeftListeners.add(fn);
    return () => this.opponentLeftListeners.delete(fn);
  }

  public onConnectionChange(fn: ConnectionListener) {
    this.connectionListeners.add(fn);
    return () => this.connectionListeners.delete(fn);
  }

  private notifyConnection(connected: boolean) {
    this.connectionListeners.forEach((fn) => fn(connected));
  }
}

export const multiplayer = new MultiplayerService();

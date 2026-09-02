export type CharacterId = 'spark' | 'storm' | 'titan' | 'phoenix' | 'golem' | 'shadow';
export type CharacterClass = 'shooter' | 'swordsman' | 'mage' | 'archer' | 'heavy' | 'ninja';

export interface PowerUp {
  id: string;
  name: string; // Hebrew with Niqqud
  englishName: string;
  icon: string;
  desc: string; // Hebrew with Niqqud
  statBonus: string; // Hebrew with Niqqud
  cost: number;
}

export interface Skin {
  id: number;
  name: string; // Hebrew with Niqqud
  figureTitle?: string;
  color: string;
  glowColor: string;
  accentColor: string;
  hairColor?: string;
  armorColor?: string;
  weaponColor?: string;
  tagline: string;
  isUnlockedDefault?: boolean;
}

export interface CharacterDef {
  id: CharacterId;
  characterClass: CharacterClass;
  classTitle: string; // Hebrew with Niqqud
  name: string; // Hebrew with Niqqud
  englishName: string;
  weaponName: string; // Hebrew with Niqqud
  tier: 1 | 2 | 3;
  tierName: string; // Hebrew with Niqqud
  tierBadgeColor: string;
  hp: number;
  speed: number;
  damage: number;
  bulletsPerShot: number;
  bulletSpeed: number;
  bulletRadius: number;
  bulletColor: string;
  attackType: 'single' | 'dual' | 'lightning' | 'sword' | 'magic' | 'shooter' | 'arrow' | 'rocket_fist' | 'shuriken';
  superName: string; // Hebrew with Niqqud
  superDesc: string; // Hebrew with Niqqud
  superChargeHitsNeeded: number;
  lore: string; // Hebrew with Niqqud
  trophyRequirement?: number; // Trophies required to unlock if not unlocked by default
  skins: Skin[];
  powerUps: PowerUp[];
}

export interface UserProgress {
  coins: number;
  trophies: number;
  unlockedCharacters: CharacterId[];
  unlockedSkins: Record<CharacterId, number[]>; // Array of unlocked skin IDs
  unlockedPowerUps?: Record<string, boolean>; // PowerUp ID -> unlocked boolean
  equippedPowerUps?: Record<CharacterId, string>; // CharacterId -> equipped PowerUp ID
  selectedChar: CharacterId;
  selectedSkinIdx: number;
  totalWins: number;
  totalLosses: number;
  boxesOpened: number;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  radius: number;
  color: string;
  glowColor: string;
  fromPlayer: boolean;
  isSuper?: boolean;
  isLightning?: boolean;
  isSwordSlash?: boolean;
  isMagicOrb?: boolean;
  isArrow?: boolean;
  isRocketFist?: boolean;
  isShuriken?: boolean;
  slashAngle?: number;
  lifeTime: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  alpha: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  opacity: number;
  vy: number;
}

export interface WallObstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string;
  isDestructible?: boolean;
  hp?: number;
}

export interface BushZone {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RoomPlayerInfo {
  id: string;
  name: string;
  charId: CharacterId;
  skinIdx: number;
  isHost: boolean;
  ready?: boolean;
  hp?: number;
  maxHp?: number;
  x?: number;
  y?: number;
  angle?: number;
  isShielded?: boolean;
  walkCycle?: number;
  attackAnim?: number;
}

export interface MultiplayerRoomState {
  code: string;
  players: RoomPlayerInfo[];
  status: 'waiting' | 'in_battle' | 'ended';
}

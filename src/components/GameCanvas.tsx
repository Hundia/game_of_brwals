import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CharacterDef, Bullet, Particle, FloatingText, WallObstacle, BushZone, RoomPlayerInfo } from '../types';
import { CHARACTERS } from '../utils/gameData';
import { sound } from '../utils/sound';
import { drawHumanoidFigure } from '../utils/renderFigure';
import { multiplayer } from '../utils/multiplayerService';

interface GameCanvasProps {
  character: CharacterDef;
  skinColor: string;
  skinGlow: string;
  skinName: string;
  skinId?: number;
  skinArmorColor?: string;
  skinWeaponColor?: string;
  skinHairColor?: string;
  joystickVector: { x: number; y: number };
  onWin: () => void;
  onLose: () => void;
  onSuperChargeChange: (charge: number) => void;
  onAmmoChange: (ammo: number) => void;
  registerTriggerShoot: (fn: () => void) => void;
  registerTriggerSuper: (fn: () => void) => void;
  multiplayerRoom?: {
    code: string;
    isHost: boolean;
    opponent?: RoomPlayerInfo;
  } | null;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  character,
  skinColor,
  skinGlow,
  skinName,
  skinId = 0,
  skinArmorColor,
  skinWeaponColor,
  skinHairColor,
  joystickVector,
  onWin,
  onLose,
  onSuperChargeChange,
  onAmmoChange,
  registerTriggerShoot,
  registerTriggerSuper,
  multiplayerRoom,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isGuest = multiplayerRoom?.isHost === false;
  const oppBrawler = multiplayerRoom?.opponent
    ? CHARACTERS[multiplayerRoom.opponent.charId] || CHARACTERS.storm
    : null;
  const oppSkin = oppBrawler && multiplayerRoom?.opponent
    ? oppBrawler.skins[multiplayerRoom.opponent.skinIdx] || oppBrawler.skins[0]
    : null;
  const oppInitHp = oppBrawler ? oppBrawler.hp : 120;

  // Internal battle state ref to avoid React state re-render lag in 60fps loop
  const stateRef = useRef({
    // Canvas dimensions
    width: 800,
    height: 480,

    // Player
    player: {
      x: isGuest ? 680 : 120,
      y: 240,
      radius: 22,
      vx: 0,
      vy: 0,
      hp: character.hp,
      maxHp: character.hp,
      speed: character.speed,
      angle: isGuest ? Math.PI : 0, // facing direction in radians
      ammo: 3,
      maxAmmo: 3,
      ammoRegenRate: 0.02, // ammo per frame
      superHits: 0,
      shieldTime: 0, // for Spark / Shooter
      isDashing: false, // for Storm / Swordsman
      dashTime: 0,
      dashVx: 0,
      dashVy: 0,
      inBush: false,
      walkCycle: 0,
      attackAnim: 0,
    },

    // Enemy Bot or Remote Opponent
    enemy: {
      x: isGuest ? 120 : 680,
      y: 240,
      radius: 22,
      vx: 0,
      vy: 0,
      hp: oppInitHp,
      maxHp: oppInitHp,
      speed: 2.8,
      angle: isGuest ? 0 : Math.PI,
      shootCooldown: 0,
      shootInterval: 55, // frames between shots
      stunTime: 0, // for Titan / Mage super
      inBush: false,
      aiDirY: 1,
      aiTimer: 0,
      walkCycle: 0,
      attackAnim: 0,
    },

    bullets: [] as Bullet[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],

    // Walls and cover
    walls: [
      { x: 260, y: 110, w: 45, h: 100, isDestructible: true, hp: 50 },
      { x: 260, y: 270, w: 45, h: 100, isDestructible: true, hp: 50 },
      { x: 495, y: 110, w: 45, h: 100, isDestructible: true, hp: 50 },
      { x: 495, y: 270, w: 45, h: 100, isDestructible: true, hp: 50 },
      { x: 375, y: 190, w: 50, h: 100, isDestructible: false },
    ] as WallObstacle[],

    // Bushes
    bushes: [
      { x: 180, y: 40, w: 100, h: 60 },
      { x: 180, y: 380, w: 100, h: 60 },
      { x: 520, y: 40, w: 100, h: 60 },
      { x: 520, y: 380, w: 100, h: 60 },
      { x: 350, y: 370, w: 100, h: 80 },
    ] as BushZone[],

    keys: {} as Record<string, boolean>,
    screenShake: 0,
    gameEnded: false,
  });

  // Shoot function
  const triggerShoot = useCallback(() => {
    const s = stateRef.current;
    if (s.gameEnded) return;
    if (s.player.ammo < 1) return;

    const prevBulletCount = s.bullets.length;

    s.player.ammo -= 1;
    onAmmoChange(Math.floor(s.player.ammo));

    const p = s.player;
    const e = s.enemy;
    const targetAngle = p.angle;
    p.attackAnim = 1.0; // trigger weapon attack animation

    if (character.characterClass === 'swordsman') {
      // SWORDSMAN: Sword Slash
      sound.playShoot('sword');

      // 1. Close-range Cleave damage
      const distToEnemy = Math.hypot(e.x - p.x, e.y - p.y);
      if (distToEnemy < 75) {
        e.hp = Math.max(0, e.hp - character.damage);
        sound.playHit(true);

        p.superHits = Math.min(character.superChargeHitsNeeded, p.superHits + 1);
        onSuperChargeChange(p.superHits / character.superChargeHitsNeeded);
        if (p.superHits === character.superChargeHitsNeeded) {
          sound.playSuperReady();
        }

        s.floatingTexts.push({
          id: Math.random().toString(),
          x: e.x,
          y: e.y - 25,
          text: `שיסוף חרב! -${character.damage} ⚔️`,
          color: '#60a5fa',
          opacity: 1,
          vy: -1.3,
        });

        // Slash sparks
        for (let k = 0; k < 12; k++) {
          s.particles.push({
            x: e.x + (Math.random() - 0.5) * 20,
            y: e.y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 0,
            maxLife: 20,
            color: skinWeaponColor || '#60a5fa',
            size: Math.random() * 4 + 2,
            alpha: 1,
          });
        }
      }

      // 2. Crescent Blade-Wave Projectile that sweeps forward
      s.bullets.push({
        id: Math.random().toString(),
        x: p.x + Math.cos(targetAngle) * (p.radius + 12),
        y: p.y + Math.sin(targetAngle) * (p.radius + 12),
        vx: Math.cos(targetAngle) * character.bulletSpeed,
        vy: Math.sin(targetAngle) * character.bulletSpeed,
        damage: Math.round(character.damage * 0.85),
        radius: character.bulletRadius,
        color: skinWeaponColor || '#60a5fa',
        glowColor: skinGlow,
        fromPlayer: true,
        isSwordSlash: true,
        lifeTime: 65,
      });
    } else if (character.characterClass === 'mage') {
      // MAGE: Casts Arcane Magic Orb
      sound.playShoot('magic');

      s.bullets.push({
        id: Math.random().toString(),
        x: p.x + Math.cos(targetAngle) * (p.radius + 15),
        y: p.y + Math.sin(targetAngle) * (p.radius + 15),
        vx: Math.cos(targetAngle) * character.bulletSpeed,
        vy: Math.sin(targetAngle) * character.bulletSpeed,
        damage: character.damage,
        radius: character.bulletRadius,
        color: skinColor,
        glowColor: skinGlow,
        fromPlayer: true,
        isMagicOrb: true,
        lifeTime: 75,
      });

      // Magic sparkles around caster
      for (let i = 0; i < 8; i++) {
        const ang = Math.random() * Math.PI * 2;
        s.particles.push({
          x: p.x + Math.cos(ang) * p.radius,
          y: p.y + Math.sin(ang) * p.radius,
          vx: Math.cos(ang) * 2,
          vy: Math.sin(ang) * 2,
          life: 0,
          maxLife: 25,
          color: skinGlow,
          size: Math.random() * 3 + 2,
          alpha: 1,
        });
      }
    } else if (character.characterClass === 'archer') {
      // ARCHER (Phoenix): Fires Flaming Arrow
      sound.playShoot('shooter');

      s.bullets.push({
        id: Math.random().toString(),
        x: p.x + Math.cos(targetAngle) * (p.radius + 15),
        y: p.y + Math.sin(targetAngle) * (p.radius + 15),
        vx: Math.cos(targetAngle) * character.bulletSpeed,
        vy: Math.sin(targetAngle) * character.bulletSpeed,
        damage: character.damage,
        radius: character.bulletRadius,
        color: '#ea580c',
        glowColor: 'rgba(234, 88, 12, 0.9)',
        fromPlayer: true,
        isArrow: true,
        lifeTime: 85,
      });

      // Fire trail sparks
      for (let i = 0; i < 6; i++) {
        s.particles.push({
          x: p.x + Math.cos(targetAngle) * p.radius,
          y: p.y + Math.sin(targetAngle) * p.radius,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          life: 0,
          maxLife: 15,
          color: '#fbbf24',
          size: Math.random() * 3 + 2,
          alpha: 1,
        });
      }
    } else if (character.characterClass === 'heavy') {
      // HEAVY (Golem): Fires Heavy Rocket Fist
      sound.playHit(false);

      s.bullets.push({
        id: Math.random().toString(),
        x: p.x + Math.cos(targetAngle) * (p.radius + 16),
        y: p.y + Math.sin(targetAngle) * (p.radius + 16),
        vx: Math.cos(targetAngle) * character.bulletSpeed,
        vy: Math.sin(targetAngle) * character.bulletSpeed,
        damage: character.damage,
        radius: character.bulletRadius,
        color: character.bulletColor,
        glowColor: skinGlow,
        fromPlayer: true,
        isRocketFist: true,
        lifeTime: 80,
      });

      // Smoke exhaust
      for (let i = 0; i < 7; i++) {
        s.particles.push({
          x: p.x - Math.cos(targetAngle) * 10,
          y: p.y - Math.sin(targetAngle) * 10,
          vx: -Math.cos(targetAngle) * 3 + (Math.random() - 0.5) * 3,
          vy: -Math.sin(targetAngle) * 3 + (Math.random() - 0.5) * 3,
          life: 0,
          maxLife: 20,
          color: '#06b6d4',
          size: Math.random() * 4 + 2,
          alpha: 1,
        });
      }
    } else if (character.characterClass === 'ninja') {
      // NINJA (Shadow): Fires 3 Fast Shurikens
      sound.playShoot('shooter');

      [-0.15, 0, 0.15].forEach((spread) => {
        const angle = targetAngle + spread;
        s.bullets.push({
          id: Math.random().toString(),
          x: p.x + Math.cos(targetAngle) * (p.radius + 10),
          y: p.y + Math.sin(targetAngle) * (p.radius + 10),
          vx: Math.cos(angle) * character.bulletSpeed,
          vy: Math.sin(angle) * character.bulletSpeed,
          damage: Math.round(character.damage * 0.5),
          radius: character.bulletRadius,
          color: '#c084fc',
          glowColor: 'rgba(192, 132, 252, 0.85)',
          fromPlayer: true,
          isShuriken: true,
          lifeTime: 75,
        });
      });
    } else {
      // SHOOTER: Twin laser blaster shots
      sound.playShoot('shooter');

      [-0.07, 0.07].forEach((spread) => {
        const angle = targetAngle + spread;
        s.bullets.push({
          id: Math.random().toString(),
          x: p.x + Math.cos(targetAngle) * (p.radius + 8),
          y: p.y + Math.sin(targetAngle) * (p.radius + 8),
          vx: Math.cos(angle) * character.bulletSpeed,
          vy: Math.sin(angle) * character.bulletSpeed,
          damage: character.damage,
          radius: character.bulletRadius,
          color: character.bulletColor,
          glowColor: skinGlow,
          fromPlayer: true,
          lifeTime: 85,
        });
      });

      // Muzzle flash particles
      for (let i = 0; i < 6; i++) {
        s.particles.push({
          x: p.x + Math.cos(targetAngle) * p.radius,
          y: p.y + Math.sin(targetAngle) * p.radius,
          vx: (Math.random() - 0.5) * 3 + Math.cos(targetAngle) * 2,
          vy: (Math.random() - 0.5) * 3 + Math.sin(targetAngle) * 2,
          life: 0,
          maxLife: 15,
          color: skinColor,
          size: Math.random() * 3 + 2,
          alpha: 1,
        });
      }
    }

    if (multiplayerRoom) {
      const newBullets = s.bullets.slice(prevBulletCount).map((b) => ({
        id: b.id,
        x: b.x,
        y: b.y,
        vx: b.vx,
        vy: b.vy,
        damage: b.damage,
        radius: b.radius,
        color: b.color,
        glowColor: b.glowColor,
        lifeTime: b.lifeTime,
        isShuriken: b.isShuriken,
        isFlameArrow: b.isFlameArrow,
        isMagicOrb: b.isMagicOrb,
        isSwordWave: b.isSwordWave,
        isRocketFist: b.isRocketFist,
        isSuper: b.isSuper,
      }));
      if (newBullets.length > 0) {
        multiplayer.sendPlayerShoot(newBullets);
      }
    }
  }, [character, skinColor, skinGlow, skinWeaponColor, onAmmoChange, onSuperChargeChange, multiplayerRoom]);

  // Super ability trigger
  const triggerSuper = useCallback(() => {
    const s = stateRef.current;
    if (s.gameEnded) return;
    const requiredHits = character.superChargeHitsNeeded;
    if (s.player.superHits < requiredHits) return;

    const prevBulletCount = s.bullets.length;

    s.player.superHits = 0;
    onSuperChargeChange(0);
    sound.playSuperActivate();

    const p = s.player;
    const e = s.enemy;

    if (character.characterClass === 'shooter') {
      // Shooter Super: 3.5s invulnerability shield + rapid 8-bullet barrage
      p.shieldTime = 210; // 3.5 seconds
      s.floatingTexts.push({
        id: Math.random().toString(),
        x: p.x,
        y: p.y - 30,
        text: 'מָגֵן פְּלַזְמָה וּמְטַח לֵיְזֶר! 🛡️💥',
        color: '#38bdf8',
        opacity: 1,
        vy: -1.2,
      });

      for (let i = -3; i <= 4; i++) {
        const spreadAngle = p.angle + i * 0.10;
        s.bullets.push({
          id: Math.random().toString(),
          x: p.x + Math.cos(p.angle) * (p.radius + 8),
          y: p.y + Math.sin(p.angle) * (p.radius + 8),
          vx: Math.cos(spreadAngle) * (character.bulletSpeed * 1.15),
          vy: Math.sin(spreadAngle) * (character.bulletSpeed * 1.15),
          damage: Math.round(character.damage * 0.9),
          radius: character.bulletRadius + 1,
          color: '#38bdf8',
          glowColor: 'rgba(56, 189, 248, 0.9)',
          fromPlayer: true,
          isSuper: true,
          lifeTime: 85,
        });
      }
    } else if (character.characterClass === 'swordsman') {
      // Swordsman Super: Hurricane Dash Slash
      const dashAngle = p.angle;
      p.isDashing = true;
      p.dashTime = 18;
      p.dashVx = Math.cos(dashAngle) * 18;
      p.dashVy = Math.sin(dashAngle) * 18;
      s.screenShake = 8;

      s.floatingTexts.push({
        id: Math.random().toString(),
        x: p.x,
        y: p.y - 30,
        text: 'סוּפֶּר דָּאשׁ הוּרִיקָן! 🌪️⚔️',
        color: '#60a5fa',
        opacity: 1,
        vy: -1.2,
      });
    } else if (character.characterClass === 'mage') {
      // Mage Super: Celestial Meteor & Thunder Stun
      s.screenShake = 18;
      e.stunTime = 120; // 2 seconds stun
      e.hp = Math.max(0, e.hp - 55);

      sound.playHit(true);

      s.floatingTexts.push({
        id: Math.random().toString(),
        x: e.x,
        y: e.y - 30,
        text: 'מְטַר מֵטֵאוֹרִים קוֹסְמִי! -55 ⚡ (מְשֻׁתָּק!)',
        color: '#facc15',
        opacity: 1,
        vy: -1.5,
      });

      for (let i = 0; i < 40; i++) {
        const ang = (Math.PI * 2 * i) / 40;
        const spd = Math.random() * 8 + 4;
        s.particles.push({
          x: p.x,
          y: p.y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: 0,
          maxLife: 30,
          color: '#fde047',
          size: Math.random() * 5 + 3,
          alpha: 1,
        });
      }
    } else if (character.characterClass === 'archer') {
      // Phoenix Super: Rain of 7 Flaming Arrows
      s.screenShake = 12;
      s.floatingTexts.push({
        id: Math.random().toString(),
        x: p.x,
        y: p.y - 30,
        text: 'מְטַר חִצֵּי לֶהָבָה לוֹהֲטִים! 🏹🔥',
        color: '#f97316',
        opacity: 1,
        vy: -1.2,
      });

      for (let i = -3; i <= 3; i++) {
        const spreadAngle = p.angle + i * 0.14;
        s.bullets.push({
          id: Math.random().toString(),
          x: p.x + Math.cos(p.angle) * (p.radius + 12),
          y: p.y + Math.sin(p.angle) * (p.radius + 12),
          vx: Math.cos(spreadAngle) * (character.bulletSpeed * 1.2),
          vy: Math.sin(spreadAngle) * (character.bulletSpeed * 1.2),
          damage: Math.round(character.damage * 0.9),
          radius: character.bulletRadius + 2,
          color: '#f97316',
          glowColor: 'rgba(249, 115, 22, 0.95)',
          fromPlayer: true,
          isArrow: true,
          isSuper: true,
          lifeTime: 90,
        });
      }
    } else if (character.characterClass === 'heavy') {
      // Golem Super: Hydraulic Earth Slam + 6 Rocket Fists
      s.screenShake = 22;
      e.stunTime = 90;
      e.hp = Math.max(0, e.hp - 45);

      sound.playHit(true);

      s.floatingTexts.push({
        id: Math.random().toString(),
        x: p.x,
        y: p.y - 30,
        text: 'מַכַּת פַּטִּישׁ רַעַד וּרְסִיסֵי מַחַץ! 🔨💥',
        color: '#06b6d4',
        opacity: 1,
        vy: -1.4,
      });

      // 6 rocket fists bursting in circle
      for (let i = 0; i < 6; i++) {
        const ang = p.angle + (i * Math.PI) / 3;
        s.bullets.push({
          id: Math.random().toString(),
          x: p.x,
          y: p.y,
          vx: Math.cos(ang) * (character.bulletSpeed * 1.1),
          vy: Math.sin(ang) * (character.bulletSpeed * 1.1),
          damage: Math.round(character.damage * 0.8),
          radius: character.bulletRadius + 2,
          color: '#06b6d4',
          glowColor: 'rgba(6, 182, 212, 0.9)',
          fromPlayer: true,
          isRocketFist: true,
          isSuper: true,
          lifeTime: 70,
        });
      }
    } else if (character.characterClass === 'ninja') {
      // Ninja Super: Shadow Smoke Cloak (3s invulnerability) + 9 Shurikens Fan
      p.shieldTime = 180;
      s.floatingTexts.push({
        id: Math.random().toString(),
        x: p.x,
        y: p.y - 30,
        text: 'עַרְפִלִּית צְלָלִים וּמַטַּח כּוֹכָבִים! 🥷✨',
        color: '#c084fc',
        opacity: 1,
        vy: -1.2,
      });

      for (let i = -4; i <= 4; i++) {
        const ang = p.angle + i * 0.12;
        s.bullets.push({
          id: Math.random().toString(),
          x: p.x + Math.cos(p.angle) * (p.radius + 10),
          y: p.y + Math.sin(p.angle) * (p.radius + 10),
          vx: Math.cos(ang) * (character.bulletSpeed * 1.3),
          vy: Math.sin(ang) * (character.bulletSpeed * 1.3),
          damage: Math.round(character.damage * 0.65),
          radius: character.bulletRadius + 1,
          color: '#c084fc',
          glowColor: 'rgba(192, 132, 252, 0.9)',
          fromPlayer: true,
          isShuriken: true,
          isSuper: true,
          lifeTime: 85,
        });
      }
    }

    if (multiplayerRoom) {
      multiplayer.sendPlayerSuper(character.id, p.x, p.y);
      const newBullets = s.bullets.slice(prevBulletCount).map((b) => ({
        id: b.id,
        x: b.x,
        y: b.y,
        vx: b.vx,
        vy: b.vy,
        damage: b.damage,
        radius: b.radius,
        color: b.color,
        glowColor: b.glowColor,
        lifeTime: b.lifeTime,
        isShuriken: b.isShuriken,
        isFlameArrow: b.isFlameArrow,
        isMagicOrb: b.isMagicOrb,
        isSwordWave: b.isSwordWave,
        isRocketFist: b.isRocketFist,
        isSuper: b.isSuper,
      }));
      if (newBullets.length > 0) {
        multiplayer.sendPlayerShoot(newBullets);
      }
    }
  }, [character, onSuperChargeChange, multiplayerRoom]);

  // Expose triggers to parent component for UI buttons
  useEffect(() => {
    registerTriggerShoot(triggerShoot);
    registerTriggerSuper(triggerSuper);
  }, [registerTriggerShoot, registerTriggerSuper, triggerShoot, triggerSuper]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      stateRef.current.keys[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        triggerShoot();
      } else if (e.code === 'KeyE' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        e.preventDefault();
        triggerSuper();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [triggerShoot, triggerSuper]);

  // Main 60fps game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frameCount = 0;

    // WebSocket event listeners for real-time multiplayer
    let unsubOppUpdate = () => {};
    let unsubOppShoot = () => {};
    let unsubOppSuper = () => {};
    let unsubHit = () => {};
    let unsubLeft = () => {};

    if (multiplayerRoom) {
      unsubOppUpdate = multiplayer.onOpponentUpdate((data) => {
        const e = stateRef.current.enemy;
        e.x = data.x;
        e.y = data.y;
        e.vx = data.vx;
        e.vy = data.vy;
        e.angle = data.angle;
        if (data.hp !== undefined) e.hp = data.hp;
        if (data.maxHp !== undefined) e.maxHp = data.maxHp;
        if (data.walkCycle !== undefined) e.walkCycle = data.walkCycle;
        if (data.attackAnim !== undefined) e.attackAnim = data.attackAnim;

        if (e.hp <= 0 && !stateRef.current.gameEnded) {
          stateRef.current.gameEnded = true;
          onWin();
        }
      });

      unsubOppShoot = multiplayer.onOpponentShoot((data) => {
        sound.playEnemyShoot();
        const s = stateRef.current;
        data.bullets.forEach((ob) => {
          s.bullets.push({
            ...ob,
            fromPlayer: false, // enemy projectile damaging player
          });
        });
      });

      unsubOppSuper = multiplayer.onOpponentSuper(() => {
        sound.playSuperReady();
        const s = stateRef.current;
        s.floatingTexts.push({
          id: Math.random().toString(),
          x: s.enemy.x,
          y: s.enemy.y - 30,
          text: 'סוּפֶּר יָרִיב הֻפְעַל! ⚡',
          color: '#ef4444',
          opacity: 1,
          vy: -1.2,
        });
      });

      unsubHit = multiplayer.onHitRegistered((data) => {
        const myId = multiplayer.getPlayerId();
        if (data.targetId === myId) {
          const s = stateRef.current;
          const p = s.player;
          if (p.shieldTime > 0) return; // shielded
          p.hp = Math.max(0, p.hp - data.damage);
          sound.playHit(false);
          s.screenShake = 6;
          s.floatingTexts.push({
            id: Math.random().toString(),
            x: p.x,
            y: p.y - 25,
            text: `-${data.damage}`,
            color: '#ef4444',
            opacity: 1,
            vy: -1.3,
          });
          if (p.hp <= 0 && !stateRef.current.gameEnded) {
            stateRef.current.gameEnded = true;
            onLose();
          }
        }
      });

      unsubLeft = multiplayer.onOpponentLeft(() => {
        const s = stateRef.current;
        s.floatingTexts.push({
          id: Math.random().toString(),
          x: s.width / 2,
          y: s.height / 2,
          text: 'הַיָּרִיב עָזַב! נִצָּחוֹן טֶכְנִי! 🏆',
          color: '#facc15',
          opacity: 1,
          vy: -0.5,
        });
        setTimeout(() => {
          if (!s.gameEnded) {
            s.gameEnded = true;
            onWin();
          }
        }, 1000);
      });
    }

    const checkCircleRectCollision = (
      cx: number,
      cy: number,
      cr: number,
      rx: number,
      ry: number,
      rw: number,
      rh: number
    ) => {
      const closeX = Math.max(rx, Math.min(cx, rx + rw));
      const closeY = Math.max(ry, Math.min(cy, ry + rh));
      const dx = cx - closeX;
      const dy = cy - closeY;
      return dx * dx + dy * dy < cr * cr;
    };

    const loop = () => {
      const s = stateRef.current;
      const p = s.player;
      const e = s.enemy;

      // 1. UPDATE PLAYER MOVEMENT
      let moveX = joystickVector.x;
      let moveY = joystickVector.y;

      if (s.keys['KeyW'] || s.keys['ArrowUp']) moveY -= 1;
      if (s.keys['KeyS'] || s.keys['ArrowDown']) moveY += 1;
      if (s.keys['KeyA'] || s.keys['ArrowLeft']) moveX -= 1;
      if (s.keys['KeyD'] || s.keys['ArrowRight']) moveX += 1;

      const mag = Math.hypot(moveX, moveY);
      if (mag > 0) {
        p.vx = (moveX / Math.max(1, mag)) * p.speed;
        p.vy = (moveY / Math.max(1, mag)) * p.speed;
        p.angle = Math.atan2(e.y - p.y, e.x - p.x); // auto-aim facing towards opponent
        p.walkCycle += 1;
      } else {
        p.vx = 0;
        p.vy = 0;
        p.angle = Math.atan2(e.y - p.y, e.x - p.x);
      }
      if (p.attackAnim > 0) {
        p.attackAnim = Math.max(0, p.attackAnim - 0.07);
      }

      // Storm dash handling
      if (p.isDashing) {
        p.x += p.dashVx;
        p.y += p.dashVy;
        p.dashTime -= 1;

        // Check damage to enemy while dashing
        const dDist = Math.hypot(p.x - e.x, p.y - e.y);
        if (dDist < p.radius + e.radius + 10) {
          e.hp = Math.max(0, e.hp - 45);
          sound.playHit(true);
          s.floatingTexts.push({
            id: Math.random().toString(),
            x: e.x,
            y: e.y - 20,
            text: '-45 (דאש!)',
            color: '#60a5fa',
            opacity: 1,
            vy: -1.5,
          });
        }

        if (p.dashTime <= 0) {
          p.isDashing = false;
        }
      } else {
        // Normal movement with wall collision
        const nextX = p.x + p.vx;
        const nextY = p.y + p.vy;

        let blockedX = false;
        let blockedY = false;

        s.walls.forEach((w) => {
          if (checkCircleRectCollision(nextX, p.y, p.radius, w.x, w.y, w.w, w.h)) {
            blockedX = true;
          }
          if (checkCircleRectCollision(p.x, nextY, p.radius, w.x, w.y, w.w, w.h)) {
            blockedY = true;
          }
        });

        if (!blockedX) p.x = Math.max(p.radius + 10, Math.min(s.width - p.radius - 10, nextX));
        if (!blockedY) p.y = Math.max(p.radius + 10, Math.min(s.height - p.radius - 10, nextY));
      }

      // Synchronize player coordinates over WebSocket every 2 frames
      frameCount++;
      if (multiplayerRoom && frameCount % 2 === 0) {
        multiplayer.sendPlayerUpdate({
          x: p.x,
          y: p.y,
          vx: p.vx,
          vy: p.vy,
          angle: p.angle,
          hp: p.hp,
          maxHp: p.maxHp,
          superCharge: p.superHits / character.superChargeHitsNeeded,
          isShielded: p.shieldTime > 0,
          walkCycle: p.walkCycle,
          attackAnim: p.attackAnim,
        });
      }

      // Check bush status for player
      p.inBush = s.bushes.some((b) =>
        p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h
      );

      // Ammo regeneration
      if (p.ammo < p.maxAmmo) {
        p.ammo = Math.min(p.maxAmmo, p.ammo + p.ammoRegenRate);
        onAmmoChange(p.ammo);
      }

      // Spark shield countdown
      if (p.shieldTime > 0) {
        p.shieldTime -= 1;
      }

      // 2. UPDATE ENEMY BOT AI (Only active in Solo / Practice against Bot)
      if (!multiplayerRoom) {
        if (e.stunTime > 0) {
          e.stunTime -= 1;
        } else {
          e.aiTimer += 1;
          if (e.aiTimer > 90) {
            e.aiTimer = 0;
            e.aiDirY = Math.random() > 0.5 ? 1 : -1;
          }

          // Aim angle towards player
          e.angle = Math.atan2(p.y - e.y, p.x - e.x);

          // Keep dynamic combat distance (around 320px)
          const distToPlayer = Math.hypot(p.x - e.x, p.y - e.y);
          let botVx = 0;
          let botVy = e.speed * e.aiDirY;

          if (distToPlayer < 240) {
            botVx = e.speed * 0.8; // back off
          } else if (distToPlayer > 380) {
            botVx = -e.speed * 0.8; // get closer
          }

          // Bounce off canvas boundaries
          if (e.y < e.radius + 40) e.aiDirY = 1;
          if (e.y > s.height - e.radius - 40) e.aiDirY = -1;

          // Move bot with obstacle checks
          const nextBotX = e.x + botVx;
          const nextBotY = e.y + botVy;

          let botBlocked = false;
          s.walls.forEach((w) => {
            if (checkCircleRectCollision(nextBotX, nextBotY, e.radius, w.x, w.y, w.w, w.h)) {
              botBlocked = true;
            }
          });

          if (!botBlocked) {
            e.x = Math.max(s.width / 2 + 50, Math.min(s.width - e.radius - 20, nextBotX));
            e.y = Math.max(e.radius + 20, Math.min(s.height - e.radius - 20, nextBotY));
            e.walkCycle += 1;
          } else {
            e.aiDirY *= -1;
          }

          if (e.attackAnim > 0) {
            e.attackAnim = Math.max(0, e.attackAnim - 0.07);
          }

          // Enemy shooting
          e.shootCooldown += 1;
          if (e.shootCooldown >= e.shootInterval && !s.gameEnded) {
            e.shootCooldown = Math.floor(Math.random() * 20); // add slight randomness
            e.attackAnim = 1.0;
            sound.playEnemyShoot();

            const leadFactor = 0.2;
            const targetY = p.y + p.vy * leadFactor * 10;
            const shootAng = Math.atan2(targetY - e.y, p.x - e.x);

            s.bullets.push({
              id: Math.random().toString(),
              x: e.x + Math.cos(shootAng) * (e.radius + 4),
              y: e.y + Math.sin(shootAng) * (e.radius + 4),
              vx: Math.cos(shootAng) * 6.5,
              vy: Math.sin(shootAng) * 6.5,
              damage: 12,
              radius: 6,
              color: '#f97316',
              glowColor: 'rgba(249, 115, 22, 0.7)',
              fromPlayer: false,
              lifeTime: 85,
            });
          }
        }
      }

      // 3. UPDATE BULLETS
      for (let i = s.bullets.length - 1; i >= 0; i--) {
        const b = s.bullets[i];
        b.x += b.vx;
        b.y += b.vy;
        b.lifeTime -= 1;

        let hitObstacle = false;

        // Wall collision
        for (let j = 0; j < s.walls.length; j++) {
          const w = s.walls[j];
          if (b.x > w.x && b.x < w.x + w.w && b.y > w.y && b.y < w.y + w.h) {
            hitObstacle = true;
            if (w.isDestructible && w.hp !== undefined) {
              w.hp -= b.damage;
              if (w.hp <= 0) {
                s.walls.splice(j, 1);
              }
            }
            break;
          }
        }

        // Screen boundaries
        if (b.x < 0 || b.x > s.width || b.y < 0 || b.y > s.height || b.lifeTime <= 0) {
          hitObstacle = true;
        }

        // Player bullet hitting Enemy
        if (b.fromPlayer && !hitObstacle) {
          const dist = Math.hypot(b.x - e.x, b.y - e.y);
          if (dist < e.radius + b.radius) {
            hitObstacle = true;
            e.hp = Math.max(0, e.hp - b.damage);
            sound.playHit(true);

            if (multiplayerRoom) {
              multiplayer.sendHitRegistered(
                multiplayerRoom.opponent?.id || 'opponent',
                b.damage,
                e.hp
              );
            }

            // Charge super meter
            p.superHits = Math.min(character.superChargeHitsNeeded, p.superHits + 1);
            const ratio = p.superHits / character.superChargeHitsNeeded;
            onSuperChargeChange(ratio);
            if (p.superHits === character.superChargeHitsNeeded) {
              sound.playSuperReady();
            }

            // Damage text
            s.floatingTexts.push({
              id: Math.random().toString(),
              x: e.x + (Math.random() - 0.5) * 20,
              y: e.y - 20,
              text: `-${b.damage}`,
              color: '#f87171',
              opacity: 1,
              vy: -1.3,
            });

            // Particles
            for (let k = 0; k < 8; k++) {
              s.particles.push({
                x: b.x,
                y: b.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 0,
                maxLife: 20,
                color: '#ef4444',
                size: Math.random() * 4 + 2,
                alpha: 1,
              });
            }
          }
        }

        // Enemy bullet hitting Player
        if (!b.fromPlayer && !hitObstacle) {
          const dist = Math.hypot(b.x - p.x, b.y - p.y);
          if (dist < p.radius + b.radius) {
            hitObstacle = true;

            if (p.shieldTime > 0) {
              // Spark Super: Shield absorbed!
              sound.playHit(false);
              s.floatingTexts.push({
                id: Math.random().toString(),
                x: p.x,
                y: p.y - 25,
                text: 'חסום! 🛡️',
                color: '#38bdf8',
                opacity: 1,
                vy: -1.2,
              });
            } else {
              p.hp = Math.max(0, p.hp - b.damage);
              sound.playHit(false);
              s.screenShake = 4;

              s.floatingTexts.push({
                id: Math.random().toString(),
                x: p.x + (Math.random() - 0.5) * 20,
                y: p.y - 20,
                text: `-${b.damage}`,
                color: '#fbbf24',
                opacity: 1,
                vy: -1.3,
              });
            }
          }
        }

        if (hitObstacle) {
          s.bullets.splice(i, 1);
        }
      }

      // 4. PARTICLES & FLOATING TEXT
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const pt = s.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life += 1;
        pt.alpha = 1 - pt.life / pt.maxLife;
        if (pt.life >= pt.maxLife) {
          s.particles.splice(i, 1);
        }
      }

      for (let i = s.floatingTexts.length - 1; i >= 0; i--) {
        const ft = s.floatingTexts[i];
        ft.y += ft.vy;
        ft.opacity -= 0.025;
        if (ft.opacity <= 0) {
          s.floatingTexts.splice(i, 1);
        }
      }

      // Check Win / Lose
      if (!s.gameEnded) {
        if (e.hp <= 0) {
          s.gameEnded = true;
          sound.playVictory();
          onWin();
        } else if (p.hp <= 0) {
          s.gameEnded = true;
          sound.playDefeat();
          onLose();
        }
      }

      // 5. RENDER CANVAS
      ctx.save();
      if (s.screenShake > 0) {
        ctx.translate(
          (Math.random() - 0.5) * s.screenShake,
          (Math.random() - 0.5) * s.screenShake
        );
        s.screenShake *= 0.85;
        if (s.screenShake < 0.5) s.screenShake = 0;
      }

      // Arena background: stylized brawl arena grid
      ctx.fillStyle = '#166534'; // Emerald/green turf
      ctx.fillRect(0, 0, s.width, s.height);

      // Arena checkered lawn lines
      ctx.fillStyle = '#15803d';
      const tileSize = 40;
      for (let x = 0; x < s.width; x += tileSize) {
        for (let y = 0; y < s.height; y += tileSize) {
          if (((x / tileSize) + (y / tileSize)) % 2 === 0) {
            ctx.fillRect(x, y, tileSize, tileSize);
          }
        }
      }

      // Outer border neon rim
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, s.width - 6, s.height - 6);

      // Center divider line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(s.width / 2, 0);
      ctx.lineTo(s.width / 2, s.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Center gem ring decoration
      ctx.beginPath();
      ctx.arc(s.width / 2, s.height / 2, 45, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.3)';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Bushes
      s.bushes.forEach((bush) => {
        ctx.fillStyle = '#14532d'; // Dark deep bush green
        ctx.beginPath();
        ctx.roundRect(bush.x, bush.y, bush.w, bush.h, 12);
        ctx.fill();
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Bush foliage leaves pattern
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.arc(bush.x + bush.w * 0.3, bush.y + bush.h * 0.4, 14, 0, Math.PI * 2);
        ctx.arc(bush.x + bush.w * 0.7, bush.y + bush.h * 0.5, 16, 0, Math.PI * 2);
        ctx.fill();
      });

      // Walls
      s.walls.forEach((wall) => {
        ctx.fillStyle = wall.isDestructible ? '#78350f' : '#334155'; // Wooden crate vs Slate Rock
        ctx.beginPath();
        ctx.roundRect(wall.x, wall.y, wall.w, wall.h, 6);
        ctx.fill();

        ctx.strokeStyle = wall.isDestructible ? '#b45309' : '#64748b';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Texture details
        if (wall.isDestructible) {
          ctx.strokeStyle = '#451a03';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(wall.x, wall.y);
          ctx.lineTo(wall.x + wall.w, wall.y + wall.h);
          ctx.moveTo(wall.x + wall.w, wall.y);
          ctx.lineTo(wall.x, wall.y + wall.h);
          ctx.stroke();
        }
      });

      // Bullets & Projectiles
      s.bullets.forEach((b) => {
        ctx.save();
        ctx.shadowColor = b.glowColor;
        ctx.shadowBlur = 12;

        if (b.isSwordSlash) {
          // Crescent Blade-Wave Projectile (Swordsman)
          const bAngle = Math.atan2(b.vy, b.vx);
          ctx.translate(b.x, b.y);
          ctx.rotate(bAngle);
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.arc(0, 0, b.radius * 1.3, -Math.PI / 2.3, Math.PI / 2.3, false);
          ctx.arc(b.radius * 0.4, 0, b.radius * 1.1, Math.PI / 2.3, -Math.PI / 2.3, true);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.8;
          ctx.stroke();
        } else if (b.isMagicOrb) {
          // Arcane Magic Orb (Mage)
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius * 0.45, 0, Math.PI * 2);
          ctx.fill();
          // Arcane ring
          ctx.strokeStyle = b.glowColor;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius * 1.35, 0, Math.PI * 2);
          ctx.stroke();
        } else if (b.isArrow) {
          // Flaming Arrow Projectile (Archer)
          const bAngle = Math.atan2(b.vy, b.vx);
          ctx.translate(b.x, b.y);
          ctx.rotate(bAngle);

          // Shaft
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(-16, 0);
          ctx.lineTo(12, 0);
          ctx.stroke();

          // Glowing Arrowhead
          ctx.fillStyle = '#ea580c';
          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(18, 0);
          ctx.lineTo(10, -5);
          ctx.lineTo(10, 5);
          ctx.closePath();
          ctx.fill();

          // Fletching feathers
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.moveTo(-16, 0);
          ctx.lineTo(-20, -4);
          ctx.lineTo(-14, 0);
          ctx.lineTo(-20, 4);
          ctx.closePath();
          ctx.fill();
        } else if (b.isRocketFist) {
          // Heavy Mechanical Rocket Fist (Heavy Golem)
          const bAngle = Math.atan2(b.vy, b.vx);
          ctx.translate(b.x, b.y);
          ctx.rotate(bAngle);

          // Booster flame behind fist
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.moveTo(-12, -4);
          ctx.lineTo(-22, 0);
          ctx.lineTo(-12, 4);
          ctx.closePath();
          ctx.fill();

          // Metallic fist
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.roundRect(-10, -8, 20, 16, 4);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Knuckles
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(8, -6, 3, 12);
        } else if (b.isShuriken) {
          // Spinning Ninja Shuriken (Ninja)
          ctx.translate(b.x, b.y);
          const spin = (Date.now() * 0.02) % (Math.PI * 2);
          ctx.rotate(spin);

          ctx.fillStyle = b.color;
          ctx.beginPath();
          for (let i = 0; i < 4; i++) {
            const a = (i * Math.PI) / 2;
            ctx.lineTo(Math.cos(a) * 11, Math.sin(a) * 11);
            const aMid = a + Math.PI / 4;
            ctx.lineTo(Math.cos(aMid) * 4, Math.sin(aMid) * 4);
          }
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (b.isLightning) {
          // Lightning blast
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          // Dual Blaster / Laser Bolt (Shooter)
          const bAngle = Math.atan2(b.vy, b.vx);
          ctx.translate(b.x, b.y);
          ctx.rotate(bAngle);
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, b.radius * 1.5, b.radius * 0.75, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(0, 0, b.radius * 0.75, b.radius * 0.35, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // Player rendering
      ctx.save();
      ctx.globalAlpha = p.inBush ? 0.6 : 1.0;

      // Trajectory aim line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + Math.cos(p.angle) * 70, p.y + Math.sin(p.angle) * 70);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Humanoid Figure for Player
      drawHumanoidFigure(ctx, {
        x: p.x,
        y: p.y,
        radius: p.radius,
        angle: p.angle,
        characterClass: character.characterClass,
        skinId: skinId,
        color: skinColor,
        glowColor: skinGlow,
        accentColor: character.bulletColor || '#38bdf8',
        hairColor: skinHairColor,
        armorColor: skinArmorColor,
        weaponColor: skinWeaponColor,
        isMoving: p.vx !== 0 || p.vy !== 0,
        walkCycle: p.walkCycle,
        attackAnim: p.attackAnim,
        isShielded: p.shieldTime > 0,
        isStunned: false,
        isEnemy: false,
      });

      // Player Health bar
      const barW = 44;
      const barH = 6;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(p.x - barW / 2, p.y - p.radius - 18, barW, barH);
      const hpPercent = Math.max(0, p.hp / p.maxHp);
      ctx.fillStyle = hpPercent > 0.35 ? '#22c55e' : '#ef4444';
      ctx.fillRect(p.x - barW / 2, p.y - p.radius - 18, barW * hpPercent, barH);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x - barW / 2, p.y - p.radius - 18, barW, barH);

      // Player Name tag
      ctx.font = 'bold 10px Rubik, Arial';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(`${character.name} (${skinName})`, p.x, p.y - p.radius - 22);

      ctx.restore(); // end player

      // Enemy rendering
      ctx.save();
      ctx.globalAlpha = e.inBush ? 0.6 : 1.0;

      const oppClass = oppBrawler ? oppBrawler.characterClass : 'shooter';
      const oppColor = oppSkin ? oppSkin.color : '#ef4444';
      const oppGlow = oppSkin ? oppSkin.glowColor : 'rgba(239, 68, 68, 0.8)';
      const oppAccent = oppSkin ? (oppSkin.accentColor || '#fca5a5') : '#fca5a5';
      const oppHair = oppSkin ? oppSkin.hairColor : '#450a0a';
      const oppArmor = oppSkin ? oppSkin.armorColor : '#7f1d1d';
      const oppWeapon = oppSkin ? oppSkin.weaponColor : '#dc2626';
      const oppLabel = multiplayerRoom?.opponent
        ? `${multiplayerRoom.opponent.name} 📱`
        : 'בּוֹט יָרִיב AI 🤖';

      // Draw Humanoid Figure for Rival or Remote Player
      drawHumanoidFigure(ctx, {
        x: e.x,
        y: e.y,
        radius: e.radius,
        angle: e.angle,
        characterClass: oppClass,
        skinId: oppSkin?.id || 1,
        color: oppColor,
        glowColor: oppGlow,
        accentColor: oppAccent,
        hairColor: oppHair,
        armorColor: oppArmor,
        weaponColor: oppWeapon,
        isMoving: true,
        walkCycle: e.walkCycle,
        attackAnim: e.attackAnim,
        isShielded: false,
        isStunned: e.stunTime > 0,
        isEnemy: true,
      });

      // Stun stars over head if stunned
      if (e.stunTime > 0) {
        ctx.font = '14px Arial';
        ctx.fillStyle = '#fde047';
        ctx.textAlign = 'center';
        ctx.fillText('💫 מְשֻׁתָּק!', e.x, e.y - e.radius - 26);
      }

      // Enemy Health bar
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(e.x - barW / 2, e.y - e.radius - 18, barW, barH);
      const eHpPercent = Math.max(0, e.hp / e.maxHp);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(e.x - barW / 2, e.y - e.radius - 18, barW * eHpPercent, barH);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(e.x - barW / 2, e.y - e.radius - 18, barW, barH);

      // Enemy Name tag
      ctx.font = 'bold 10px Rubik, Arial';
      ctx.fillStyle = '#fca5a5';
      ctx.textAlign = 'center';
      ctx.fillText(oppLabel, e.x, e.y - e.radius - 22);

      ctx.restore(); // end enemy

      // Particles
      s.particles.forEach((pt) => {
        ctx.save();
        ctx.globalAlpha = pt.alpha;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Floating texts
      s.floatingTexts.forEach((ft) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.opacity);
        ctx.font = 'bold 13px Rubik, Arial';
        ctx.fillStyle = ft.color;
        ctx.textAlign = 'center';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      ctx.restore(); // end shake transform

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      unsubOppUpdate();
      unsubOppShoot();
      unsubOppSuper();
      unsubHit();
      unsubLeft();
    };
  }, [character, skinColor, skinGlow, skinName, joystickVector, onAmmoChange, onSuperChargeChange, onWin, onLose, multiplayerRoom, oppBrawler, oppSkin]);

  return (
    <div className="relative w-full flex justify-center items-center overflow-hidden rounded-2xl shadow-2xl border-4 border-slate-700 bg-slate-900">
      <canvas
        ref={canvasRef}
        width={800}
        height={480}
        className="w-full max-w-[850px] aspect-[800/480] block touch-none"
      />
    </div>
  );
};

import { CharacterClass } from '../types';

export interface FigureRenderOptions {
  x: number;
  y: number;
  radius: number;
  angle: number;
  characterClass: CharacterClass;
  skinId: number;
  color: string;
  glowColor: string;
  accentColor: string;
  hairColor?: string;
  armorColor?: string;
  weaponColor?: string;
  isMoving?: boolean;
  walkCycle?: number;
  attackAnim?: number; // 0 to 1 progress during attack swing/fire
  isShielded?: boolean;
  isStunned?: boolean;
  isEnemy?: boolean;
  isDancing?: boolean;
}

/**
 * Renders a stylized, arcade-proportional 2.5D humanoid brawler figure onto a Canvas 2D context
 */
export function drawHumanoidFigure(ctx: CanvasRenderingContext2D, opts: FigureRenderOptions) {
  const {
    x,
    y,
    radius,
    angle,
    characterClass,
    skinId,
    color,
    glowColor,
    accentColor,
    hairColor = '#fcd34d',
    armorColor = '#1e293b',
    weaponColor = '#60a5fa',
    isMoving = false,
    walkCycle = 0,
    attackAnim = 0,
    isShielded = false,
    isStunned = false,
    isEnemy = false,
    isDancing = false,
  } = opts;

  ctx.save();
  ctx.translate(x, y);

  // 1. Soft Shadow on the ground (unrotated)
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(0, radius * 0.4, radius * 1.15, radius * 0.65, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Shield bubble aura (Spark / Shooter super)
  if (isShielded) {
    ctx.save();
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.45, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
    ctx.fill();

    // Runic hex pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * radius * 1.4, Math.sin(a) * radius * 1.4, 4, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Now rotate canvas for the humanoid's facing direction
  ctx.rotate(angle);

  // 2. Walking / Dancing Legs
  const legOffset = isDancing
    ? Math.sin(walkCycle * 0.4) * 7
    : isMoving
    ? Math.sin(walkCycle * 0.25) * 5
    : 0;
  const bootColor = isEnemy ? '#7f1d1d' : '#0f172a';

  // Left boot
  ctx.fillStyle = bootColor;
  ctx.beginPath();
  ctx.roundRect(-radius * 0.45, -radius * 0.55 + legOffset, radius * 0.35, radius * 0.55, 3);
  ctx.fill();
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Right boot
  ctx.fillStyle = bootColor;
  ctx.beginPath();
  ctx.roundRect(-radius * 0.45, radius * 0.15 - legOffset, radius * 0.35, radius * 0.55, 3);
  ctx.fill();
  ctx.stroke();

  // 3. Back accessories (Capes, Wings, Scarves, Exhaust)
  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 14;

  if (characterClass === 'swordsman' || characterClass === 'mage') {
    // Cape / back cloth
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.3, -radius * 0.6);
    ctx.lineTo(-radius * 0.95, -radius * 0.4);
    ctx.lineTo(-radius * 0.95, radius * 0.4);
    ctx.lineTo(-radius * 0.3, radius * 0.6);
    ctx.closePath();
    ctx.fill();
  } else if (characterClass === 'archer') {
    // Phoenix Fiery Wings on back
    ctx.fillStyle = color;
    // Top wing
    ctx.beginPath();
    ctx.moveTo(-radius * 0.2, -radius * 0.4);
    ctx.quadraticCurveTo(-radius * 1.2, -radius * 1.0, -radius * 0.7, -radius * 0.2);
    ctx.closePath();
    ctx.fill();
    // Bottom wing
    ctx.beginPath();
    ctx.moveTo(-radius * 0.2, radius * 0.4);
    ctx.quadraticCurveTo(-radius * 1.2, radius * 1.0, -radius * 0.7, radius * 0.2);
    ctx.closePath();
    ctx.fill();
  } else if (characterClass === 'ninja') {
    // Shadow Ninja Scarf fluttering behind
    const scarfWave = Math.sin(walkCycle * 0.3) * 6;
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.3, -radius * 0.2);
    ctx.quadraticCurveTo(-radius * 0.8, -radius * 0.5 + scarfWave, -radius * 1.3, -radius * 0.3 + scarfWave);
    ctx.lineTo(-radius * 1.2, radius * 0.1 + scarfWave);
    ctx.quadraticCurveTo(-radius * 0.7, radius * 0.2 + scarfWave, -radius * 0.3, radius * 0.2);
    ctx.closePath();
    ctx.fill();
  } else if (characterClass === 'heavy') {
    // Golem Heavy Exhaust Pipes / Reactor Plates
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-radius * 0.8, -radius * 0.5, radius * 0.4, radius * 0.3);
    ctx.fillRect(-radius * 0.8, radius * 0.2, radius * 0.4, radius * 0.3);
    // Exhaust glow
    ctx.fillStyle = weaponColor;
    ctx.beginPath();
    ctx.arc(-radius * 0.8, -radius * 0.35, 4, 0, Math.PI * 2);
    ctx.arc(-radius * 0.8, radius * 0.35, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Main body torso (Broad for heavy, athletic for others)
  const torsoW = characterClass === 'heavy' ? radius * 0.85 : radius * 0.65;
  const torsoH = characterClass === 'heavy' ? radius * 0.72 : radius * 0.55;

  ctx.fillStyle = isEnemy ? '#991b1b' : armorColor;
  ctx.beginPath();
  ctx.ellipse(0, 0, torsoW, torsoH, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Chest insignia / armor plate / reactor
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(radius * 0.1, 0, radius * 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Golem reactor core shine
  if (characterClass === 'heavy') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(radius * 0.1, 0, radius * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 4. Arms & Weapons by Class
  if (characterClass === 'shooter') {
    // Dual Blasters (Spark)
    const recoil = attackAnim > 0 ? Math.sin(attackAnim * Math.PI) * 5 : 0;

    // Hands
    ctx.fillStyle = '#fcd34d';
    ctx.beginPath();
    ctx.arc(radius * 0.4, -radius * 0.55, radius * 0.2, 0, Math.PI * 2);
    ctx.arc(radius * 0.4, radius * 0.55, radius * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Guns
    ctx.fillStyle = weaponColor;
    ctx.fillRect(radius * 0.45 - recoil, -radius * 0.65, radius * 0.65, radius * 0.22);
    ctx.fillRect(radius * 0.45 - recoil, radius * 0.43, radius * 0.65, radius * 0.22);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(radius * 0.45 - recoil, -radius * 0.65, radius * 0.65, radius * 0.22);
    ctx.strokeRect(radius * 0.45 - recoil, radius * 0.43, radius * 0.65, radius * 0.22);

    if (attackAnim > 0.1 && attackAnim < 0.6) {
      ctx.save();
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(radius * 1.25, -radius * 0.54, 7, 0, Math.PI * 2);
      ctx.arc(radius * 1.25, radius * 0.54, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (characterClass === 'swordsman') {
    // Katana (Storm)
    const swingAngle =
      attackAnim > 0
        ? -Math.PI / 3 + attackAnim * (Math.PI * 0.8)
        : -Math.PI / 6;

    ctx.save();
    ctx.translate(radius * 0.35, radius * 0.3);
    ctx.rotate(swingAngle);

    ctx.fillStyle = '#fcd34d';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-2, -3, 6, 8);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(4, -8, 4, 16);

    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 16;
    ctx.fillStyle = weaponColor;
    ctx.beginPath();
    ctx.moveTo(8, -3.5);
    ctx.lineTo(radius * 1.5, -2);
    ctx.lineTo(radius * 1.7, 0);
    ctx.lineTo(radius * 1.5, 2);
    ctx.lineTo(8, 3.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(10, -1, radius * 1.2, 2);
    ctx.restore();
    ctx.restore();
  } else if (characterClass === 'mage') {
    // Arcane Staff (Titan)
    const staffBob = Math.sin(walkCycle * 0.1) * 2;

    ctx.fillStyle = '#fcd34d';
    ctx.beginPath();
    ctx.arc(radius * 0.3, -radius * 0.5, radius * 0.2, 0, Math.PI * 2);
    ctx.arc(radius * 0.35, radius * 0.45, radius * 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.fillStyle = '#78350f';
    ctx.fillRect(radius * 0.3, radius * 0.35, radius * 1.0, 4);

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(radius * 1.35, radius * 0.37, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 20;
    ctx.fillStyle = weaponColor;
    ctx.beginPath();
    ctx.arc(radius * 1.45 + staffBob, radius * 0.37, radius * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(radius * 1.45 + staffBob, radius * 0.37, radius * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (characterClass === 'archer') {
    // Phoenix Flame Bow (Phoenix)
    const drawBack = attackAnim > 0 ? Math.sin(attackAnim * Math.PI) * 6 : 0;

    // Left hand holding bow stave forward
    ctx.fillStyle = '#fcd34d';
    ctx.beginPath();
    ctx.arc(radius * 0.6, -radius * 0.2, radius * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Curved Fire Bow
    ctx.save();
    ctx.strokeStyle = weaponColor;
    ctx.lineWidth = 4.5;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(radius * 0.6, -radius * 0.2, radius * 0.75, -Math.PI / 2.2, Math.PI / 2.2);
    ctx.stroke();

    // Glowing Bow String & Arrow
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(radius * 0.6 + Math.cos(-Math.PI / 2.2) * radius * 0.75, -radius * 0.2 + Math.sin(-Math.PI / 2.2) * radius * 0.75);
    ctx.lineTo(radius * 0.2 - drawBack, -radius * 0.2);
    ctx.lineTo(radius * 0.6 + Math.cos(Math.PI / 2.2) * radius * 0.75, -radius * 0.2 + Math.sin(Math.PI / 2.2) * radius * 0.75);
    ctx.stroke();

    // Arrow shaft & flame tip
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(radius * 0.2 - drawBack, -radius * 0.2);
    ctx.lineTo(radius * 1.3, -radius * 0.2);
    ctx.stroke();

    // Arrow tip
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(radius * 1.45, -radius * 0.2);
    ctx.lineTo(radius * 1.25, -radius * 0.2 - 5);
    ctx.lineTo(radius * 1.25, -radius * 0.2 + 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (characterClass === 'heavy') {
    // Heavy Rocket Fist & Hammer (Golem)
    const punchShift = attackAnim > 0 ? Math.sin(attackAnim * Math.PI) * 10 : 0;

    // Massive Mechanical Rocket Fist (Right Hand)
    ctx.save();
    ctx.fillStyle = weaponColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.roundRect(radius * 0.5 + punchShift, radius * 0.2, radius * 0.65, radius * 0.45, 5);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Metallic Knuckles
    ctx.fillStyle = '#0f172a';
    for (let k = 0; k < 3; k++) {
      ctx.fillRect(radius * 1.15 + punchShift, radius * 0.24 + k * 8, 4, 6);
    }

    // Left Arm Hydraulic Shield / Hammer
    ctx.fillStyle = armorColor;
    ctx.beginPath();
    ctx.roundRect(radius * 0.3, -radius * 0.65, radius * 0.45, radius * 0.35, 4);
    ctx.fill();
    ctx.restore();
  } else if (characterClass === 'ninja') {
    // Twin Glowing Shurikens (Shadow)
    const spinAngle = walkCycle * 0.3 + attackAnim * Math.PI * 4;

    // Hands
    ctx.fillStyle = '#fcd34d';
    ctx.beginPath();
    ctx.arc(radius * 0.45, -radius * 0.45, radius * 0.18, 0, Math.PI * 2);
    ctx.arc(radius * 0.45, radius * 0.45, radius * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Draw Spinning Shuriken helper
    const drawStar = (sx: number, sy: number) => {
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(spinAngle);
      ctx.fillStyle = weaponColor;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 12;
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
      ctx.restore();
    };

    drawStar(radius * 0.7, -radius * 0.45);
    drawStar(radius * 0.7, radius * 0.45);
  }

  // 5. Head & Facial Features
  ctx.save();
  const isBlink = !isEnemy && Math.floor(walkCycle * 0.4) % 110 < 6;

  // Head Base
  ctx.fillStyle = isEnemy ? '#f87171' : '#fcd34d';
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.52, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Headwear by Class & Skin
  if (characterClass === 'shooter') {
    if (skinId === 0) {
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.ellipse(-radius * 0.1, 0, radius * 0.65, radius * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(0, -radius * 0.35, radius * 0.2, radius * 0.7);
    } else if (skinId === 1) {
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(-radius * 0.05, 0, radius * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(radius * 0.1, -radius * 0.3, 4, radius * 0.6);
    } else {
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(-radius * 0.05, 0, radius * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (characterClass === 'swordsman') {
    if (skinId === 0) {
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(-radius * 0.15, 0, radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(0, -radius * 0.45, radius * 0.25, radius * 0.9);
    } else if (skinId === 1) {
      ctx.fillStyle = '#9333ea';
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.56, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e9d5ff';
      ctx.fillRect(radius * 0.15, -radius * 0.35, 4, radius * 0.7);
    } else {
      ctx.fillStyle = '#9f1239';
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(radius * 0.1, -radius * 0.4, 4, radius * 0.8);
    }
  } else if (characterClass === 'mage') {
    ctx.fillStyle = skinId === 0 ? '#6d28d9' : skinId === 1 ? '#b45309' : '#09090b';
    ctx.beginPath();
    ctx.arc(-radius * 0.1, 0, radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(radius * 0.2, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (characterClass === 'archer') {
    // Phoenix Feathered Circlet
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.arc(-radius * 0.1, 0, radius * 0.56, 0, Math.PI * 2);
    ctx.fill();
    // Glowing forehead feather
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(radius * 0.25, 0);
    ctx.lineTo(radius * 0.05, -5);
    ctx.lineTo(radius * 0.05, 5);
    ctx.closePath();
    ctx.fill();
  } else if (characterClass === 'heavy') {
    // Golem Armored Metal Helmet & Visor Slit
    ctx.fillStyle = armorColor;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.58, 0, Math.PI * 2);
    ctx.fill();
    // Glowing Cyber Visor
    ctx.fillStyle = weaponColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;
    ctx.fillRect(radius * 0.15, -radius * 0.35, 5, radius * 0.7);
  } else if (characterClass === 'ninja') {
    // Shadow Ninja Shinobi Hood & Mask
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(-radius * 0.05, 0, radius * 0.56, 0, Math.PI * 2);
    ctx.fill();
    // Mask covering lower face
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(radius * 0.12, -radius * 0.35, radius * 0.35, radius * 0.7);
  }

  // Eyes (Unless Golem with visor slit)
  if (characterClass !== 'heavy') {
    const eyeX = radius * 0.22;
    const eyeSpacing = radius * 0.22;

    if (isBlink) {
      // Cute blinking eye slits
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(eyeX - 2, -eyeSpacing);
      ctx.lineTo(eyeX + 3, -eyeSpacing);
      ctx.moveTo(eyeX - 2, eyeSpacing);
      ctx.lineTo(eyeX + 3, eyeSpacing);
      ctx.stroke();
    } else {
      ctx.fillStyle = isEnemy ? '#fef08a' : '#ffffff';
      ctx.beginPath();
      ctx.ellipse(eyeX, -eyeSpacing, 4.2, 2.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(eyeX, eyeSpacing, 4.2, 2.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pupils
      ctx.fillStyle = isEnemy ? '#dc2626' : '#0f172a';
      ctx.beginPath();
      ctx.arc(eyeX + 1.5, -eyeSpacing, 1.8, 0, Math.PI * 2);
      ctx.arc(eyeX + 1.5, eyeSpacing, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore(); // end head
  ctx.restore(); // end figure
}

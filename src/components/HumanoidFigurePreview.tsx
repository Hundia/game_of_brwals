import React, { useRef, useEffect, useState } from 'react';
import { CharacterDef, Skin } from '../types';
import { drawHumanoidFigure } from '../utils/renderFigure';
import { sound } from '../utils/sound';

interface HumanoidFigurePreviewProps {
  character: CharacterDef;
  skin: Skin;
  size?: number; // Canvas size in pixels, default 220
}

type AnimMode = 'idle' | 'dance' | 'attack';

export const HumanoidFigurePreview: React.FC<HumanoidFigurePreviewProps> = ({
  character,
  skin,
  size = 220,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animMode, setAnimMode] = useState<AnimMode>('idle');
  const [isCheering, setIsCheering] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const render = () => {
      time += 0.045;
      ctx.clearRect(0, 0, size, size);

      const centerX = size / 2;
      const centerY = size / 2 + 10;
      const radius = size * 0.19;

      // 1. Pedestal / Arena Platform
      ctx.save();
      const grad = ctx.createRadialGradient(
        centerX,
        centerY + 35,
        10,
        centerX,
        centerY + 35,
        radius * 2.2
      );
      grad.addColorStop(0, skin.glowColor);
      grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.45)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + 35, radius * 2.2, radius * 0.9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pedestal disk ring
      ctx.strokeStyle = skin.accentColor;
      ctx.lineWidth = 3;
      ctx.shadowColor = skin.glowColor;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + 35, radius * 1.8, radius * 0.65, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Rotating arena runes on pedestal
      for (let i = 0; i < 6; i++) {
        const a = time * 0.6 + (i * Math.PI) / 3;
        const rx = centerX + Math.cos(a) * (radius * 1.7);
        const ry = centerY + 35 + Math.sin(a) * (radius * 0.6);
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(rx, ry, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Alive Physics & Motion based on Mode
      let breathY = Math.sin(time * 2.2) * 3;
      let previewAngle = Math.sin(time * 1.2) * 0.15 + 0.08;
      let walkCycle = time * 12;
      let attackAnim = 0;
      let isDancing = false;

      if (animMode === 'dance' || isCheering) {
        breathY = -Math.abs(Math.sin(time * 6)) * 14; // Bouncy jumping dance
        previewAngle = Math.sin(time * 4) * 0.28;
        walkCycle = time * 24;
        isDancing = true;
      } else if (animMode === 'attack') {
        const attackCycle = (time * 1.5) % 1;
        attackAnim = attackCycle;
        previewAngle = 0.2 + Math.sin(time * 3) * 0.1;
      }

      // 2. Draw Humanoid Figure
      drawHumanoidFigure(ctx, {
        x: centerX,
        y: centerY + breathY,
        radius,
        angle: previewAngle,
        characterClass: character.characterClass,
        skinId: skin.id,
        color: skin.color,
        glowColor: skin.glowColor,
        accentColor: skin.accentColor,
        hairColor: skin.hairColor,
        armorColor: skin.armorColor,
        weaponColor: skin.weaponColor,
        isMoving: isDancing,
        walkCycle,
        attackAnim,
        isShielded: false,
        isDancing,
      });

      // 3. Alive Floating Energy/Magic/Flame Particles
      for (let i = 0; i < 5; i++) {
        const pAngle = time * 1.6 + (i * Math.PI * 2) / 5;
        const pDist = radius * 1.45 + Math.sin(time * 3 + i) * 14;
        const px = centerX + Math.cos(pAngle) * pDist;
        const py = centerY + Math.sin(pAngle) * (pDist * 0.6) - 15;

        ctx.save();
        ctx.fillStyle = skin.accentColor;
        ctx.shadowColor = skin.glowColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(px, py, 2.5 + Math.sin(time * 4 + i) * 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [character, skin, size, animMode, isCheering]);

  const triggerCheer = () => {
    sound.playTrophy();
    setIsCheering(true);
    setTimeout(() => setIsCheering(false), 2200);
  };

  return (
    <div className="flex flex-col items-center select-none">
      {/* Interactive Animated Character Canvas */}
      <div
        className="relative cursor-pointer group"
        onClick={triggerCheer}
        title="לַחַץ כָּאן כְּדֵי לִרְאוֹת אֶת הַדְּמוּת רוֹקֶדֶת וְצוֹהֶלֶת!"
      >
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="rounded-3xl transition-transform duration-300 group-hover:scale-105 active:scale-95 drop-shadow-2xl"
        />

        {/* Alive Status Indicator Pill */}
        <div className="absolute top-2 right-2 bg-emerald-500/90 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md animate-pulse">
          <span className="w-2 h-2 rounded-full bg-white" />
          <span className="game-font-clean">חַי וְנוֹשֵׁם ✨</span>
        </div>

        {/* Hint on hover */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-yellow-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-400/40 pointer-events-none whitespace-nowrap">
          לַחַץ עָלַי לִקְפֹּץ! 👆
        </div>
      </div>

      {/* Animation Controls / GIF-like interactive actions */}
      <div className="flex items-center gap-1.5 mt-1 bg-slate-900/80 p-1 rounded-xl border border-white/10 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            setAnimMode('idle');
          }}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
            animMode === 'idle'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>✨</span>
          <span className="game-font-clean">עֲמִידָה</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playClick();
            setAnimMode('dance');
          }}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
            animMode === 'dance'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>🕺</span>
          <span className="game-font-clean">רִקּוּד</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playClick();
            setAnimMode('attack');
          }}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
            animMode === 'attack'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>⚔️</span>
          <span className="game-font-clean">הַתְקָפָה</span>
        </button>
      </div>
    </div>
  );
};

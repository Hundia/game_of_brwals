import React from 'react';
import { Target, Zap, Shield, Flame, Sparkles, Crosshair, Dumbbell, Feather } from 'lucide-react';
import { CharacterDef } from '../types';

interface BattleControlsProps {
  onShoot: () => void;
  onSuper: () => void;
  ammo: number;
  maxAmmo?: number;
  superCharge: number; // 0 to 1
  isSuperActive?: boolean;
  character: CharacterDef;
  className?: string;
}

export const BattleControls: React.FC<BattleControlsProps> = ({
  onShoot,
  onSuper,
  ammo,
  maxAmmo = 3,
  superCharge,
  isSuperActive = false,
  character,
  className = '',
}) => {
  const isSuperReady = superCharge >= 1.0;

  const getSuperIcon = () => {
    switch (character.id) {
      case 'spark':
        return <Shield className="w-6 h-6 text-white" />;
      case 'storm':
        return <Zap className="w-6 h-6 text-white" />;
      case 'titan':
        return <Flame className="w-6 h-6 text-white" />;
      case 'phoenix':
        return <Feather className="w-6 h-6 text-white" />;
      case 'golem':
        return <Dumbbell className="w-6 h-6 text-white" />;
      case 'shadow':
        return <Sparkles className="w-6 h-6 text-white" />;
      default:
        return <Flame className="w-6 h-6 text-white" />;
    }
  };

  return (
    <div
      id="battle-combat-controls"
      className={`flex flex-col items-center select-none touch-none ${className}`}
    >
      {/* Ammo recharge bars */}
      <div className="flex gap-1 mb-2 items-center justify-center">
        {Array.from({ length: maxAmmo }).map((_, idx) => {
          const filled = ammo >= idx + 1;
          const partial = !filled && ammo > idx ? ammo - idx : 0;
          return (
            <div
              key={idx}
              className="w-7 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700 shadow-inner"
            >
              <div
                className="h-full bg-amber-400 transition-all duration-75"
                style={{ width: filled ? '100%' : `${partial * 100}%` }}
              />
            </div>
          );
        })}
      </div>

      <div className="relative flex items-center justify-center gap-3">
        {/* Super Button (Yellow / Golden, charges up!) */}
        <div className="flex flex-col items-center">
          <button
            id="btn-super-attack"
            type="button"
            disabled={!isSuperReady && !isSuperActive}
            onClick={onSuper}
            className={`relative rounded-full flex flex-col items-center justify-center transition-all duration-150 active:scale-90 ${
              isSuperReady
                ? 'cursor-pointer animate-pulse scale-105'
                : 'opacity-60 cursor-not-allowed'
            }`}
            style={{
              width: 68,
              height: 68,
              background: isSuperReady
                ? 'radial-gradient(circle, #facc15 0%, #ca8a04 70%, #854d0e 100%)'
                : 'radial-gradient(circle, #475569 0%, #1e293b 100%)',
              border: isSuperReady ? '3px solid #fef08a' : '2px solid #64748b',
              boxShadow: isSuperReady
                ? '0 0 25px rgba(250, 204, 21, 0.9), inset 0 0 10px #fef08a'
                : 'none',
            }}
            title={`${character.superName} (מַקַּשׁ Space / E)`}
          >
            {/* Super circular charge ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-1">
              <circle
                cx="30"
                cy="30"
                r="26"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="30"
                cy="30"
                r="26"
                stroke={isSuperReady ? '#ffffff' : '#fbbf24'}
                strokeWidth="4"
                fill="none"
                strokeDasharray={163}
                strokeDashoffset={163 * (1 - Math.min(1, superCharge))}
                strokeLinecap="round"
                className="transition-all duration-150"
              />
            </svg>

            {getSuperIcon()}
            <span className="game-font-clean font-black text-[10px] text-white mt-0.5 tracking-wider uppercase drop-shadow">
              סוּפֶּר
            </span>
          </button>
        </div>

        {/* Primary Red Attack Button per instruction */}
        <div className="flex flex-col items-center">
          <button
            id="btn-shoot-attack"
            type="button"
            onClick={onShoot}
            className="rounded-full flex flex-col items-center justify-center cursor-pointer shadow-2xl transition-all duration-100 active:scale-90 active:brightness-125"
            style={{
              width: 86,
              height: 86,
              background: 'radial-gradient(circle, #ef4444 0%, #dc2626 60%, #991b1b 100%)',
              border: '3px solid #fca5a5',
              boxShadow: '0 0 25px rgba(239, 68, 68, 0.7), inset 0 2px 6px rgba(255,255,255,0.5)',
            }}
            title="יְרִי (מַקַּשׁ Space אוֹ לְחַץ כָּאן)"
          >
            <Target className="w-9 h-9 text-white drop-shadow" />
            <span className="game-font-clean font-black text-[11px] text-white mt-0.5 uppercase tracking-wider drop-shadow">
              יְרִי (FIRE)
            </span>
          </button>
        </div>
      </div>

      <div className="text-[11px] game-font-clean font-bold text-rose-300 mt-1 uppercase tracking-wider text-center drop-shadow">
        כַּפְתּוֹר יְרִי אָדֹם (FIRE)
      </div>
    </div>
  );
};

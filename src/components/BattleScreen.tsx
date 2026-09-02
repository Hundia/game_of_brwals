import React, { useState, useRef } from 'react';
import { Home, Volume2, VolumeX, Wifi } from 'lucide-react';
import { UserProgress, RoomPlayerInfo } from '../types';
import { CHARACTERS } from '../utils/gameData';
import { Joystick } from './Joystick';
import { BattleControls } from './BattleControls';
import { GameCanvas } from './GameCanvas';
import { VictoryDefeatModal } from './VictoryDefeatModal';

interface BattleScreenProps {
  progress: UserProgress;
  onExitToLobby: () => void;
  onVictory: () => void;
  onDefeat: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  multiplayerRoom?: {
    code: string;
    isHost: boolean;
    opponent?: RoomPlayerInfo;
  } | null;
}

export const BattleScreen: React.FC<BattleScreenProps> = ({
  progress,
  onExitToLobby,
  onVictory,
  onDefeat,
  soundEnabled,
  onToggleSound,
  multiplayerRoom,
}) => {
  const [joystickVector, setJoystickVector] = useState({ x: 0, y: 0 });
  const [ammo, setAmmo] = useState(3);
  const [superCharge, setSuperCharge] = useState(0);
  const [matchResult, setMatchResult] = useState<'victory' | 'defeat' | null>(null);
  const [battleKey, setBattleKey] = useState(0);

  const shootTriggerRef = useRef<() => void>(() => {});
  const superTriggerRef = useRef<() => void>(() => {});

  const character = CHARACTERS[progress.selectedChar] || CHARACTERS.spark;
  const activeSkin = character.skins[progress.selectedSkinIdx] || character.skins[0];

  const oppChar = multiplayerRoom?.opponent
    ? CHARACTERS[multiplayerRoom.opponent.charId] || CHARACTERS.storm
    : null;
  const oppSkin = oppChar && multiplayerRoom?.opponent
    ? oppChar.skins[multiplayerRoom.opponent.skinIdx] || oppChar.skins[0]
    : null;

  const handleShoot = () => {
    shootTriggerRef.current();
  };

  const handleSuper = () => {
    superTriggerRef.current();
  };

  const handleWin = () => {
    setMatchResult('victory');
    onVictory();
  };

  const handleLose = () => {
    setMatchResult('defeat');
    onDefeat();
  };

  const handlePlayAgain = () => {
    setMatchResult(null);
    setSuperCharge(0);
    setAmmo(3);
    setJoystickVector({ x: 0, y: 0 });
    setBattleKey((prev) => prev + 1);
  };

  return (
    <div
      id="brawl-battle-screen"
      className="min-h-screen w-full bg-[#050510] text-white flex flex-col justify-between items-center p-2 sm:p-4 select-none touch-none overflow-hidden relative"
      dir="rtl"
    >
      {/* Ambient background glows */}
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-yellow-500/10 blur-[100px] pointer-events-none -z-10 rounded-tl-full" />
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 blur-[110px] pointer-events-none -z-10 rounded-br-full" />

      {/* Battle Top HUD - Immersive UI Style */}
      <header className="w-full max-w-4xl flex items-center justify-between bg-black/40 border-2 border-white/10 rounded-3xl px-3 sm:px-5 py-2.5 shadow-2xl backdrop-blur-md card-glow z-20">
        {/* Return to menu button with 3D arcade red style from design */}
        <button
          id="btn-back-to-menu-battle"
          type="button"
          onClick={onExitToLobby}
          className="btn-arcade-red flex items-center gap-1.5 px-4 py-1.5 rounded-xl game-font-clean font-bold text-xs sm:text-sm text-white tracking-wider shadow-lg cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>תַּפְרִיט (MENU)</span>
        </button>

        {/* Current Match Info with Immersive Game Font */}
        <div className="flex items-center gap-3">
          <div className="text-center">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
              {multiplayerRoom ? 'אַתָּה (אונליין 🟢)' : 'הַלּוֹחֵם שֶׁלְּךָ'}
            </span>
            <span className="game-font-clean font-bold text-xs sm:text-sm text-yellow-300 drop-shadow">
              {character.name} ({activeSkin.name})
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="game-font-clean font-black text-amber-400 text-sm sm:text-base px-2.5 py-0.5 bg-black/50 rounded-full border border-amber-400/40">
              VS
            </span>
            {multiplayerRoom && (
              <span className="text-[9px] text-emerald-400 font-mono font-bold flex items-center gap-1 mt-0.5">
                <Wifi className="w-2.5 h-2.5" />
                {multiplayerRoom.code}
              </span>
            )}
          </div>

          <div className="text-center">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
              {multiplayerRoom ? 'יָרִיב חַי 📱' : 'יָרִיב הַזִּירָה'}
            </span>
            <span className="game-font-clean font-bold text-xs sm:text-sm text-rose-400 drop-shadow">
              {multiplayerRoom?.opponent
                ? `${multiplayerRoom.opponent.name} (${oppChar?.name || 'לוחם'})`
                : 'בּוֹט 🤖 AI'}
            </span>
          </div>
        </div>

        {/* Coins Pill & Audio */}
        <div className="flex items-center gap-2">
          <div className="bg-black/50 px-3.5 py-1 rounded-full border-2 border-white/20 flex items-center gap-1.5 shadow">
            <span className="text-sm">💰</span>
            <span className="game-font-clean font-bold text-sm text-amber-300">{progress.coins}</span>
          </div>

          <button
            id="btn-toggle-sound-battle"
            type="button"
            onClick={onToggleSound}
            className="p-2 rounded-xl bg-black/40 hover:bg-black/60 text-slate-300 hover:text-white border-2 border-white/15 card-glow active:scale-95 transition-all cursor-pointer"
            title={soundEnabled ? 'הַשְׁתֵּק צְלִילִים' : 'הַפְעֵל צְלִילִים'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>
        </div>
      </header>

      {/* Main Game Arena */}
      <main className="w-full max-w-4xl flex-1 flex flex-col justify-center items-center my-1 relative z-10">
        <GameCanvas
          key={battleKey}
          character={character}
          skinColor={activeSkin.color}
          skinGlow={activeSkin.glowColor}
          skinName={activeSkin.name}
          skinId={activeSkin.id}
          skinArmorColor={activeSkin.armorColor}
          skinWeaponColor={activeSkin.weaponColor}
          skinHairColor={activeSkin.hairColor}
          joystickVector={joystickVector}
          onWin={handleWin}
          onLose={handleLose}
          onSuperChargeChange={setSuperCharge}
          onAmmoChange={setAmmo}
          registerTriggerShoot={(fn) => (shootTriggerRef.current = fn)}
          registerTriggerSuper={(fn) => (superTriggerRef.current = fn)}
          multiplayerRoom={multiplayerRoom}
        />
      </main>

      {/* Bottom Controls Bar */}
      <footer className="w-full max-w-4xl flex items-end justify-between px-3 sm:px-6 py-2.5 bg-black/40 border-2 border-white/10 rounded-3xl shadow-2xl backdrop-blur-md card-glow z-20 mb-1">
        {/* Left Side: Dark Blue Joystick */}
        <div className="flex flex-col items-center">
          <Joystick onMove={setJoystickVector} size={120} />
        </div>

        {/* Center Keyboard Shortcuts Guide */}
        <div className="hidden sm:flex flex-col items-center justify-center text-[11px] text-slate-300 px-5 py-2 bg-black/60 rounded-2xl border-2 border-white/10 card-glow">
          <span className="game-font-clean font-bold text-xs text-yellow-400 tracking-wider">
            שְׁלִיטָה בַּקְּרָב (CONTROLS):
          </span>
          <span className="text-slate-300 mt-0.5">WASD / חִצִּים: תְּנוּעָה בַּמַּפָּה</span>
          <span className="text-slate-300">Space (רֶוַח): יְרִי • מַקַּשׁ E / Shift: סוּפֶּר</span>
        </div>

        {/* Right Side: Red Shoot button + Super Button */}
        <div className="flex flex-col items-center">
          <BattleControls
            onShoot={handleShoot}
            onSuper={handleSuper}
            ammo={ammo}
            superCharge={superCharge}
            character={character}
          />
        </div>
      </footer>

      {/* Match Outcome Modal */}
      {matchResult && (
        <VictoryDefeatModal
          isVictory={matchResult === 'victory'}
          character={character}
          onPlayAgain={handlePlayAgain}
          onGoToLobby={onExitToLobby}
        />
      )}
    </div>
  );
};

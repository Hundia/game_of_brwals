import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Gift } from 'lucide-react';
import { CharacterDef, CharacterId, UserProgress } from '../types';
import { CHARACTERS } from '../utils/gameData';
import { sound } from '../utils/sound';
import { HumanoidFigurePreview } from './HumanoidFigurePreview';

interface ChestModalProps {
  progress: UserProgress;
  onClose: () => void;
  onUpdateProgress: (updater: (prev: UserProgress) => UserProgress) => void;
}

type RevealResult =
  | { type: 'character'; charId: CharacterId; char: CharacterDef }
  | { type: 'skin'; charId: CharacterId; char: CharacterDef; skinId: number; skinName: string; skinColor: string }
  | { type: 'coins'; amount: number; message: string };

const ALL_ROSTER: CharacterId[] = ['spark', 'storm', 'titan', 'phoenix', 'golem', 'shadow'];

export const ChestModal: React.FC<ChestModalProps> = ({
  progress,
  onClose,
  onUpdateProgress,
}) => {
  const [chestState, setChestState] = useState<'closed' | 'opening' | 'revealed'>('closed');
  const [result, setResult] = useState<RevealResult | null>(null);

  const canAfford = progress.coins >= 100;

  const handleOpenChest = () => {
    if (progress.coins < 100) return;

    setChestState('opening');
    sound.playChestOpen();

    setTimeout(() => {
      // Deduct 100 coins
      onUpdateProgress((prev) => {
        let newCoins = prev.coins - 100;
        let newUnlockedChars = [...prev.unlockedCharacters];
        let newUnlockedSkins = { ...prev.unlockedSkins };
        let newBoxesOpened = prev.boxesOpened + 1;

        // Check locked characters from the entire 6-character roster
        const lockedChars = ALL_ROSTER.filter((id) => !newUnlockedChars.includes(id));

        // Check locked skins for already unlocked characters
        const lockedSkins: { charId: CharacterId; skinId: number }[] = [];
        newUnlockedChars.forEach((cid) => {
          const char = CHARACTERS[cid];
          if (char) {
            const owned = newUnlockedSkins[cid] || [];
            char.skins.forEach((s) => {
              if (!owned.includes(s.id)) {
                lockedSkins.push({ charId: cid, skinId: s.id });
              }
            });
          }
        });

        const rand = Math.random();
        let currentResult: RevealResult;

        // If locked characters exist, high priority to unlock one!
        if (lockedChars.length > 0 && (rand < 0.6 || lockedSkins.length === 0)) {
          const charToUnlockId = lockedChars[Math.floor(Math.random() * lockedChars.length)];
          newUnlockedChars.push(charToUnlockId);
          newUnlockedSkins[charToUnlockId] = [0]; // default skin unlocked

          currentResult = {
            type: 'character',
            charId: charToUnlockId,
            char: CHARACTERS[charToUnlockId],
          };
        } else if (lockedSkins.length > 0) {
          const chosen = lockedSkins[Math.floor(Math.random() * lockedSkins.length)];
          const char = CHARACTERS[chosen.charId];
          const skinObj = char.skins.find((s) => s.id === chosen.skinId)!;

          newUnlockedSkins[chosen.charId] = [...(newUnlockedSkins[chosen.charId] || []), chosen.skinId];

          currentResult = {
            type: 'skin',
            charId: chosen.charId,
            char: char,
            skinId: chosen.skinId,
            skinName: skinObj.name,
            skinColor: skinObj.color,
          };
        } else {
          // Everything is already unlocked! Bonus coins compensation
          newCoins += 60;
          currentResult = {
            type: 'coins',
            amount: 60,
            message: 'כָּל הַדְּמוּיוֹת וְהַסְּקִינִים כְּבָר פְּתוּחִים! קִבַּלְתָּ הֶחְזֵר שֶׁל 60 מַטְבְּעוֹת.',
          };
        }

        setResult(currentResult);
        setChestState('revealed');

        try {
          confetti({
            particleCount: 110,
            spread: 75,
            origin: { y: 0.55 },
          });
        } catch {
          // confetti fallback
        }

        return {
          ...prev,
          coins: newCoins,
          unlockedCharacters: newUnlockedChars,
          unlockedSkins: newUnlockedSkins,
          boxesOpened: newBoxesOpened,
        };
      });
    }, 1200);
  };

  const handleOpenAnother = () => {
    setChestState('closed');
    setResult(null);
  };

  return (
    <div
      id="modal-chest-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in"
      dir="rtl"
    >
      <div className="relative w-full max-w-md bg-[#0c0c20] border-4 border-yellow-500/60 rounded-3xl p-6 text-center card-glow-amber shadow-2xl text-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 bg-black/50 px-4 py-1.5 rounded-full border-2 border-white/20">
            <span className="text-xl">💰</span>
            <span className="game-font-clean text-amber-300 text-lg">{progress.coins}</span>
          </div>
          <button
            id="btn-close-chest-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl font-bold p-1 leading-none transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <h2 className="game-font-clean text-2xl sm:text-3xl text-yellow-400 tracking-wide flex items-center justify-center gap-2 mb-1">
          <Gift className="w-8 h-8 text-yellow-400 animate-bounce" />
          תֵּבַת בְּרָאוּל (BRAWL BOX)
        </h2>
        <p className="text-xs sm:text-sm text-purple-200 mb-6 font-medium leading-relaxed">
          פְּתַח אֶת הַתֵּבָה כְּדֵי לִזְכּוֹת בִּדְמוּיוֹת לְחִימָה חֲדָשׁוֹת וּבִסְקִינִים מַגְנִיבִים!
        </p>

        {/* Chest Visual State */}
        {chestState === 'closed' && (
          <div className="flex flex-col items-center py-4">
            <div
              className="relative w-36 h-36 flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
              onClick={canAfford ? handleOpenChest : undefined}
            >
              <div className="absolute inset-0 bg-yellow-500/25 rounded-full blur-2xl animate-pulse" />
              <div className="relative z-10 w-28 h-28 bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-400 rounded-3xl border-4 border-white shadow-2xl flex flex-col items-center justify-center rotate-3">
                <Gift className="w-14 h-14 text-white drop-shadow" />
                <span className="game-font-clean text-xs text-slate-950 bg-amber-200 px-2.5 py-0.5 rounded-full mt-1 font-bold">
                  100 💰
                </span>
              </div>
            </div>

            {canAfford ? (
              <button
                id="btn-open-chest-action"
                onClick={handleOpenChest}
                className="btn-brawl mt-6 w-full py-4 rounded-2xl shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-6 h-6 text-white drop-shadow" />
                <span className="game-font-clean text-xl text-white tracking-wide">
                  פְּתַח תֵּבָה עַכְשָׁו (100 מַטְבְּעוֹת)
                </span>
              </button>
            ) : (
              <div className="mt-6 w-full p-3 bg-red-950/60 border-2 border-red-500/40 rounded-2xl text-red-200 text-sm font-medium leading-relaxed">
                חֲסֵרִים לְךָ {100 - progress.coins} מַטְבְּעוֹת. נַצַּח בִּקְרָבוֹת נוֹסָפִים כְּדֵי לְהַרְוִיחַ 10 מַטְבְּעוֹת לְכָל נִצָּחוֹן!
              </div>
            )}
          </div>
        )}

        {/* Opening animation */}
        {chestState === 'opening' && (
          <div className="py-12 flex flex-col items-center justify-center animate-pulse">
            <div className="w-32 h-32 bg-amber-400 rounded-3xl animate-spin flex items-center justify-center shadow-2xl border-4 border-white">
              <Sparkles className="w-16 h-16 text-slate-950" />
            </div>
            <div className="game-font-clean text-2xl text-yellow-300 mt-6 tracking-wide font-bold">
              הַתֵּבָה נִפְתַּחַת... 🎁
            </div>
          </div>
        )}

        {/* Revealed result */}
        {chestState === 'revealed' && result && (
          <div className="py-2 flex flex-col items-center animate-in zoom-in-95 duration-300">
            {result.type === 'character' && (
              <div className="flex flex-col items-center">
                <div className="inline-block px-3.5 py-1 bg-yellow-400 text-slate-950 game-font-clean font-black text-xs rounded-full mb-2 uppercase shadow">
                  דְּמוּת חֲדָשָׁה נִפְתְּחָה! 🌟
                </div>
                <div className="my-1">
                  <HumanoidFigurePreview
                    character={result.char}
                    skin={result.char.skins[0]}
                    size={160}
                  />
                </div>
                <h3 className="game-font-clean font-black text-2xl text-yellow-400 uppercase tracking-wider mt-1">
                  {result.char.name}
                </h3>
                <span className="game-font-clean text-xs text-purple-300 font-bold">
                  {result.char.tierName} • {result.char.classTitle}
                </span>
                <p className="text-xs text-slate-300 mt-2 px-4 text-center leading-relaxed">
                  {result.char.lore}
                </p>
                <div className="mt-3 bg-black/60 p-3 rounded-2xl text-xs text-slate-200 border border-white/10 text-center">
                  <span className="game-font-clean font-bold text-yellow-400">מַתְקָפַת סוּפֶּר: </span>
                  {result.char.superName}
                </div>
              </div>
            )}

            {result.type === 'skin' && (
              <div className="flex flex-col items-center">
                <div className="inline-block px-3.5 py-1 bg-purple-600 text-white game-font-clean font-black text-xs rounded-full mb-2 uppercase shadow">
                  סְקִין חָדָשׁ נִפְתַּח! 🎨
                </div>
                <div className="my-1">
                  <HumanoidFigurePreview
                    character={result.char}
                    skin={result.char.skins.find((s) => s.id === result.skinId) || result.char.skins[0]}
                    size={160}
                  />
                </div>
                <h3 className="game-font-clean font-black text-2xl text-white tracking-wide mt-1">
                  {result.skinName}
                </h3>
                <span className="text-xs game-font-clean font-bold text-purple-300">
                  עֲבוּר הַלּוֹחֵם {result.char.name}
                </span>
                <p className="text-xs text-slate-300 mt-2 px-4 text-center leading-relaxed">
                  {result.char.skins.find((s) => s.id === result.skinId)?.tagline}
                </p>
              </div>
            )}

            {result.type === 'coins' && (
              <div className="flex flex-col items-center">
                <div className="text-5xl my-3">💰</div>
                <h3 className="game-font-clean text-3xl text-yellow-300">+{result.amount} מַטְבְּעוֹת</h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">{result.message}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 w-full mt-6">
              {progress.coins >= 100 && (
                <button
                  id="btn-open-another-chest"
                  onClick={handleOpenAnother}
                  className="btn-arcade-amber flex-1 py-3.5 text-white game-font-clean font-bold rounded-2xl text-sm transition-transform cursor-pointer shadow-lg"
                >
                  עוֹד תֵּבָה (100 💰)
                </button>
              )}
              <button
                id="btn-chest-done"
                onClick={onClose}
                className="btn-arcade-green flex-1 py-3.5 text-white game-font-clean font-bold rounded-2xl text-sm transition-transform cursor-pointer shadow-lg"
              >
                סִיּוּם וְאִשּׁוּר ✓
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

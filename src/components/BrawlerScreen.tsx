import React, { useState } from 'react';
import {
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  Target,
  Swords,
  Lock,
  Check,
  CheckCircle,
  Dumbbell,
  Flame,
  Feather,
} from 'lucide-react';
import { CharacterDef, CharacterId, UserProgress } from '../types';
import { CHARACTERS } from '../utils/gameData';
import { sound } from '../utils/sound';
import { HumanoidFigurePreview } from './HumanoidFigurePreview';

interface BrawlerScreenProps {
  progress: UserProgress;
  onSelectCharacter: (charId: CharacterId, skinIdx: number) => void;
  onEquipPowerUp?: (charId: CharacterId, powerUpId: string) => void;
  onClose: () => void;
  onOpenChestModal: () => void;
  onUnlockAll?: () => void;
}

const ALL_CHAR_IDS: CharacterId[] = ['spark', 'storm', 'titan', 'phoenix', 'golem', 'shadow'];

export const BrawlerScreen: React.FC<BrawlerScreenProps> = ({
  progress,
  onSelectCharacter,
  onEquipPowerUp,
  onClose,
  onOpenChestModal,
  onUnlockAll,
}) => {
  const [activeCharId, setActiveCharId] = useState<CharacterId>(progress.selectedChar);
  const [activeSkinIdx, setActiveSkinIdx] = useState<number>(progress.selectedSkinIdx);

  const charDef: CharacterDef = CHARACTERS[activeCharId] || CHARACTERS.spark;
  const isSelectedForBattle = progress.selectedChar === activeCharId;
  const isCharUnlocked = progress.unlockedCharacters.includes(activeCharId);
  const unlockedSkins = progress.unlockedSkins[activeCharId] || [0];
  const activeSkin = charDef.skins[activeSkinIdx] || charDef.skins[0];
  const equippedPowerUpId = progress.equippedPowerUps?.[activeCharId];

  const handlePickBrawler = (cid: CharacterId) => {
    setActiveCharId(cid);
    setActiveSkinIdx(0);
    sound.playClick();
  };

  const handleSelectActiveBrawler = () => {
    onSelectCharacter(activeCharId, activeSkinIdx);
    sound.playTrophy();
  };

  const getClassEmoji = (charClass: string) => {
    switch (charClass) {
      case 'shooter':
        return '🔫';
      case 'swordsman':
        return '⚔️';
      case 'mage':
        return '🔮';
      case 'archer':
        return '🏹';
      case 'heavy':
        return '🥊';
      case 'ninja':
        return '🥷';
      default:
        return '⚡';
    }
  };

  return (
    <div
      id="brawler-dedicated-screen"
      className="fixed inset-0 z-50 bg-[#050510] text-white flex flex-col select-none overflow-y-auto overflow-x-hidden"
      dir="rtl"
    >
      {/* Background ambient lighting */}
      <div
        className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full blur-[130px] pointer-events-none opacity-25 transition-colors duration-500"
        style={{ backgroundColor: activeSkin.color }}
      />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-blue-600/15 blur-[120px] pointer-events-none" />

      {/* TOP HEADER */}
      <header className="w-full max-w-6xl mx-auto px-4 py-3 flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-from-brawlers"
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white game-font-clean font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>חֲזָרָה לַתַּפְרִיט (BACK)</span>
          </button>

          <div className="flex items-center gap-2 mr-2">
            <h1 className="game-font-clean font-black text-lg sm:text-2xl text-yellow-400">
              דַּף לוֹחֲמִים וְשִׁדְרוּגִים
            </h1>
            <span className="text-xs bg-yellow-400/20 text-yellow-300 font-bold px-2.5 py-0.5 rounded-full border border-yellow-400/40">
              {progress.unlockedCharacters.length}/6 פְּתוּחִים
            </span>
          </div>
        </div>

        {/* Currency & Quick Unlock */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onUnlockAll && (
            <button
              type="button"
              onClick={onUnlockAll}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 border border-white/30 text-white game-font-clean text-xs font-bold shadow-md cursor-pointer hover:brightness-110 active:scale-95"
              title="לחץ לפתיחת כל הדמויות והסקינים מיד!"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>פְּתַח הַכֹּל ✨</span>
            </button>
          )}

          <div className="bg-black/50 px-3.5 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5 shadow">
            <span className="text-base">💰</span>
            <span className="game-font-clean font-bold text-sm sm:text-base text-amber-300">
              {progress.coins}
            </span>
          </div>

          <div className="bg-black/50 px-3.5 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5 shadow">
            <span className="text-base">🏆</span>
            <span className="game-font-clean font-bold text-sm sm:text-base text-yellow-300">
              {progress.trophies}
            </span>
          </div>
        </div>
      </header>

      {/* HORIZONTAL BRAWLER SELECTOR BAR */}
      <nav className="w-full max-w-6xl mx-auto px-4 py-3 z-10">
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {ALL_CHAR_IDS.map((cid) => {
            const char = CHARACTERS[cid];
            if (!char) return null;
            const isUnlocked = progress.unlockedCharacters.includes(cid);
            const isCurrentView = activeCharId === cid;
            const isEquippedInBattle = progress.selectedChar === cid;

            return (
              <button
                key={cid}
                id={`btn-select-brawler-tab-${cid}`}
                type="button"
                onClick={() => handlePickBrawler(cid)}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-2xl border-2 transition-all cursor-pointer ${
                  isCurrentView
                    ? 'border-yellow-400 bg-yellow-400/20 shadow-lg scale-105 shadow-yellow-500/20'
                    : isUnlocked
                    ? 'border-white/10 bg-black/40 hover:bg-black/60 hover:border-white/30'
                    : 'border-white/5 bg-black/20 opacity-50 hover:opacity-80'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-md border border-white/30"
                  style={{ backgroundColor: char.skins[0].color }}
                >
                  {getClassEmoji(char.characterClass)}
                </div>
                <div className="text-right">
                  <div className="game-font-clean font-bold text-xs sm:text-sm text-white flex items-center gap-1">
                    <span>{char.name}</span>
                    {isEquippedInBattle && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400" title="נבחר לקרב" />
                    )}
                  </div>
                  <div className="text-[10px] text-slate-300">
                    {isUnlocked ? (
                      <span className="text-emerald-300">פָּתוּחַ ✓</span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5 inline" /> 100 💰
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* MAIN BRAWLER SHOWCASE & STATS GRID */}
      <main className="w-full max-w-6xl mx-auto px-4 py-2 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start z-10 pb-8">
        {/* LEFT/CENTER: 3D HUMANOID PREVIEW & SKINS SELECTOR */}
        <section className="lg:col-span-6 flex flex-col items-center bg-black/40 border-2 border-white/10 rounded-3xl p-4 sm:p-6 backdrop-blur-md card-glow relative overflow-hidden">
          {/* Tier & Class Tags */}
          <div className="flex items-center gap-2 mb-2 z-10">
            <span
              className={`px-3 py-1 rounded-full text-xs game-font-clean font-bold text-white ${charDef.tierBadgeColor} shadow`}
            >
              {charDef.tierName}
            </span>
            <span className="bg-black/60 px-3 py-1 rounded-full text-xs text-yellow-300 border border-white/20 game-font-clean font-bold">
              {charDef.classTitle}
            </span>
          </div>

          {/* Character Title */}
          <h2 className="game-font-clean font-black text-3xl sm:text-4xl text-yellow-400 tracking-wide mb-1 z-10 text-center">
            {charDef.name}
          </h2>
          <p className="text-xs text-purple-200 font-medium mb-3 z-10 text-center max-w-md">
            {charDef.lore}
          </p>

          {/* Living Animated Humanoid Figure */}
          <div className="relative my-2 z-10 flex flex-col items-center justify-center">
            <HumanoidFigurePreview
              character={charDef}
              skin={activeSkin}
              size={240}
            />

            <div className="mt-2 bg-black/70 px-4 py-1 rounded-full border border-yellow-400/40 shadow-md">
              <span className="game-font-clean font-bold text-xs text-yellow-300">
                סְקִין: {activeSkin.name}
              </span>
            </div>
          </div>

          {/* Skins Selector (3 unique skins) */}
          <div className="w-full mt-4 z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="game-font-clean font-bold text-xs text-slate-200 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                סְקִינִים מְיֻחָדִים ({unlockedSkins.length}/{charDef.skins.length})
              </span>
              <span className="text-[11px] text-slate-400">בְּחַר מַרְאֶה לַקְּרָב</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {charDef.skins.map((skin, idx) => {
                const isUnlocked = unlockedSkins.includes(skin.id);
                const isChosen = activeSkinIdx === idx;

                return (
                  <button
                    key={skin.id}
                    id={`btn-brawler-screen-skin-${skin.id}`}
                    type="button"
                    disabled={!isUnlocked}
                    onClick={() => {
                      setActiveSkinIdx(idx);
                      sound.playClick();
                    }}
                    className={`p-2.5 rounded-2xl border-2 text-right transition-all flex items-center gap-2.5 ${
                      isChosen
                        ? 'border-yellow-400 bg-yellow-400/20 shadow-md scale-[1.02]'
                        : isUnlocked
                        ? 'border-white/10 bg-black/40 hover:border-white/30 cursor-pointer'
                        : 'border-white/5 bg-black/20 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full border-2 border-white/60 shadow flex items-center justify-center text-xs flex-shrink-0"
                      style={{ backgroundColor: skin.color }}
                    >
                      {idx === 0 ? '⭐' : idx === 1 ? '🔥' : '👑'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="game-font-clean font-bold text-xs text-white truncate">
                        {skin.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {isUnlocked ? (isChosen ? 'נִבְחַר כָּעֵת ✓' : 'לִבְחִירָה') : 'נָעוּל בַּתֵּבָה 🔒'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Select / Equip Brawler Button */}
          <div className="w-full mt-5 z-10">
            {isCharUnlocked ? (
              <button
                id="btn-choose-this-brawler"
                type="button"
                onClick={handleSelectActiveBrawler}
                className={`w-full py-3.5 rounded-2xl game-font-clean font-black text-base tracking-wide shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
                  isSelectedForBattle && progress.selectedSkinIdx === activeSkinIdx
                    ? 'bg-emerald-600 border-2 border-emerald-400 text-white cursor-default'
                    : 'btn-brawl text-yellow-950 hover:brightness-110'
                }`}
              >
                {isSelectedForBattle && progress.selectedSkinIdx === activeSkinIdx ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-white" />
                    <span>נִבְחַר כְּלוֹחֵם פָּעִיל לַקְּרָב ✓</span>
                  </>
                ) : (
                  <>
                    <Swords className="w-5 h-5" />
                    <span>בְּחַר אֶת {charDef.name} לַקְּרָב!</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenChestModal}
                className="w-full py-3.5 rounded-2xl btn-arcade-amber game-font-clean font-bold text-sm tracking-wide shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>פְּתַח אֶת {charDef.name} בַּחֲנוּת הַתֵּבוֹת (100 💰)</span>
              </button>
            )}
          </div>
        </section>

        {/* RIGHT: STATS METERS, ABILITIES & POWER-UPS SELECTION */}
        <section className="lg:col-span-6 flex flex-col gap-4">
          {/* STATS BARS CARD */}
          <div className="bg-black/40 border-2 border-white/10 rounded-3xl p-4 sm:p-5 backdrop-blur-md card-glow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="game-font-clean font-bold text-sm sm:text-base text-yellow-400">
                נְתוּנֵי לוֹחֵם בַּקְּרָב (BRAWLER STATS)
              </h3>
              <span className="text-xs bg-yellow-400/20 text-yellow-300 font-bold px-2 py-0.5 rounded-full border border-yellow-400/30">
                רָמָה 10 ⭐ (מַקְסִימוּם)
              </span>
            </div>

            <div className="space-y-3">
              {/* Health */}
              <div>
                <div className="flex justify-between text-xs game-font-clean font-bold text-slate-300 mb-1">
                  <span>נְקֻדּוֹת חַיִּים (HEALTH)</span>
                  <span className="text-emerald-400 font-bold">{charDef.hp}</span>
                </div>
                <div className="stat-bar-bg">
                  <div
                    className="stat-fill-hp"
                    style={{ width: `${Math.min(100, (charDef.hp / 240) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Damage */}
              <div>
                <div className="flex justify-between text-xs game-font-clean font-bold text-slate-300 mb-1">
                  <span>עָצְמַת נֶזֶק (ATTACK DAMAGE)</span>
                  <span className="text-rose-400 font-bold">
                    {charDef.bulletsPerShot > 1
                      ? `${charDef.damage} x ${charDef.bulletsPerShot} (${charDef.damage * charDef.bulletsPerShot})`
                      : charDef.damage}
                  </span>
                </div>
                <div className="stat-bar-bg">
                  <div
                    className="stat-fill-atk"
                    style={{ width: `${Math.min(100, ((charDef.damage * charDef.bulletsPerShot) / 55) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Speed */}
              <div>
                <div className="flex justify-between text-xs game-font-clean font-bold text-slate-300 mb-1">
                  <span>מְהִירוּת תְּנוּעָה (MOVEMENT SPEED)</span>
                  <span className="text-blue-400 font-bold">{charDef.speed}</span>
                </div>
                <div className="stat-bar-bg">
                  <div
                    className="stat-fill-spd"
                    style={{ width: `${Math.min(100, (charDef.speed / 7) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ATTACK & SUPER ABILITY DETAILS */}
          <div className="bg-black/40 border-2 border-white/10 rounded-3xl p-4 sm:p-5 backdrop-blur-md card-glow space-y-3">
            {/* Primary weapon */}
            <div className="border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2 game-font-clean font-bold text-xs text-blue-300 mb-1">
                <Target className="w-4 h-4 text-blue-400" />
                נֶשֶׁק רָאשִׁי: {charDef.weaponName}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {charDef.characterClass === 'shooter'
                  ? 'יוֹרֶה צֶמֶד קְלִיעֵי לֵיְזֶר פְּלַזְמָה מְדֻיָּקִים וּמְהִירִים הַפּוֹגְעִים בְּיַחַד לְנֶזֶק כָּפוּל.'
                  : charDef.characterClass === 'swordsman'
                  ? 'מְבַצֵּעַ שִׁיסוּף חֶרֶב קַטְלָנִי וּמְשַׁגֵּר גַּל אֶנֶרְגְּיָה חוֹתֵךְ לְמֶרְחָק.'
                  : charDef.characterClass === 'mage'
                  ? 'מְשַׁגֵּר כַּדּוּרֵי אֵשׁ וּבָרָק קוֹסְמִיִּים הַמִּתְפּוֹצְצִים בִּפְגִיעָה וּמַשְׁמִידִים מִכְשׁוֹלִים.'
                  : charDef.characterClass === 'archer'
                  ? 'יוֹרֶה חִצֵּי לֶהָבָה מְדֻיָּקִים הַחוֹדְרִים אֶת מַגִּנֵּי הָאוֹיֵב.'
                  : charDef.characterClass === 'heavy'
                  ? 'יוֹרֶה אֶגְרוֹפֵי פְּלָדָה הִידְרָאוּלִיִּים עִם שִׁרְיוֹן כָּבֵד הַסּוֹפֵג מַכּוֹת.'
                  : 'יוֹרֶה 3 כּוֹכְבֵי שׁוּרִיקֶן מְהִירִים לְפְגִיעַת מַחַץ מִטְּוַח קָצָר.'}
              </p>
            </div>

            {/* Super attack */}
            <div>
              <div className="flex items-center gap-2 game-font-clean font-bold text-xs text-yellow-300 mb-1">
                <Zap className="w-4 h-4 text-yellow-400" />
                מַתְקָפַת סוּפֶּר: {charDef.superName}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {charDef.superDesc}
              </p>
            </div>
          </div>

          {/* DESIGNATED POWER-UPS / UPGRADES SECTION */}
          <div className="bg-black/40 border-2 border-yellow-500/30 rounded-3xl p-4 sm:p-5 backdrop-blur-md card-glow-amber">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                <h3 className="game-font-clean font-black text-sm sm:text-base text-yellow-300">
                  שִׁדְרוּגֵי כֹּחַ וְגַאדְגֶ'טִים (POWER-UPS)
                </h3>
              </div>
              <span className="text-[11px] text-amber-200 font-bold bg-amber-400/20 px-2.5 py-0.5 rounded-full border border-amber-400/40">
                בְּחַר שִׁדְרוּג פָּעִיל
              </span>
            </div>

            <p className="text-xs text-slate-300 mb-3 font-medium">
              לְכָל לוֹחֵם יֵשׁ 3 שִׁדְרוּגֵי כֹּחַ מְיֻחָדִים. לְחַץ עַל שִׁדְרוּג כְּדֵי לְהַפְעִיל אוֹתוֹ בַּקְּרָב:
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              {charDef.powerUps.map((pu) => {
                const isEquipped = equippedPowerUpId === pu.id;

                return (
                  <button
                    key={pu.id}
                    id={`btn-equip-powerup-${pu.id}`}
                    type="button"
                    onClick={() => {
                      onEquipPowerUp?.(charDef.id, pu.id);
                    }}
                    className={`p-3 rounded-2xl border-2 text-right transition-all cursor-pointer flex items-center justify-between ${
                      isEquipped
                        ? 'border-yellow-400 bg-yellow-400/25 shadow-lg shadow-yellow-500/20'
                        : 'border-white/10 bg-black/40 hover:bg-black/60 hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-black/50 border border-white/20 flex items-center justify-center text-xl shadow">
                        {pu.icon}
                      </div>
                      <div>
                        <div className="game-font-clean font-bold text-xs sm:text-sm text-white">
                          {pu.name}
                        </div>
                        <div className="text-[11px] text-slate-300 mt-0.5">
                          {pu.desc}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0 mr-2">
                      <span className="text-[11px] text-amber-300 font-black bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                        {pu.statBonus}
                      </span>
                      {isEquipped ? (
                        <span className="text-[10px] game-font-clean font-black bg-emerald-500 text-slate-950 px-2.5 py-0.5 rounded-full shadow">
                          מֻפְעָל ✓
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 border border-white/20 px-2 py-0.5 rounded-full">
                          הַפְעֵל
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

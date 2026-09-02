import React, { useState } from 'react';
import {
  Sparkles,
  Lock,
  Gift,
  Swords,
  Volume2,
  VolumeX,
  Zap,
  CheckCircle,
  Shield,
  Target,
  Users,
  Shirt,
  MessageSquare,
  Play,
  Copy,
  Check,
  Flame,
  ChevronLeft,
  Settings,
  Info,
  Smartphone,
} from 'lucide-react';
import { CharacterDef, CharacterId, UserProgress } from '../types';
import { CHARACTERS } from '../utils/gameData';
import { sound } from '../utils/sound';
import { HumanoidFigurePreview } from './HumanoidFigurePreview';

interface LobbyProps {
  progress: UserProgress;
  onSelectCharacter: (charId: CharacterId, skinIdx: number) => void;
  onEquipPowerUp?: (charId: CharacterId, powerUpId: string) => void;
  onUnlockAll?: () => void;
  onStartBattle: () => void;
  onOpenChestModal: () => void;
  onOpenBrawlerScreen: () => void;
  onOpenTeamModal: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  progress,
  onSelectCharacter,
  onUnlockAll,
  onStartBattle,
  onOpenChestModal,
  onOpenBrawlerScreen,
  onOpenTeamModal,
  soundEnabled,
  onToggleSound,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [emoteBubble, setEmoteBubble] = useState<string | null>(null);
  const [selectedGameMode, setSelectedGameMode] = useState<'solo' | 'room'>('solo');

  const selectedCharDef = CHARACTERS[progress.selectedChar] || CHARACTERS.spark;
  const unlockedSkinsForChar = progress.unlockedSkins[progress.selectedChar] || [0];
  const activeSkin = selectedCharDef.skins[progress.selectedSkinIdx] || selectedCharDef.skins[0];
  const equippedPowerUpId = progress.equippedPowerUps?.[progress.selectedChar];
  const equippedPowerUp = selectedCharDef.powerUps.find((p) => p.id === equippedPowerUpId);

  const canOpenChest = progress.coins >= 100;
  const teamCode = 'XWS4';

  const handleCopyTeamCode = () => {
    navigator.clipboard?.writeText(teamCode);
    setCopiedCode(true);
    sound.playClick();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCycleSkin = () => {
    sound.playClick();
    if (unlockedSkinsForChar.length <= 1) {
      // If only 1 skin unlocked, open the brawler screen to show all skins!
      onOpenBrawlerScreen();
      return;
    }
    const currentIdxInUnlocked = unlockedSkinsForChar.indexOf(progress.selectedSkinIdx);
    const nextIdxInUnlocked = (currentIdxInUnlocked + 1) % unlockedSkinsForChar.length;
    onSelectCharacter(progress.selectedChar, unlockedSkinsForChar[nextIdxInUnlocked]);
  };

  const handleTriggerEmote = () => {
    sound.playClick();
    const emotes = ['😎🔥', '⭐💪', '⚡💥', '🎯🏆', '👑✨', '⚔️🛡️'];
    const randomEmote = emotes[Math.floor(Math.random() * emotes.length)];
    setEmoteBubble(randomEmote);
    setTimeout(() => setEmoteBubble(null), 2500);
  };

  return (
    <div
      id="brawl-stars-lobby-main"
      className="min-h-screen w-full bg-[#070b1a] text-white flex flex-col justify-between relative overflow-hidden select-none p-2 sm:p-4"
      dir="rtl"
    >
      {/* ARENA BACKGROUND WITH MOONLIGHT & PIRATE SHIP DECK */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        {/* Night sky gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#030712] via-[#09112a] to-[#040817]" />

        {/* Stadium arena spotlights */}
        <div className="absolute top-0 left-1/4 w-[450px] h-[450px] bg-blue-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-0 right-1/4 w-[450px] h-[450px] bg-yellow-500/10 rounded-full blur-[140px]" />

        {/* Moonlight circle glowing behind the brawler */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[480px] h-[340px] sm:h-[480px] bg-gradient-to-b from-blue-400/20 via-indigo-600/10 to-transparent rounded-full blur-[70px]" />

        {/* 3D Wooden Ship Deck Platform (Brawl Stars stage) */}
        <div className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 w-[380px] sm:w-[580px] h-[130px] sm:h-[180px] rounded-[50%] bg-gradient-to-b from-[#3a2215] via-[#24130b] to-[#120804] border-4 border-[#613b20] shadow-[0_15px_40px_rgba(0,0,0,0.95)] opacity-95">
          {/* Deck wood planks stripes */}
          <div className="w-full h-full rounded-[50%] flex justify-around opacity-25 overflow-hidden">
            <div className="w-1 h-full bg-black/60" />
            <div className="w-1 h-full bg-black/60" />
            <div className="w-1 h-full bg-black/60" />
            <div className="w-1 h-full bg-black/60" />
            <div className="w-1 h-full bg-black/60" />
            <div className="w-1 h-full bg-black/60" />
          </div>
          {/* Stage glow rim */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-[70%] h-3 bg-yellow-400/30 rounded-full blur-sm" />
        </div>
      </div>

      {/* TOP NAVIGATION BAR (Exact Brawl Stars Layout) */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between gap-2 z-20 px-1 py-1 sm:py-2">
        {/* Left: Player Profile Avatar Box */}
        <div className="flex items-center gap-2 sm:gap-3 bg-black/50 border border-white/15 px-2 sm:px-3 py-1.5 rounded-2xl backdrop-blur-md shadow-md">
          {/* Angled Avatar Icon */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 border-2 border-yellow-400 rounded-xl flex items-center justify-center font-black text-sm text-yellow-300 shadow-md">
            XP
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="game-font-clean font-black text-xs sm:text-sm text-white tracking-wide">
                אַלּוּף הַזִּירָה 🌟
              </span>
              <span className="text-[10px] bg-yellow-400/20 text-yellow-300 font-bold px-1.5 py-0.2 rounded-full border border-yellow-400/40">
                רָמָה {progress.totalWins + 1}
              </span>
            </div>
            {/* XP progress bar */}
            <div className="w-24 sm:w-32 h-2 bg-black/80 rounded-full border border-white/20 mt-1 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                style={{ width: `${Math.min(100, (progress.coins % 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center: Trophy Road Progress */}
        <div className="flex items-center gap-2">
          <div className="bg-[#24133b] border-2 border-purple-500/50 px-3 sm:px-4 py-1 rounded-2xl flex items-center gap-2 shadow-lg">
            <span className="text-base sm:text-lg">🏆</span>
            <div className="flex flex-col">
              <span className="game-font font-black text-xs sm:text-sm text-yellow-300 leading-tight">
                {progress.trophies}
              </span>
              <div className="w-16 sm:w-24 h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/20">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-yellow-400"
                  style={{ width: `${Math.min(100, (progress.trophies % 50) * 2)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Coins */}
          <div className="bg-black/50 border border-white/15 px-3 py-1 rounded-2xl flex items-center gap-1.5 shadow-md">
            <span className="text-sm sm:text-base">💰</span>
            <span className="game-font font-bold text-xs sm:text-sm text-amber-300">
              {progress.coins}
            </span>
          </div>
        </div>

        {/* Right: Team Code, Sound & Unlock All */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Team Code Pill (Matches Brawl Stars screenshot: Team Code: XWS4) */}
          <button
            id="btn-lobby-team-code"
            type="button"
            onClick={handleCopyTeamCode}
            className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-900/60 hover:bg-blue-800/80 border border-blue-400/40 text-xs font-bold text-blue-200 shadow cursor-pointer transition-all active:scale-95"
            title="העתק קוד צוות לחיבור טלפון שני"
          >
            <span>קֵוֹד צֶוֶת:</span>
            <span className="font-mono font-black text-yellow-300 tracking-wider">{teamCode}</span>
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Quick Unlock All Button */}
          {onUnlockAll && (
            <button
              id="btn-unlock-all-lobby"
              type="button"
              onClick={onUnlockAll}
              className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 border border-white/30 text-white game-font-clean text-[11px] font-bold shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1"
              title="פתח את כל הדמויות והסקינים מיד"
            >
              <Sparkles className="w-3 h-3 text-yellow-300" />
              <span className="hidden sm:inline">פְּתַח הַכֹּל ✨</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            className="w-9 h-9 rounded-xl bg-black/50 hover:bg-black/80 border border-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer shadow"
            title={soundEnabled ? 'הַשְׁתֵּק שְׁמַע' : 'הַפְעֵל שְׁמַע'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-yellow-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </header>

      {/* MAIN BODY: LEFT SIDEBAR + CENTER BRAWLER STAGE + RIGHT TOOLS */}
      <div className="w-full max-w-6xl mx-auto flex-1 flex items-center justify-between relative px-2 sm:px-6 my-auto">
        {/* LEFT SIDEBAR (Iconic Brawl Stars Left Navigation) */}
        <aside className="flex flex-col gap-2.5 sm:gap-3.5 z-20">
          {/* 1. SHOP (חֲנוּת) BUTTON */}
          <button
            id="btn-sidebar-shop"
            type="button"
            onClick={onOpenChestModal}
            className="relative flex flex-col items-center justify-center w-16 sm:w-20 h-16 sm:h-20 rounded-2xl bg-gradient-to-b from-[#f59e0b] to-[#b45309] border-3 border-[#fef08a] shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer group"
          >
            <span className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform">🎁</span>
            <span className="game-font-clean font-black text-[11px] sm:text-xs text-yellow-950 mt-0.5">
              חֲנוּת
            </span>
            {canOpenChest ? (
              <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full border border-white animate-pulse">
                פְּתַח!
              </span>
            ) : (
              <span className="absolute -top-1.5 -right-1.5 bg-black/80 text-yellow-300 font-bold text-[9px] px-1.5 py-0.5 rounded-full border border-yellow-400/40">
                100 💰
              </span>
            )}
          </button>

          {/* 2. BRAWLERS (לוֹחֲמִים וְשִׁדְרוּגִים) - THIS LINKS TO THE DEDICATED CHARACTER PAGE! */}
          <button
            id="btn-sidebar-brawlers"
            type="button"
            onClick={onOpenBrawlerScreen}
            className="relative flex flex-col items-center justify-center w-16 sm:w-20 h-16 sm:h-20 rounded-2xl bg-gradient-to-b from-[#2563eb] to-[#1e40af] border-3 border-[#93c5fd] shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer group"
          >
            <span className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform">🥊</span>
            <span className="game-font-clean font-black text-[11px] sm:text-xs text-white mt-0.5">
              לוֹחֲמִים
            </span>
            <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full border border-white shadow">
              {progress.unlockedCharacters.length}
            </span>
          </button>

          {/* 3. BRAWL PASS / QUESTS (מְשִׂימוֹת) */}
          <button
            id="btn-sidebar-pass"
            type="button"
            onClick={onOpenBrawlerScreen}
            className="relative flex flex-col items-center justify-center w-16 sm:w-20 h-14 sm:h-16 rounded-2xl bg-gradient-to-b from-[#7e22ce] to-[#581c87] border-2 border-[#d8b4fe] shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <span className="text-lg sm:text-xl">🎟️</span>
            <span className="game-font-clean font-black text-[10px] sm:text-[11px] text-purple-100">
              פַּאס
            </span>
            <span className="text-[8px] text-purple-200 font-bold">
              {progress.trophies * 10}/500
            </span>
          </button>
        </aside>

        {/* CENTER STAGE: THE BRAWLER STANDING ON THE DECK */}
        <main className="flex-1 flex flex-col items-center justify-center relative z-10 my-auto py-2">
          {/* FLOATING EMOTE SPEECH BUBBLE */}
          {emoteBubble && (
            <div className="absolute top-2 z-30 bg-white/95 text-slate-950 px-4 py-2 rounded-2xl shadow-2xl border-2 border-yellow-400 game-font text-2xl animate-bounce">
              {emoteBubble}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-white" />
            </div>
          )}

          {/* BADGES ROW ABOVE BRAWLER: TIER, TROPHIES, LEVEL, ACTIVE POWER-UP */}
          <div className="flex items-center gap-2 mb-2 z-20 flex-wrap justify-center">
            {/* Tier badge (Matches "TIER 27" in screenshot) */}
            <div className="bg-[#10b981] border-2 border-[#a7f3d0] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md">
              <span className="game-font font-black text-xs text-white uppercase tracking-wider">
                דַּרְגָּה {Math.floor(progress.trophies / 10) + 1}
              </span>
            </div>

            {/* Trophies pill */}
            <div className="bg-[#ea580c] border-2 border-[#fed7aa] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md">
              <span className="text-xs">🏆</span>
              <span className="game-font font-black text-xs text-white">
                {progress.trophies}
              </span>
            </div>

            {/* Power Level badge */}
            <div className="bg-[#8b5cf6] border-2 border-[#ddd6fe] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
              <Zap className="w-3 h-3 text-yellow-300 fill-current" />
              <span className="game-font font-black text-xs text-white">
                רָמָה 10
              </span>
            </div>

            {/* Active Power-Up link badge (Clicking opens upgrades!) */}
            <button
              type="button"
              onClick={onOpenBrawlerScreen}
              className="bg-black/60 hover:bg-black/80 border border-yellow-400/60 px-2.5 py-0.5 rounded-full flex items-center gap-1 text-[11px] text-yellow-300 font-bold shadow transition-all cursor-pointer active:scale-95"
              title="לַחַץ לְשִׁדְרוּגֵי כֹּחַ וְגַאדְגֶ'טִים"
            >
              <span>{equippedPowerUp?.icon || '⚡'}</span>
              <span className="truncate max-w-[130px]">
                {equippedPowerUp ? equippedPowerUp.name : 'בְּחַר שִׁדְרוּג'}
              </span>
              <ChevronLeft className="w-3 h-3 text-yellow-400" />
            </button>
          </div>

          {/* BRAWLER NAME & LORE */}
          <div className="flex flex-col items-center mb-2 z-20">
            <h2
              onClick={onOpenBrawlerScreen}
              className="game-font font-black text-3xl sm:text-5xl text-yellow-400 tracking-wide drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] hover:scale-105 transition-transform cursor-pointer"
              title="לחץ לפתיחת דף הדמות והשדרוגים"
            >
              {selectedCharDef.name}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold mt-0.5">
              <span>{selectedCharDef.classTitle}</span>
              <span>•</span>
              <span className="text-yellow-300">{activeSkin.name}</span>
            </div>
          </div>

          {/* THE 3D LIVING BRAWLER FIGURE (Clicking brawler also opens the character page!) */}
          <div className="relative z-10 flex items-center justify-center">
            {/* Left side brawler action: Quick Skins Switcher */}
            <button
              id="btn-brawler-hanger-skin"
              type="button"
              onClick={handleCycleSkin}
              className="absolute -right-12 sm:-right-16 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-black/60 hover:bg-black/90 border-2 border-white/30 hover:border-yellow-400 shadow-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer active:scale-95 group z-20"
              title="החלף סקין במהירות"
            >
              <Shirt className="w-5 h-5 text-yellow-300 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] game-font-clean font-bold text-slate-300">סְקִין</span>
            </button>

            {/* Right side brawler action: Emote Pin Button */}
            <button
              id="btn-brawler-emote-pin"
              type="button"
              onClick={handleTriggerEmote}
              className="absolute -left-12 sm:-left-16 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-black/60 hover:bg-black/90 border-2 border-white/30 hover:border-yellow-400 shadow-xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer active:scale-95 group z-20"
              title="שלח אימוג'י / הבעה"
            >
              <MessageSquare className="w-5 h-5 text-yellow-300 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] game-font-clean font-bold text-slate-300">הַבָּעָה</span>
            </button>

            {/* Clickable Living Figure */}
            <div
              onClick={onOpenBrawlerScreen}
              className="cursor-pointer hover:scale-105 transition-transform"
              title="לחץ לצפייה בפרטי הדמות והשדרוגים"
            >
              <HumanoidFigurePreview
                character={selectedCharDef}
                skin={activeSkin}
                size={230}
              />
            </div>
          </div>
        </main>

        {/* RIGHT SIDE TOOLS (Team Up for 2 Phones & Online Status) */}
        <aside className="flex flex-col items-end gap-3 z-20">
          {/* ONLINE STATUS & 2-PHONE TEAM UP (Exact Brawl Stars layout) */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="bg-emerald-950/70 border border-emerald-500/40 px-3 py-1 rounded-full flex items-center gap-1.5 shadow">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="game-font-clean font-bold text-[11px] text-emerald-300">
                מְחֻבָּר (ONLINE)
              </span>
            </div>

            <button
              id="btn-lobby-team-up"
              type="button"
              onClick={onOpenTeamModal}
              className="w-16 sm:w-20 h-16 sm:h-20 rounded-2xl bg-gradient-to-b from-[#0284c7] to-[#0369a1] border-3 border-[#7dd3fc] shadow-xl flex flex-col items-center justify-center gap-1 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
              title="חבר שני טלפונים בחינם לקרב חדר"
            >
              <Users className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
              <span className="game-font-clean font-black text-[10px] text-white">
                צֶוֶת 2 טֶלֶפוֹנִים
              </span>
            </button>
          </div>
        </aside>
      </div>

      {/* BOTTOM BAR: BRAWL PASS PROGRESS + GAME MODE CARD + HUGE YELLOW PLAY NOW BUTTON */}
      <footer className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 z-20 pt-1 pb-1">
        {/* Bottom-Left: Brawl Pass Ticket Progress */}
        <div
          onClick={onOpenBrawlerScreen}
          className="hidden md:flex items-center gap-3 bg-black/60 border border-purple-500/30 px-3 py-2 rounded-2xl shadow-lg cursor-pointer hover:border-purple-400/60 transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-900/60 border border-purple-400 flex items-center justify-center text-lg">
            🎟️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="game-font-clean font-bold text-xs text-white">
                בְּרָאוּל פַּאס (BRAWL PASS)
              </span>
              <span className="text-[10px] bg-purple-500/30 text-purple-200 px-1.5 py-0.2 rounded-full font-bold">
                עוֹנָה 1
              </span>
            </div>
            <div className="w-36 h-2 bg-black/80 rounded-full border border-white/20 mt-1 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                style={{ width: `${Math.min(100, progress.trophies * 4)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Bottom-Center: Game Mode Card (Brawl Stars Event Card) */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
          <div
            onClick={() => {
              setSelectedGameMode((prev) => (prev === 'solo' ? 'room' : 'solo'));
              sound.playClick();
            }}
            className="flex items-center gap-3 bg-gradient-to-r from-[#1e1b4b] to-[#0f172a] border-2 border-indigo-500/40 hover:border-indigo-400/70 p-2.5 sm:p-3 rounded-2xl shadow-xl cursor-pointer transition-all active:scale-95"
            title="לחץ להחלפת מצב משחק"
          >
            {/* Streak flame badge */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-lg shadow-md border border-amber-300">
              <Flame className="w-5 h-5 text-yellow-200 fill-current" />
            </div>

            <div className="text-right">
              <div className="flex items-center gap-1.5">
                <span className="game-font-clean font-black text-xs sm:text-sm text-yellow-400">
                  {selectedGameMode === 'solo' ? 'קְרָב 1 עַל 1 (SOLO BRAWL)' : 'קְרָב חֶדֶר 2 טֶלֶפוֹנִים (ROOM)'}
                </span>
                <span className="text-[10px] bg-blue-500/30 text-blue-300 px-1.5 py-0.2 rounded-full font-bold">
                  {selectedGameMode === 'solo' ? 'נֶגֶד בּוֹט חָכָם' : 'אָנְלַיְן'}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 font-medium">
                זִירַת הַכּוֹכָבִים • שִׂיחִים, חוֹמוֹת וּמַכַּת סוּפֶּר
              </div>
            </div>

            <div className="mr-2 text-slate-400 hover:text-white">
              <Info className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Bottom-Right: THE HUGE ICONIC YELLOW "PLAY NOW" (שַׂחֵק) BUTTON */}
        <div className="w-full sm:w-auto flex justify-center">
          <button
            id="btn-brawl-play-now"
            type="button"
            onClick={() => {
              if (selectedGameMode === 'room') {
                onOpenTeamModal();
              } else {
                onStartBattle();
              }
            }}
            className="w-full sm:w-64 py-4 sm:py-4.5 px-8 rounded-2xl btn-brawl text-yellow-950 game-font-clean font-black text-2xl sm:text-3xl shadow-[0_10px_25px_rgba(245,158,11,0.5)] flex items-center justify-center gap-3 cursor-pointer active:scale-95 transition-all tracking-wider"
          >
            <Play className="w-7 h-7 fill-current text-yellow-950" />
            <span>שַׂחֵק כָּעֵת</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

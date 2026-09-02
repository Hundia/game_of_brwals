import React, { useState, useEffect } from 'react';
import { CharacterId, UserProgress, RoomPlayerInfo } from './types';
import { INITIAL_PROGRESS_KEY, DEFAULT_INITIAL_PROGRESS } from './utils/gameData';
import { sound } from './utils/sound';
import { Lobby } from './components/Lobby';
import { BattleScreen } from './components/BattleScreen';
import { BrawlerScreen } from './components/BrawlerScreen';
import { ChestModal } from './components/ChestModal';
import { TeamRoomModal } from './components/TeamRoomModal';

export default function App() {
  const [progress, setProgress] = useState<UserProgress>(() => {
    try {
      const saved = localStorage.getItem(INITIAL_PROGRESS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure structure validity & merge with default initial progress
        return {
          ...DEFAULT_INITIAL_PROGRESS,
          ...parsed,
          unlockedCharacters: Array.from(
            new Set([...DEFAULT_INITIAL_PROGRESS.unlockedCharacters, ...(parsed.unlockedCharacters || [])])
          ),
          unlockedSkins: {
            ...DEFAULT_INITIAL_PROGRESS.unlockedSkins,
            ...(parsed.unlockedSkins || {}),
          },
          equippedPowerUps: {
            ...DEFAULT_INITIAL_PROGRESS.equippedPowerUps,
            ...(parsed.equippedPowerUps || {}),
          },
        };
      }
    } catch {
      // fallback
    }
    return DEFAULT_INITIAL_PROGRESS;
  });

  const [currentView, setCurrentView] = useState<'lobby' | 'battle' | 'brawlers'>('lobby');
  const [isChestModalOpen, setIsChestModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [multiplayerRoom, setMultiplayerRoom] = useState<{
    code: string;
    isHost: boolean;
    opponent?: RoomPlayerInfo;
  } | null>(null);

  // Sync progress to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(INITIAL_PROGRESS_KEY, JSON.stringify(progress));
    } catch {
      // Storage safety
    }
  }, [progress]);

  // Sync sound system
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.enabled = next;
  };

  const handleSelectCharacter = (charId: CharacterId, skinIdx: number) => {
    setProgress((prev) => ({
      ...prev,
      selectedChar: charId,
      selectedSkinIdx: skinIdx,
    }));
  };

  const handleEquipPowerUp = (charId: CharacterId, powerUpId: string) => {
    sound.playPowerUp();
    setProgress((prev) => ({
      ...prev,
      equippedPowerUps: {
        ...(prev.equippedPowerUps || {}),
        [charId]: powerUpId,
      },
    }));
  };

  const handleUnlockAll = () => {
    sound.playTrophy();
    setProgress((prev) => ({
      ...prev,
      coins: prev.coins + 500,
      unlockedCharacters: ['spark', 'storm', 'titan', 'phoenix', 'golem', 'shadow'],
      unlockedSkins: {
        spark: [0, 1, 2],
        storm: [0, 1, 2],
        titan: [0, 1, 2],
        phoenix: [0, 1, 2],
        golem: [0, 1, 2],
        shadow: [0, 1, 2],
      },
    }));
  };

  const handleStartBattle = () => {
    setMultiplayerRoom(null); // Solo practice against AI Bot
    sound.playCoin();
    setCurrentView('battle');
  };

  const handleStartRoomBattle = (roomCode: string, isHost: boolean, opponent?: RoomPlayerInfo) => {
    setMultiplayerRoom({ code: roomCode, isHost, opponent });
    setIsTeamModalOpen(false);
    sound.playCoin();
    setCurrentView('battle');
  };

  const handleExitToLobby = () => {
    setMultiplayerRoom(null);
    setCurrentView('lobby');
  };

  const handleVictory = () => {
    setProgress((prev) => ({
      ...prev,
      coins: prev.coins + 10, // Exact requirement: +10 coins per win
      trophies: prev.trophies + 8,
      totalWins: prev.totalWins + 1,
    }));
  };

  const handleDefeat = () => {
    setProgress((prev) => ({
      ...prev,
      totalLosses: prev.totalLosses + 1,
    }));
  };

  return (
    <div className="min-h-screen w-full bg-[#050510] font-sans text-white antialiased select-none">
      {currentView === 'lobby' && (
        <Lobby
          progress={progress}
          onSelectCharacter={handleSelectCharacter}
          onEquipPowerUp={handleEquipPowerUp}
          onUnlockAll={handleUnlockAll}
          onStartBattle={handleStartBattle}
          onOpenChestModal={() => setIsChestModalOpen(true)}
          onOpenBrawlerScreen={() => setCurrentView('brawlers')}
          onOpenTeamModal={() => setIsTeamModalOpen(true)}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
        />
      )}

      {currentView === 'brawlers' && (
        <BrawlerScreen
          progress={progress}
          onSelectCharacter={handleSelectCharacter}
          onEquipPowerUp={handleEquipPowerUp}
          onClose={() => setCurrentView('lobby')}
          onOpenChestModal={() => setIsChestModalOpen(true)}
          onUnlockAll={handleUnlockAll}
        />
      )}

      {currentView === 'battle' && (
        <BattleScreen
          progress={progress}
          onExitToLobby={handleExitToLobby}
          onVictory={handleVictory}
          onDefeat={handleDefeat}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          multiplayerRoom={multiplayerRoom}
        />
      )}

      {/* Chest Opening Modal */}
      {isChestModalOpen && (
        <ChestModal
          progress={progress}
          onClose={() => setIsChestModalOpen(false)}
          onUpdateProgress={setProgress}
        />
      )}

      {/* 2-Phone Team / Room Code Modal */}
      {isTeamModalOpen && (
        <TeamRoomModal
          isOpen={isTeamModalOpen}
          charId={progress.selectedChar}
          skinIdx={progress.selectedSkinIdx}
          onClose={() => setIsTeamModalOpen(false)}
          onStartRoomBattle={handleStartRoomBattle}
        />
      )}
    </div>
  );
}

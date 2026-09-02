import React, { useState, useEffect } from 'react';
import { Users, Copy, Check, Smartphone, Wifi, Play, Sparkles, X, ShieldAlert, Edit2, Loader2 } from 'lucide-react';
import { CharacterId, RoomPlayerInfo, MultiplayerRoomState } from '../types';
import { CHARACTERS } from '../utils/gameData';
import { multiplayer } from '../utils/multiplayerService';
import { sound } from '../utils/sound';

interface TeamRoomModalProps {
  isOpen: boolean;
  charId: CharacterId;
  skinIdx: number;
  onClose: () => void;
  onStartRoomBattle: (roomCode: string, isHost: boolean, opponent?: RoomPlayerInfo) => void;
}

export const TeamRoomModal: React.FC<TeamRoomModalProps> = ({
  isOpen,
  charId,
  skinIdx,
  onClose,
  onStartRoomBattle,
}) => {
  const [roomCode, setRoomCode] = useState('XWS4');
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [roomState, setRoomState] = useState<MultiplayerRoomState | null>(null);
  const [isConnected, setIsConnected] = useState(multiplayer.isConnected());
  const [playerName, setPlayerName] = useState(multiplayer.getPlayerName());
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(playerName);

  const myPlayerId = multiplayer.getPlayerId();

  // Connect & Join room on mount or tab / code change
  useEffect(() => {
    if (!isOpen) return;

    multiplayer.connect().then((ok) => {
      setIsConnected(ok);
    });

    const unsubConn = multiplayer.onConnectionChange((connected) => {
      setIsConnected(connected);
    });

    const unsubRoom = multiplayer.onRoomUpdate((state) => {
      setRoomState(state);
      // Play sound when 2nd player joins
      if (state.players.length === 2) {
        sound.playPowerUp();
      }
    });

    const unsubBattle = multiplayer.onBattleStart((state) => {
      sound.playSuperReady();
      const me = state.players.find((p) => p.id === myPlayerId);
      const opp = state.players.find((p) => p.id !== myPlayerId);
      const isHost = me ? me.isHost : activeTab === 'create';
      onStartRoomBattle(state.code, isHost, opp);
    });

    // Automatically register current room for host
    if (activeTab === 'create') {
      multiplayer.joinRoom(roomCode, charId, skinIdx);
    }

    return () => {
      unsubConn();
      unsubRoom();
      unsubBattle();
    };
  }, [isOpen, roomCode, activeTab, charId, skinIdx, myPlayerId, onStartRoomBattle]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard?.writeText(roomCode);
    setCopied(true);
    sound.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateNewCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let newCode = '';
    for (let i = 0; i < 4; i++) {
      newCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setRoomCode(newCode);
    sound.playClick();
    multiplayer.joinRoom(newCode, charId, skinIdx);
  };

  const handleJoinSubmitted = async () => {
    const code = inputCode.trim().toUpperCase();
    if (!code) return;
    sound.playClick();
    await multiplayer.joinRoom(code, charId, skinIdx);
  };

  const handleStartBattleClick = () => {
    sound.playClick();
    const activeCode = activeTab === 'create' ? roomCode : inputCode.trim().toUpperCase();
    multiplayer.startBattle(activeCode);
  };

  const handleSaveName = () => {
    if (nameInput.trim()) {
      multiplayer.setPlayerName(nameInput.trim());
      setPlayerName(nameInput.trim());
      setIsEditingName(false);
      // re-send join with updated name
      const code = activeTab === 'create' ? roomCode : inputCode.trim().toUpperCase();
      if (code) {
        multiplayer.joinRoom(code, charId, skinIdx);
      }
    }
  };

  const myPlayer = roomState?.players.find((p) => p.id === myPlayerId);
  const opponentPlayer = roomState?.players.find((p) => p.id !== myPlayerId);
  const isRoomFull = (roomState?.players.length || 0) >= 2;

  const myBrawler = CHARACTERS[charId] || CHARACTERS.spark;
  const mySkin = myBrawler.skins[skinIdx] || myBrawler.skins[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none overflow-y-auto" dir="rtl">
      <div className="relative w-full max-w-lg bg-[#0a0f24] border-2 border-yellow-400/40 rounded-3xl p-4 sm:p-6 shadow-2xl text-white my-auto">
        {/* Close button */}
        <button
          onClick={() => {
            multiplayer.leaveRoom();
            onClose();
          }}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-2xl shadow-lg border border-white/30">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="game-font-clean font-black text-xl text-yellow-400">
                קְרָב מְרֻשָּׁת לִשְׁנֵי טֶלֶפוֹנִים
              </h2>
              {/* WebSocket Status Indicator */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isConnected
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                {isConnected ? 'שרת חי (WS)' : 'מתחבר...'}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              שַׂחְקוּ זֶה מוּל זֶה בִּזְמַן אֱמֶת מִשְּׁנֵי מַכְשִׁירִים בְּחִנָּם!
            </p>
          </div>
        </div>

        {/* Player Name Profile Bar */}
        <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-2xl px-3 py-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-base">{myBrawler.avatar}</span>
            {isEditingName ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  maxLength={15}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="bg-black/80 border border-yellow-400 rounded-lg px-2 py-0.5 text-xs text-yellow-300 outline-none w-32"
                />
                <button
                  onClick={handleSaveName}
                  className="px-2 py-0.5 rounded-lg bg-yellow-400 text-slate-950 text-xs font-bold"
                >
                  שמור
                </button>
              </div>
            ) : (
              <div>
                <span className="text-xs text-slate-400 block font-medium">שֵׁם הַשַּׂחְקָן שֶׁלְּךָ:</span>
                <span className="text-sm font-bold text-yellow-300">{playerName}</span>
              </div>
            )}
          </div>
          {!isEditingName && (
            <button
              onClick={() => setIsEditingName(true)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-xs flex items-center gap-1 transition-all"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>שנה</span>
            </button>
          )}
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-2xl border border-white/10 mb-4">
          <button
            onClick={() => {
              setActiveTab('create');
              sound.playClick();
              multiplayer.joinRoom(roomCode, charId, skinIdx);
            }}
            className={`py-2 rounded-xl text-xs game-font-clean font-bold transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-yellow-400 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            יְצִירַת חֶדֶר (טֶלֶפוֹן 1)
          </button>
          <button
            onClick={() => {
              setActiveTab('join');
              sound.playClick();
            }}
            className={`py-2 rounded-xl text-xs game-font-clean font-bold transition-all cursor-pointer ${
              activeTab === 'join'
                ? 'bg-yellow-400 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            הִצְטָרְפוּת לְחֶדֶר (טֶלֶפוֹן 2)
          </button>
        </div>

        {activeTab === 'create' ? (
          <div className="space-y-4">
            <div className="bg-black/50 border border-white/10 rounded-2xl p-4 text-center">
              <div className="text-xs text-slate-400 font-medium mb-1">
                קוֹד הַצֶּוֶת / הַחֶדֶר שֶׁלְּךָ:
              </div>
              <div className="game-font font-black text-4xl tracking-widest text-yellow-300 my-2">
                {roomCode}
              </div>
              <div className="flex items-center justify-center gap-2 mt-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold transition-all cursor-pointer active:scale-95"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'הָעֳתַק!' : 'הַעְתֵּק קוֹד'}</span>
                </button>
                <button
                  onClick={handleGenerateNewCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold transition-all cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  <span>ק֥וֹד חָדָשׁ</span>
                </button>
              </div>
            </div>

            {/* Live 2-Player Roster Preview */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>לוֹחֲמִים בַּחֶדֶר:</span>
                <span className={isRoomFull ? 'text-emerald-400 font-black' : 'text-amber-400'}>
                  {roomState?.players.length || 1} / 2 שַׂחְקָנִים
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Player 1 Card (Host - You) */}
                <div className="bg-blue-950/60 border-2 border-blue-500/50 rounded-2xl p-2.5 flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/40 border border-blue-400 flex items-center justify-center text-xl">
                    {myBrawler.avatar}
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-[10px] text-blue-300 font-bold block">שַׂחְקָן 1 (מְאָרֵחַ)</span>
                    <span className="text-xs font-black text-white truncate block">{playerName}</span>
                    <span className="text-[10px] text-yellow-300 block truncate">{myBrawler.name}</span>
                  </div>
                </div>

                {/* Player 2 Card */}
                {opponentPlayer ? (
                  <div className="bg-rose-950/60 border-2 border-rose-500/60 rounded-2xl p-2.5 flex items-center gap-2.5 animate-fadeIn">
                    <div className="w-10 h-10 rounded-xl bg-rose-600/40 border border-rose-400 flex items-center justify-center text-xl">
                      {CHARACTERS[opponentPlayer.charId]?.avatar || '🤖'}
                    </div>
                    <div className="overflow-hidden">
                      <span className="text-[10px] text-rose-300 font-bold block">שַׂחְקָן 2 (אוֹרֵחַ)</span>
                      <span className="text-xs font-black text-white truncate block">{opponentPlayer.name}</span>
                      <span className="text-[10px] text-yellow-300 block truncate">
                        {CHARACTERS[opponentPlayer.charId]?.name || 'לוחם'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-white/20 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center bg-black/20">
                    <Loader2 className="w-4 h-4 text-yellow-400 animate-spin mb-1" />
                    <span className="text-[10px] text-slate-400 font-bold">מַמְתִּין לְטֶלֶפוֹן 2...</span>
                    <span className="text-[9px] text-slate-500">הַקְלֵד קוֹד {roomCode}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleStartBattleClick}
              className={`w-full py-3.5 rounded-2xl game-font-clean font-black text-base shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isRoomFull
                  ? 'btn-brawl text-yellow-950 animate-bounce active:scale-95'
                  : 'btn-brawl text-yellow-950 active:scale-95'
              }`}
            >
              <Play className="w-5 h-5 fill-current" />
              <span>
                {isRoomFull
                  ? 'הַתְחֵל קְרָב עִם שְׁנֵיכֶם! (START 1V1) ⚔️'
                  : `הַפְעֵל קְרָב בְּחֶדֶר ${roomCode}`}
              </span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-300 font-bold mb-2">
                הַקְלֵד קוֹד חֶדֶר מֵהַטֶּלֶפוֹן הָרִאשׁוֹן:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="לְמָשָׁל: XWS4"
                  className="flex-1 bg-black/60 border-2 border-white/20 focus:border-yellow-400 rounded-2xl px-4 py-3 text-center game-font text-2xl tracking-widest text-yellow-300 outline-none uppercase"
                />
                <button
                  type="button"
                  disabled={!inputCode.trim()}
                  onClick={handleJoinSubmitted}
                  className="px-5 rounded-2xl bg-blue-600 hover:bg-blue-500 font-bold text-xs cursor-pointer disabled:opacity-50"
                >
                  הִתְחַבֵּר
                </button>
              </div>
            </div>

            {/* Room Roster Preview if joined */}
            {roomState && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>מַצַּב הַחֶדֶר {roomState.code}:</span>
                  <span className={isRoomFull ? 'text-emerald-400 font-black' : 'text-amber-400'}>
                    {roomState.players.length} / 2 שַׂחְקָנִים
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {roomState.players.map((p) => (
                    <div
                      key={p.id}
                      className={`border-2 rounded-2xl p-2.5 flex items-center gap-2.5 ${
                        p.id === myPlayerId
                          ? 'bg-blue-950/60 border-blue-500/50'
                          : 'bg-rose-950/60 border-rose-500/60'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/20 flex items-center justify-center text-xl">
                        {CHARACTERS[p.charId]?.avatar || '🤖'}
                      </div>
                      <div className="overflow-hidden">
                        <span className="text-[10px] text-slate-300 font-bold block">
                          {p.isHost ? 'מְאָרֵחַ' : 'אוֹרֵחַ'} {p.id === myPlayerId && '(אַתָּה)'}
                        </span>
                        <span className="text-xs font-black text-white truncate block">{p.name}</span>
                        <span className="text-[10px] text-yellow-300 block truncate">
                          {CHARACTERS[p.charId]?.name || 'לוחם'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              disabled={!inputCode.trim()}
              onClick={handleStartBattleClick}
              className={`w-full py-3.5 rounded-2xl game-font-clean font-black text-base shadow-xl flex items-center justify-center gap-2 ${
                inputCode.trim()
                  ? 'btn-brawl text-yellow-950 cursor-pointer active:scale-95'
                  : 'bg-white/10 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Wifi className="w-5 h-5" />
              <span>
                {isRoomFull
                  ? 'הַתְחֵל קְרָב עַכְשָׁו! ⚔️'
                  : `הִצְטָרֵף לַקְּרָב בַּחֶדֶר ${inputCode.toUpperCase() || '...'}`}
              </span>
            </button>
          </div>
        )}

        {/* Free-tier & Online info notice */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-start gap-2 text-[11px] text-slate-400">
          <ShieldAlert className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <span>
            שָׁרֵת WebSockets מְהִיר מֻפְעָל מְקַשֵּׁר בֵּין שְׁנֵי הַטֶּלֶפוֹנִים בְּחִנָּם בְּמַצַּב Free-Tier. תְּנוּעָה וִירִי מְסֻנְכְּרָנִים בִּזְמַן אֱמֶת!
          </span>
        </div>
      </div>
    </div>
  );
};

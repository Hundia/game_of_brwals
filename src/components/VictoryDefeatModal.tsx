import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, Home, Shield } from 'lucide-react';
import { CharacterDef } from '../types';

interface VictoryDefeatModalProps {
  isVictory: boolean;
  character: CharacterDef;
  onPlayAgain: () => void;
  onGoToLobby: () => void;
}

export const VictoryDefeatModal: React.FC<VictoryDefeatModalProps> = ({
  isVictory,
  character,
  onPlayAgain,
  onGoToLobby,
}) => {
  useEffect(() => {
    if (isVictory) {
      try {
        confetti({
          particleCount: 85,
          spread: 65,
          origin: { y: 0.5 },
        });
      } catch {
        // ignore
      }
    }
  }, [isVictory]);

  return (
    <div
      id="modal-match-result"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in"
      dir="rtl"
    >
      <div
        className={`relative w-full max-w-md bg-[#0a0a1e] border-4 ${
          isVictory ? 'border-yellow-400 card-glow-amber' : 'border-rose-500/70 card-glow'
        } rounded-3xl p-6 sm:p-7 text-center shadow-2xl text-white`}
      >
        {isVictory ? (
          <>
            <div className="inline-block p-4 rounded-3xl bg-yellow-400/20 border-4 border-yellow-300 mb-3 shadow-2xl">
              <Trophy className="w-16 h-16 text-yellow-400 animate-bounce" />
            </div>
            <h2 className="game-font-clean font-black text-3xl sm:text-4xl text-yellow-400 tracking-wider">
              נִצָּחוֹן אַדִּיר! 🏆
            </h2>
            <p className="text-sm text-slate-300 mt-2 font-medium leading-relaxed">
              הֲבַסְתָּ אֶת בּוֹט הַמַּחְשֵׁב וְהוֹכַחְתָּ שְׁלִיטָה מֻחְלֶטֶת בַּזִּירָה עִם {character.name}!
            </p>

            {/* Reward banner */}
            <div className="my-5 p-4 rounded-2xl bg-black/60 border-2 border-yellow-400/40 flex items-center justify-around card-glow">
              <div className="flex items-center gap-2">
                <span className="text-3xl">💰</span>
                <div className="text-right">
                  <div className="text-[11px] font-bold text-amber-200">פְּרַס קְרָב</div>
                  <div className="game-font-clean font-black text-2xl text-amber-400">+10 מַטְבְּעוֹת</div>
                </div>
              </div>
              <div className="w-[1px] h-10 bg-white/20" />
              <div className="flex items-center gap-2">
                <span className="text-3xl">⭐</span>
                <div className="text-right">
                  <div className="text-[11px] font-bold text-yellow-200">גְּבִיעֵי נִצָּחוֹן</div>
                  <div className="game-font-clean font-black text-2xl text-yellow-400">+8 גְּבִיעִים</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="inline-block p-4 rounded-3xl bg-rose-500/20 border-4 border-rose-400 mb-3 shadow-2xl">
              <Shield className="w-16 h-16 text-rose-400" />
            </div>
            <h2 className="game-font-clean font-black text-3xl sm:text-4xl text-rose-400 tracking-wider">
              הֶפְסֵד בַּקְּרָב... ⚔️
            </h2>
            <p className="text-sm text-slate-300 mt-2 font-medium leading-relaxed">
              אַל תְּוַתֵּר! הִתְחַמֵּק מִיְּרִי הַבּוֹט, תְּפֹס מַחֲסֶה וְהַפְעֵל אֶת מַתְקַפַת הַסּוּפֶּר שֶׁלְּךָ בָּרֶגַע הַמַּתְאִים!
            </p>
          </>
        )}

        {/* Buttons */}
        <div className="flex gap-3 w-full mt-6">
          <button
            id="btn-play-again"
            onClick={onPlayAgain}
            className="btn-arcade-green flex-1 py-4 text-white game-font-clean font-bold text-base sm:text-lg rounded-2xl shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-transform"
          >
            <RefreshCw className="w-5 h-5" />
            <span>שַׂחֵק שׁוּב (REPLAY)</span>
          </button>
          <button
            id="btn-go-to-lobby"
            onClick={onGoToLobby}
            className="btn-arcade-blue flex-1 py-4 text-white game-font-clean font-bold text-base sm:text-lg rounded-2xl shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-transform"
          >
            <Home className="w-5 h-5" />
            <span>תַּפְרִיט (LOBBY)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, RotateCcw, Home, Send, Trophy } from 'lucide-react';
import { submitScore } from '../lib/firebase';
import { soundManager } from '../utils/audio';

interface GameSummaryModalProps {
  isOpen: boolean;
  score: number;
  hits: number;
  maxCombo: number;
  characterName: string;
  onRestart: () => void;
  onReturnHome: () => void;
  onNotifyRankingUpdated: () => void;
}

export const GameSummaryModal: React.FC<GameSummaryModalProps> = ({
  isOpen,
  score,
  hits,
  maxCombo,
  characterName,
  onRestart,
  onReturnHome,
  onNotifyRankingUpdated
}) => {
  const [playerName, setPlayerName] = useState(() => {
    try {
      return localStorage.getItem('bakuda_last_player_name') || '';
    } catch {
      return '';
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      soundManager.playKOGong();
      setIsSubmitted(false);

      try {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ff003c', '#ffffff', '#71717a']
        });
      } catch {
        // ignore
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmitScore = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting || isSubmitted) return;

    const trimmed = playerName.trim() || 'PUNCHER';
    setIsSubmitting(true);
    try {
      localStorage.setItem('bakuda_last_player_name', trimmed);
    } catch {
      // ignore
    }

    await submitScore({
      name: trimmed,
      score,
      comboMax: maxCombo,
      hits,
      punchTitle: score > 300 ? 'SSS PUNCHER' : score > 150 ? 'S PUNCHER' : 'A PUNCHER',
      characterName
    });

    setIsSubmitting(false);
    setIsSubmitted(true);
    soundManager.playRankSuccess();
    onNotifyRankingUpdated();

    // ② ランキングを登録したらランキングに登録されたことを知らせてホーム画面に戻る
    setTimeout(() => {
      onReturnHome();
    }, 900);
  };

  const tapsPerSecond = (hits / 30).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#101014] border-2 border-[#27272a] text-white p-6 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] relative text-center">
        {/* Header Title (IMPACT REPORT as in video) */}
        <div className="text-[11px] font-arcade-mono tracking-[0.25em] text-[#71717a] uppercase mb-1 font-bold">
          TOTAL SCORE
        </div>
        <h2 className="text-2xl font-arcade-title font-black text-white tracking-wider mb-2">
          IMPACT REPORT
        </h2>

        {/* Big Score Callout */}
        <div className="my-3 py-3 border-y border-[#27272a]">
          <div className="font-arcade-impact text-6xl md:text-7xl font-black text-[#ff003c] tabular-nums tracking-wide text-arcade-shadow">
            {score.toLocaleString()}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 py-2 mb-4 text-center">
          <div>
            <div className="text-[10px] text-[#71717a] font-arcade-mono font-bold uppercase">HITS</div>
            <div className="text-xl font-arcade-impact font-bold text-white tabular-nums">
              {hits}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-[#71717a] font-arcade-mono font-bold uppercase">MAX COMBO</div>
            <div className="text-xl font-arcade-impact font-bold text-white tabular-nums">
              {maxCombo}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-[#71717a] font-arcade-mono font-bold uppercase">SPEED</div>
            <div className="text-xl font-arcade-impact font-bold text-white tabular-nums">
              {tapsPerSecond}<span className="text-[10px] text-[#71717a]">/s</span>
            </div>
          </div>
        </div>

        {/* Registration Section */}
        {isSubmitted ? (
          <div className="mb-4 py-3 bg-[#18181f] border border-[#ff003c]/40 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#ff003c]" />
            <span>ランキングに登録完了！ホームに戻ります...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmitScore} className="mb-4">
            <div className="mb-2">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={14}
                placeholder="ニックネーム"
                className="w-full bg-[#18181f] border border-[#27272a] focus:border-[#ff003c] rounded-xl px-3 py-2.5 text-sm text-center text-white placeholder-[#52525b] font-bold focus:outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-arcade-red w-full py-3 rounded-xl text-sm font-arcade-title font-black flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? '登録中...' : 'ランキングに登録'}
            </button>
          </form>
        )}

        {/* Action Buttons (Match video: もう一度 & ホームへ戻る) */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onRestart}
            className="btn-arcade-dark w-full py-2.5 rounded-xl text-xs font-arcade-title font-bold text-white flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            もう一度
          </button>

          <button
            onClick={onReturnHome}
            className="w-full py-2 text-xs font-bold text-[#71717a] hover:text-white transition-colors flex items-center justify-center gap-1"
          >
            <Home className="w-3.5 h-3.5" />
            ホームへ戻る
          </button>
        </div>
      </div>
    </div>
  );
};

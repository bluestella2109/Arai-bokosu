import React, { useState } from 'react';
import { Trophy, X, Flame, Clock } from 'lucide-react';
import { LeaderboardEntry } from '../lib/firebase';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: LeaderboardEntry[];
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  entries
}) => {
  const [filter, setFilter] = useState<'all' | 'recent'>('all');

  if (!isOpen) return null;

  const sortedEntries = [...entries].sort((a, b) => {
    if (filter === 'recent') {
      return b.createdAt - a.createdAt;
    }
    return b.score - a.score;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#101014] border-2 border-[#27272a] text-white p-5 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.9)] relative max-h-[88vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 bg-[#18181f] hover:bg-[#27272a] border border-[#3f3f46] rounded-lg text-[#71717a] hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-3">
          <div className="text-[10px] font-arcade-mono font-bold tracking-[0.25em] text-[#71717a] uppercase mb-0.5">
            FIREBASE REALTIME LEADERBOARD
          </div>
          <h2 className="text-xl font-arcade-title font-black text-white tracking-wider flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#ff003c]" />
            全国ランキング
          </h2>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-arcade-title font-bold transition-all flex items-center gap-1.5 ${
              filter === 'all'
                ? 'bg-[#ff003c] text-white shadow-[0_0_10px_rgba(255,0,60,0.4)]'
                : 'bg-[#18181f] text-[#71717a] hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            ハイスコア順
          </button>
          <button
            onClick={() => setFilter('recent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-arcade-title font-bold transition-all flex items-center gap-1.5 ${
              filter === 'recent'
                ? 'bg-[#ff003c] text-white shadow-[0_0_10px_rgba(255,0,60,0.4)]'
                : 'bg-[#18181f] text-[#71717a] hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            最新挑戦記録
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {sortedEntries.length === 0 ? (
            <div className="p-8 text-center text-[#71717a] font-bold bg-[#14141a] rounded-xl border border-[#27272a]">
              記録がまだありません。一番乗りで30秒ラッシュに挑戦しよう！
            </div>
          ) : (
            sortedEntries.map((entry, index) => {
              const rank = index + 1;
              const isTop = rank === 1;

              return (
                <div
                  key={entry.id || index}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                    isTop
                      ? 'bg-[#1c1216] border-[#ff003c]/60 shadow-[0_0_12px_rgba(255,0,60,0.2)]'
                      : 'bg-[#14141a] border-[#27272a] hover:border-[#3f3f46]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 flex items-center justify-center font-arcade-impact text-lg font-black shrink-0">
                      {isTop ? (
                        <span className="text-[#ff003c]">#1</span>
                      ) : (
                        <span className="text-[#71717a]">#{rank}</span>
                      )}
                    </div>

                    <div className="truncate">
                      <div className="font-arcade-title font-bold text-white text-xs md:text-sm truncate">
                        {entry.name}
                      </div>
                      <div className="text-[10px] text-[#71717a] font-arcade-mono">
                        {entry.characterName} · {entry.comboMax} COMBO
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-arcade-mono text-lg font-black text-white tabular-nums">
                      {entry.score.toLocaleString()}
                    </div>
                    <div className="text-[9px] text-[#71717a] font-arcade-mono">
                      {entry.hits} HITS
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-[#27272a] flex items-center justify-between text-xs text-[#71717a]">
          <span className="font-arcade-mono text-[10px]">REALTIME SYNC ACTIVE</span>
          <button
            onClick={onClose}
            className="btn-arcade-dark px-4 py-1.5 rounded-lg text-xs font-arcade-title font-bold"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

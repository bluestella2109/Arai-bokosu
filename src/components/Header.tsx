import React from 'react';
import { Trophy, Camera, HelpCircle, Flame, Shield } from 'lucide-react';
import { GameMode } from '../types/game';

interface HeaderProps {
  mode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  onOpenLeaderboard: () => void;
  onOpenUpload: () => void;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onSelectMode,
  onOpenLeaderboard,
  onOpenUpload,
  onOpenHelp
}) => {
  return (
    <header className="w-full bg-[#0a0a0d] border-b border-[#27272a] px-4 py-2 z-40">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Zone 1: Single text wordmark in display face */}
        <div className="flex items-center gap-2">
          <span className="text-lg md:text-xl font-arcade-title font-black text-white tracking-widest">
            TAP PUNCH
          </span>
          <span className="text-[10px] font-arcade-mono font-bold px-1.5 py-0.5 rounded bg-[#18181f] text-[#ff003c] border border-[#27272a]">
            ARCADE
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-1.5 md:gap-2">
          <button
            onClick={() => onSelectMode('30S_RUSH')}
            className={`px-3 py-1.5 text-xs font-arcade-title font-black rounded-lg border transition-all flex items-center gap-1.5 ${
              mode === '30S_RUSH'
                ? 'bg-[#ff003c] text-white border-[#ff3366] shadow-[0_0_12px_rgba(255,0,60,0.5)]'
                : 'bg-[#121217] text-[#71717a] border-[#27272a] hover:text-white hover:border-[#3f3f46]'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>30秒ラッシュ</span>
          </button>

          <button
            onClick={() => onSelectMode('SANDBOX')}
            className={`px-3 py-1.5 text-xs font-arcade-title font-black rounded-lg border transition-all flex items-center gap-1.5 ${
              mode === 'SANDBOX'
                ? 'bg-[#ff003c] text-white border-[#ff3366] shadow-[0_0_12px_rgba(255,0,60,0.5)]'
                : 'bg-[#121217] text-[#71717a] border-[#27272a] hover:text-white hover:border-[#3f3f46]'
            }`}
          >
            <span>無限サンドバッグ</span>
          </button>

          <button
            onClick={onOpenLeaderboard}
            className="px-2.5 py-1.5 text-xs font-arcade-title font-bold bg-[#121217] text-white border border-[#27272a] hover:border-[#ff003c] rounded-lg transition-colors flex items-center gap-1"
          >
            <Trophy className="w-3.5 h-3.5 text-[#ff003c]" />
            <span className="hidden sm:inline">ランキング</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="px-2.5 py-1.5 text-xs font-arcade-title font-bold bg-[#121217] text-white border border-[#27272a] hover:border-[#ff003c] rounded-lg transition-colors flex items-center gap-1"
          >
            <Camera className="w-3.5 h-3.5 text-[#71717a]" />
            <span className="hidden sm:inline">写真変更</span>
          </button>
        </nav>

        {/* Zone 3: Help Action */}
        <div className="flex items-center">
          <button
            onClick={onOpenHelp}
            className="p-1.5 bg-[#121217] hover:bg-[#1c1c24] border border-[#27272a] rounded-lg text-[#71717a] hover:text-white transition-colors"
            title="遊び方"
            aria-label="Help"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

import React, { useState, useEffect } from 'react';
import { GameMode, WeaponType, CharacterTarget } from './types/game';
import { PRESET_CHARACTERS } from './data/characters';
import { LeaderboardEntry, subscribeLeaderboard } from './lib/firebase';
import { soundManager } from './utils/audio';

import { Header } from './components/Header';
import { RushGame } from './components/RushGame';
import { SandboxGame } from './components/SandboxGame';
import { PhotoUploadModal } from './components/PhotoUploadModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { GameSummaryModal } from './components/GameSummaryModal';
import { HelpModal } from './components/HelpModal';

export default function App() {
  const [mode, setMode] = useState<GameMode>('30S_RUSH');
  const [activeCharacter, setActiveCharacter] = useState<CharacterTarget>(PRESET_CHARACTERS[0]);
  const [customCharacter, setCustomCharacter] = useState<CharacterTarget | null>(null);
  const [weapon, setWeapon] = useState<WeaponType>('fist');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [rankingUpdatedToast, setRankingUpdatedToast] = useState<boolean>(false);

  // Modals
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  // Summary Modal data after 30s rush
  const [summaryData, setSummaryData] = useState<{
    isOpen: boolean;
    score: number;
    hits: number;
    maxCombo: number;
  }>({
    isOpen: false,
    score: 0,
    hits: 0,
    maxCombo: 0
  });

  // Real-time Leaderboard entries from Firebase
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);

  // Key for resetting RushGame to READY state
  const [gameKey, setGameKey] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = subscribeLeaderboard(40, (entries) => {
      setLeaderboardEntries(entries);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundManager.enabled = !nextMuted;
  };

  const handleFinishRushGame = (result: { score: number; hits: number; maxCombo: number }) => {
    setSummaryData({
      isOpen: true,
      score: result.score,
      hits: result.hits,
      maxCombo: result.maxCombo
    });
  };

  const handleReturnHome = () => {
    setSummaryData((prev) => ({ ...prev, isOpen: false }));
    setGameKey((k) => k + 1); // Reset game to READY screen
  };

  const handleNotifyRankingUpdated = () => {
    setRankingUpdatedToast(true);
    setTimeout(() => {
      setRankingUpdatedToast(false);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col font-sans select-none overflow-x-hidden">
      {/* Sleek Minimal Header */}
      <Header
        mode={mode}
        onSelectMode={(newMode) => {
          setMode(newMode);
          setSummaryData((prev) => ({ ...prev, isOpen: false }));
        }}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Main Full-Viewport Arcade Arena */}
      <main className="flex-1 w-full flex flex-col items-center justify-center relative overflow-hidden">
        {mode === '30S_RUSH' ? (
          <RushGame
            key={`rush_${activeCharacter.id}_${gameKey}`}
            character={activeCharacter}
            weapon={weapon}
            onFinishGame={handleFinishRushGame}
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
            rankingUpdatedToast={rankingUpdatedToast}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
          />
        ) : (
          <SandboxGame
            key={`sandbox_${activeCharacter.id}`}
            character={activeCharacter}
            weapon={weapon}
            onOpenUpload={() => setIsUploadOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      <PhotoUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        activeCharacter={activeCharacter}
        onSelectCharacter={(char) => setActiveCharacter(char)}
        customCharacter={customCharacter}
        onSetCustomCharacter={(char) => setCustomCharacter(char)}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        entries={leaderboardEntries}
      />

      {/* Game Summary Report with auto-return on registration */}
      <GameSummaryModal
        isOpen={summaryData.isOpen}
        score={summaryData.score}
        hits={summaryData.hits}
        maxCombo={summaryData.maxCombo}
        characterName={activeCharacter.name}
        onRestart={() => {
          setSummaryData((prev) => ({ ...prev, isOpen: false }));
          setGameKey((k) => k + 1);
        }}
        onReturnHome={handleReturnHome}
        onNotifyRankingUpdated={handleNotifyRankingUpdated}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}

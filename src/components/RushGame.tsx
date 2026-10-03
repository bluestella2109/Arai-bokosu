import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CharacterTarget, HitEffect, WeaponType } from '../types/game';
import { ONOMATOPOEIA_LIST, WEAPONS } from '../data/characters';
import { soundManager } from '../utils/audio';
import { ArcadePunchOverlay } from './ArcadePunchOverlay';
import { Zap, Volume2, VolumeX, Camera, Trophy, Sparkles } from 'lucide-react';

interface RushGameProps {
  character: CharacterTarget;
  weapon: WeaponType;
  onFinishGame: (result: { score: number; hits: number; maxCombo: number }) => void;
  onOpenUpload: () => void;
  onOpenLeaderboard: () => void;
  rankingUpdatedToast: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const RushGame: React.FC<RushGameProps> = ({
  character,
  weapon,
  onFinishGame,
  onOpenUpload,
  onOpenLeaderboard,
  rankingUpdatedToast,
  isMuted,
  onToggleMute
}) => {
  const [gameState, setGameState] = useState<'READY' | 'COUNTDOWN' | 'PLAYING' | 'ENDED'>('READY');
  const [countdownNum, setCountdownNum] = useState<number>(3);
  const [timeRemainingMs, setTimeRemainingMs] = useState<number>(30000); // 30.0s with tenths
  const [score, setScore] = useState<number>(0);
  const [hits, setHits] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [screenShake, setScreenShake] = useState<string>('');
  const [isHitstop, setIsHitstop] = useState<boolean>(false);
  const [showSpeedlines, setShowSpeedlines] = useState<boolean>(false);

  // Super Meter (0 to 100%)
  const [superMeter, setSuperMeter] = useState<number>(0);
  const [superFinisher, setSuperFinisher] = useState<{
    active: boolean;
    title: string;
    x: number;
    y: number;
  } | null>(null);

  // Current Target state
  const [currentTarget, setCurrentTarget] = useState<{
    id: string;
    x: number; // percentage across screen (8% to 92%)
    y: number; // percentage across screen (16% to 86%)
    isDying: boolean;
    blowbackAnim: string;
  }>({
    id: 'target_init',
    x: 50,
    y: 50,
    isDying: false,
    blowbackAnim: ''
  });

  // Effects & Active flying fist
  const [effects, setEffects] = useState<HitEffect[]>([]);
  const [activeFist, setActiveFist] = useState<{
    x: number;
    y: number;
    vector: 'bl' | 'br' | 'tr' | 'up';
    id: string;
    isSuper?: boolean;
    isRapid?: boolean;
  } | null>(null);

  const arenaRef = useRef<HTMLDivElement>(null);
  const lastPunchTimeRef = useRef<number>(0);
  const fistVectorIndexRef = useRef<number>(0);
  const timerFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Intelligent multi-sector random generator across entire viewport (Instruction ③)
  // Covers top, middle, bottom, left, right, and corners evenly on desktop, iPad, & mobile
  const getRandomScreenCoords = useCallback(() => {
    const sectors = [
      { xMin: 12, xMax: 32, yMin: 18, yMax: 38 }, // Top-Left
      { xMin: 42, xMax: 58, yMin: 18, yMax: 38 }, // Top-Center
      { xMin: 68, xMax: 88, yMin: 18, yMax: 38 }, // Top-Right
      { xMin: 12, xMax: 34, yMin: 44, yMax: 62 }, // Mid-Left
      { xMin: 66, xMax: 88, yMin: 44, yMax: 62 }, // Mid-Right
      { xMin: 14, xMax: 36, yMin: 68, yMax: 84 }, // Bottom-Left
      { xMin: 42, xMax: 58, yMin: 68, yMax: 84 }, // Bottom-Center
      { xMin: 64, xMax: 86, yMin: 68, yMax: 84 }  // Bottom-Right
    ];

    const chosenSector = sectors[Math.floor(Math.random() * sectors.length)];
    const x = Math.floor(Math.random() * (chosenSector.xMax - chosenSector.xMin)) + chosenSector.xMin;
    const y = Math.floor(Math.random() * (chosenSector.yMax - chosenSector.yMin)) + chosenSector.yMin;

    return { x, y };
  }, []);

  // Spawn new target
  const spawnNewTarget = useCallback(() => {
    const coords = getRandomScreenCoords();
    setCurrentTarget({
      id: 'target_' + Date.now() + Math.random(),
      x: coords.x,
      y: coords.y,
      isDying: false,
      blowbackAnim: ''
    });
  }, [getRandomScreenCoords]);

  // Start 3, 2, 1 Countdown
  const handleStart = () => {
    setGameState('COUNTDOWN');
    setCountdownNum(3);
    soundManager.playTick();

    let count = 3;
    const interval = window.setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownNum(count);
        soundManager.playTick();
      } else if (count === 0) {
        setCountdownNum(0); // "START!"
        soundManager.playHeavyPunch();
      } else {
        clearInterval(interval);
        setGameState('PLAYING');
        setTimeRemainingMs(30000);
        setScore(0);
        setHits(0);
        setCombo(0);
        setMaxCombo(0);
        setSuperMeter(0);
        startTimeRef.current = Date.now();
        spawnNewTarget();
      }
    }, 700);
  };

  // High-precision millisecond countdown timer loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    let animId: number;
    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, 30000 - elapsed);
      setTimeRemainingMs(remaining);

      if (remaining <= 0) {
        setGameState('ENDED');
        return;
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  // End game handler
  useEffect(() => {
    if (gameState === 'ENDED') {
      onFinishGame({
        score,
        hits,
        maxCombo
      });
    }
  }, [gameState, score, hits, maxCombo, onFinishGame]);

  // Trigger 超必殺技 (Super Finisher)
  const triggerSuperFinisher = (targetX: number, targetY: number) => {
    soundManager.playSuperFinisher();
    setSuperMeter(0);

    setSuperFinisher({
      active: true,
      title: '極・爆打昇天拳',
      x: targetX,
      y: targetY
    });

    setScreenShake('arcade-shake-super');
    setTimeout(() => {
      setSuperFinisher(null);
      setScreenShake('');
    }, 1200);

    // Massive score bonus
    setScore((prev) => prev + 500);
  };

  // Main Punch Action (Arcade-level CSS/JS mechanics)
  const handlePunch = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (gameState !== 'PLAYING' || currentTarget.isDying) return;

    e.stopPropagation();

    const now = Date.now();
    const timeSinceLast = now - lastPunchTimeRef.current;
    lastPunchTimeRef.current = now;
    const isRapid = timeSinceLast < 240; // 連続パンチ判定

    // Click coordinates
    let clientX = 0;
    let clientY = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const arenaRect = arenaRef.current?.getBoundingClientRect();
    const relX = arenaRect ? clientX - arenaRect.left : 200;
    const relY = arenaRect ? clientY - arenaRect.top : 200;

    const newHits = hits + 1;
    const newCombo = combo + 1;
    const newMaxCombo = Math.max(maxCombo, newCombo);
    const newMeter = Math.min(100, superMeter + 7);

    setHits(newHits);
    setCombo(newCombo);
    setMaxCombo(newMaxCombo);
    setSuperMeter(newMeter);

    // ① 拳が画面外から飛んでくる (Flying fist vectors)
    const vectors: ('bl' | 'br' | 'tr' | 'up')[] = ['bl', 'br', 'tr', 'up'];
    fistVectorIndexRef.current = (fistVectorIndexRef.current + 1) % vectors.length;
    const chosenVector = vectors[fistVectorIndexRef.current];

    soundManager.playWhoosh();

    const isCritical = Math.random() < 0.28 || newCombo % 10 === 0;

    // Check if Super Move triggers
    if (newMeter >= 100 || (newCombo > 0 && newCombo % 25 === 0)) {
      triggerSuperFinisher(currentTarget.x, currentTarget.y);
    } else if (isCritical) {
      soundManager.playHeavyPunch();
    } else {
      soundManager.playPunch(1.2);
    }

    // ① ヒットストップ (Hit-stop micro-freeze with bass drop)
    setIsHitstop(true);
    soundManager.playHitstopBass();
    setTimeout(() => {
      setIsHitstop(false);
    }, 60);

    // ① 漫画風集中線
    setShowSpeedlines(true);
    setTimeout(() => setShowSpeedlines(false), 220);

    // Points calculation
    const basePts = isCritical ? 36 : 14;
    const comboBonus = Math.floor(newCombo * 1.5);
    const totalDmg = basePts + comboBonus;
    setScore((prev) => prev + totalDmg);

    // Dynamic flying fist visual
    setActiveFist({
      x: currentTarget.x,
      y: currentTarget.y,
      vector: chosenVector,
      id: 'fist_' + now,
      isSuper: isCritical,
      isRapid
    });

    // Random arcade onomatopoeia
    const onom = ONOMATOPOEIA_LIST[Math.floor(Math.random() * ONOMATOPOEIA_LIST.length)];
    const particles = Array.from({ length: isCritical ? 5 : 3 }).map(() => ({
      tx: (Math.random() - 0.5) * 140,
      ty: -Math.random() * 100 - 20,
      trot: Math.random() * 360,
      char: isCritical ? '💢' : '💥'
    }));

    const hitEff: HitEffect = {
      id: 'eff_' + now,
      x: relX,
      y: relY,
      onomatopoeia: onom,
      color: isCritical ? '#ff003c' : '#ffffff',
      rotation: (Math.random() - 0.5) * 30,
      damage: totalDmg,
      isCritical,
      weapon,
      particles
    };
    setEffects((prev) => [...prev.slice(-6), hitEff]);

    // ① 画像の吹っ飛び (Target blowback physics animation)
    const blowbackOptions = ['target-blowback-right', 'target-blowback-left', 'target-blowback-up'];
    const chosenBlowback = blowbackOptions[Math.floor(Math.random() * blowbackOptions.length)];

    setCurrentTarget((prev) => ({
      ...prev,
      isDying: true,
      blowbackAnim: chosenBlowback
    }));

    // Screen Shake
    setScreenShake(isCritical ? 'arcade-shake-heavy' : 'arcade-shake-light');
    setTimeout(() => setScreenShake(''), 180);

    // Instantly spawn next target in new random screen position
    setTimeout(() => {
      spawnNewTarget();
    }, 110);
  };

  // Miss / Click outside
  const handleArenaMiss = () => {
    if (gameState !== 'PLAYING') return;
    setCombo(0);
  };

  // Clean old effects
  useEffect(() => {
    if (effects.length === 0) return;
    const timer = setTimeout(() => {
      setEffects((prev) => prev.slice(1));
    }, 450);
    return () => clearTimeout(timer);
  }, [effects]);

  // Format time remaining: e.g. 29.4
  const formattedSeconds = (timeRemainingMs / 1000).toFixed(1);
  // Format score with leading zeros e.g. 000354
  const formattedScore = score.toString().padStart(6, '0');

  return (
    <div
      ref={arenaRef}
      onClick={handleArenaMiss}
      className={`relative w-full h-[calc(100dvh-70px)] min-h-[580px] bg-arcade-grid flex flex-col justify-between overflow-hidden select-none cursor-crosshair ${screenShake} ${
        isHitstop ? 'hitstop-flash-bg' : ''
      }`}
    >
      {/* 漫画風集中線 (Radial Manga Speedlines) */}
      {showSpeedlines && <div className="manga-speedlines-radial" />}

      {/* TOP ARCADE HUD (Matching user video styling) */}
      <div className="w-full px-4 pt-3 pb-2 z-40 flex items-center justify-between pointer-events-none">
        {/* Left: Ranking Status / Notification (As seen in video) */}
        <div className="pointer-events-auto">
          <div
            onClick={onOpenLeaderboard}
            className="cursor-pointer bg-[#101014]/90 border border-[#27272a] hover:border-[#ff003c] rounded-xl px-3 py-1.5 flex items-center gap-2 transition-colors shadow-lg"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center">
              <span className="text-[10px] text-emerald-400 font-bold">✓</span>
            </div>
            <div className="text-left">
              <div className="text-[10px] font-arcade-mono tracking-widest text-white font-black uppercase leading-tight">
                {rankingUpdatedToast ? 'RANKING UPDATED' : 'LEADERBOARD'}
              </div>
              <div className="text-[9px] text-[#71717a] font-mono leading-none">
                リアルタイム同期中
              </div>
            </div>
          </div>
        </div>

        {/* Center: Timer, Score, Combo, Hits (Exact layout from video) */}
        <div className="flex items-center gap-4 md:gap-8 bg-[#101014]/85 border border-[#27272a] px-4 py-1.5 rounded-2xl shadow-xl">
          {/* Time (e.g. 30.0 / 29.4) */}
          <div className="text-center min-w-[50px]">
            <div className="text-[9px] text-[#71717a] font-arcade-mono uppercase font-bold tracking-wider">TIME</div>
            <div className={`font-arcade-mono text-xl md:text-2xl font-black tabular-nums tracking-wider ${
              timeRemainingMs <= 5000 ? 'text-[#ff003c] animate-pulse' : 'text-white'
            }`}>
              {formattedSeconds}
            </div>
          </div>

          {/* Score with leading zeros (e.g. 000354) */}
          <div className="text-center min-w-[90px]">
            <div className="text-[9px] text-[#71717a] font-arcade-mono uppercase font-bold tracking-wider">SCORE</div>
            <div className="font-arcade-mono text-2xl md:text-3xl font-black text-[#ff003c] tabular-nums tracking-widest text-arcade-shadow">
              {formattedScore}
            </div>
          </div>

          {/* Combo */}
          <div className="text-center min-w-[45px]">
            <div className="text-[9px] text-[#71717a] font-arcade-mono uppercase font-bold tracking-wider">COMBO</div>
            <div className="font-arcade-mono text-xl md:text-2xl font-black text-white tabular-nums">
              {combo}
            </div>
          </div>

          {/* Hits */}
          <div className="text-center min-w-[40px] hidden sm:block">
            <div className="text-[9px] text-[#71717a] font-arcade-mono uppercase font-bold tracking-wider">HITS</div>
            <div className="font-arcade-mono text-xl md:text-2xl font-black text-white tabular-nums">
              {hits}
            </div>
          </div>
        </div>

        {/* Right: Sound toggle & Upload trigger */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onOpenUpload}
            className="p-2 rounded-xl bg-[#101014] border border-[#27272a] hover:border-[#ff003c] text-white transition-colors"
            title="写真を変更"
          >
            <Camera className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={onToggleMute}
            className="p-2 rounded-xl bg-[#101014] border border-[#27272a] hover:border-[#ff003c] text-white transition-colors"
            title={isMuted ? 'ミュート解除' : 'ミュート'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-[#71717a]" /> : <Volume2 className="w-4 h-4 text-[#ff003c]" />}
          </button>
        </div>
      </div>

      {/* Super Move Meter at Bottom-Center */}
      {gameState === 'PLAYING' && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-[10px] font-arcade-mono font-bold tracking-widest text-[#71717a] mb-1">
            <Zap className={`w-3.5 h-3.5 ${superMeter >= 100 ? 'text-[#ff003c] fill-[#ff003c] animate-bounce' : 'text-[#71717a]'}`} />
            SUPER METER {superMeter}%
          </div>
          <div className="w-48 h-2 bg-[#18181f] border border-[#27272a] rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-100 ${
                superMeter >= 100
                  ? 'bg-gradient-to-r from-red-600 via-rose-500 to-white shadow-[0_0_12px_#ff003c] animate-pulse'
                  : 'bg-red-600'
              }`}
              style={{ width: `${superMeter}%` }}
            />
          </div>
        </div>
      )}

      {/* ARCADE PUNCH OVERLAYS (Flying Fists, Onomatopoeia, Hitsparks, Super Cutin) */}
      <ArcadePunchOverlay
        effects={effects}
        activeFist={activeFist}
        superFinisher={superFinisher}
      />

      {/* PLAYING TARGET (Appears dynamically across ALL sectors: top, mid, bottom, corners) */}
      {gameState === 'PLAYING' && (
        <div
          onClick={handlePunch}
          onTouchStart={handlePunch}
          className={`absolute z-20 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-75 active:scale-90 ${
            currentTarget.isDying ? currentTarget.blowbackAnim : ''
          } ${isHitstop ? 'hitstop-active' : ''}`}
          style={{
            left: `${currentTarget.x}%`,
            top: `${currentTarget.y}%`
          }}
        >
          {/* Target Reticle (Radar circles & corner brackets matching video) */}
          <div className="relative w-28 h-28 md:w-36 md:h-36 flex items-center justify-center group">
            {/* Spinning Radar Ring */}
            <div className="reticle-crosshair" />

            {/* Corner Brackets */}
            <div className="reticle-bracket top-0 left-0 border-t-2 border-l-2" />
            <div className="reticle-bracket top-0 right-0 border-t-2 border-r-2" />
            <div className="reticle-bracket bottom-0 left-0 border-b-2 border-l-2" />
            <div className="reticle-bracket bottom-0 right-0 border-b-2 border-r-2" />

            {/* Center Target Portrait */}
            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-white/60 bg-[#121217] shadow-[0_0_20px_rgba(0,0,0,0.8)]">
              <img
                src={character.image}
                alt={character.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover pointer-events-none select-none"
              />
            </div>

            {/* Small red crosshair dot in center */}
            <div className="absolute w-2 h-2 rounded-full bg-[#ff003c] shadow-[0_0_8px_#ff003c] pointer-events-none" />
          </div>
        </div>
      )}

      {/* START SCREEN (READY? Mode matching user's video) */}
      {gameState === 'READY' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          {/* Big BOLD "READY?" in Impact/Dela Gothic */}
          <h1 className="text-6xl md:text-8xl font-arcade-title font-black text-white tracking-widest mb-6 text-arcade-white-shadow">
            READY?
          </h1>

          {/* Central Target Preview Card with Reticle */}
          <div className="relative mb-6">
            <div className="w-40 h-40 md:w-48 md:h-48 rounded-2xl border border-[#27272a] bg-[#101014] flex flex-col items-center justify-center p-3 relative group">
              {/* Radar ring */}
              <div className="reticle-crosshair" />

              {/* Character Face */}
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/50 mb-2">
                <img
                  src={character.image}
                  alt={character.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="text-[10px] font-arcade-mono font-bold text-[#71717a] uppercase tracking-wider">
                {character.isCustom ? 'CUSTOM TARGET' : character.name}
              </div>

              {/* Quick switch badge */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenUpload();
                }}
                className="mt-1 text-[9px] text-[#ff003c] font-bold hover:underline"
              >
                写真変更
              </button>
            </div>
          </div>

          {/* Bold Red "START" Button (As in video) */}
          <button
            onClick={handleStart}
            className="btn-arcade-red px-10 py-3.5 rounded-xl text-base md:text-lg tracking-widest font-black uppercase"
          >
            START
          </button>

          {/* Subtext below (As in video: TAP OR PUNCH THE TARGET) */}
          <div className="text-[11px] font-arcade-mono tracking-[0.25em] text-[#71717a] uppercase mt-4 font-bold">
            TAP OR PUNCH THE TARGET
          </div>
        </div>
      )}

      {/* COUNTDOWN SCREEN: 3, 2, 1 inside target reticle */}
      {gameState === 'COUNTDOWN' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 pointer-events-none">
          <div className="relative w-48 h-48 flex items-center justify-center">
            <div className="reticle-crosshair" />
            <div className="text-7xl md:text-9xl font-arcade-title font-black text-white animate-ping text-arcade-white-shadow">
              {countdownNum === 0 ? 'GO!' : countdownNum}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

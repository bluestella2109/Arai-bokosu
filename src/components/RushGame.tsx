import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CharacterTarget, HitEffect, WeaponType } from '../types/game';
import { ONOMATOPOEIA_LIST, WEAPONS } from '../data/characters';
import { soundManager } from '../utils/audio';
import { ArcadePunchOverlay } from './ArcadePunchOverlay';
import { Zap, Volume2, VolumeX, Camera, Flame } from 'lucide-react';

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

  // 怒りゲージ (0 to 100%) & 激怒モード (Rage Mode)
  const [rageMeter, setRageMeter] = useState<number>(0);
  const [isRageMode, setIsRageMode] = useState<boolean>(false);
  const [rageTimeRemaining, setRageTimeRemaining] = useState<number>(0);
  const [rageBanner, setRageBanner] = useState<boolean>(false);

  // Super Meter (0 to 100%)
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
  const startTimeRef = useRef<number>(0);

  // Multi-sector random generator across entire viewport
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
        setRageMeter(0);
        setIsRageMode(false);
        setRageTimeRemaining(0);
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

  // 激怒モードタイマーループ (Rage Mode Duration Countdown - 7.5s)
  useEffect(() => {
    if (!isRageMode || gameState !== 'PLAYING') return;

    const interval = window.setInterval(() => {
      setRageTimeRemaining((prev) => {
        if (prev <= 0.1) {
          clearInterval(interval);
          setIsRageMode(false);
          setRageMeter(0);
          return 0;
        }
        return Math.max(0, prev - 0.1);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isRageMode, gameState]);

  // End game handler
  useEffect(() => {
    if (gameState === 'ENDED') {
      setIsRageMode(false);
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

    setScore((prev) => prev + (isRageMode ? 1000 : 500));
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

    setHits(newHits);
    setCombo(newCombo);
    setMaxCombo(newMaxCombo);

    // 怒りゲージ更新 (連打数に応じて溜まる)
    if (!isRageMode) {
      const nextRage = Math.min(100, rageMeter + 6.5);
      setRageMeter(nextRage);

      // MAXまで溜まったら「激怒モード」発動！
      if (nextRage >= 100) {
        setIsRageMode(true);
        setRageTimeRemaining(7.5);
        soundManager.playRageRoar();
        setRageBanner(true);
        setTimeout(() => setRageBanner(false), 2000);
        setScreenShake('arcade-shake-super');
      }
    }

    // ① 拳が画面外から飛んでくる (Flying fist vectors)
    const vectors: ('bl' | 'br' | 'tr' | 'up')[] = ['bl', 'br', 'tr', 'up'];
    fistVectorIndexRef.current = (fistVectorIndexRef.current + 1) % vectors.length;
    const chosenVector = vectors[fistVectorIndexRef.current];

    soundManager.playWhoosh();

    const isCritical = Math.random() < 0.28 || newCombo % 10 === 0 || isRageMode;

    // 激怒モード中は常時爆発音、通常時は通常音/クリティカル音
    if (isRageMode) {
      soundManager.playExplosion();
    } else if (newCombo > 0 && newCombo % 25 === 0) {
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

    // Points calculation (激怒モード中はスコア3倍〜5倍！)
    const basePts = isCritical ? 36 : 14;
    const comboBonus = Math.floor(newCombo * 1.5);
    const rageMultiplier = isRageMode ? 3.5 : 1.0;
    const totalDmg = Math.floor((basePts + comboBonus) * rageMultiplier);
    setScore((prev) => prev + totalDmg);

    // Dynamic flying fist visual
    setActiveFist({
      x: currentTarget.x,
      y: currentTarget.y,
      vector: chosenVector,
      id: 'fist_' + now,
      isSuper: isCritical || isRageMode,
      isRapid: isRapid || isRageMode
    });

    // Random arcade onomatopoeia
    const onom = isRageMode
      ? 'ドゴォォン！！'
      : ONOMATOPOEIA_LIST[Math.floor(Math.random() * ONOMATOPOEIA_LIST.length)];

    const particles = Array.from({ length: isRageMode ? 7 : isCritical ? 5 : 3 }).map(() => ({
      tx: (Math.random() - 0.5) * 160,
      ty: -Math.random() * 120 - 20,
      trot: Math.random() * 360,
      char: isRageMode ? '🔥' : isCritical ? '💢' : '💥'
    }));

    const hitEff: HitEffect = {
      id: 'eff_' + now,
      x: relX,
      y: relY,
      onomatopoeia: onom,
      color: isCritical || isRageMode ? '#ff003c' : '#ffffff',
      rotation: (Math.random() - 0.5) * 30,
      damage: totalDmg,
      isCritical: isCritical || isRageMode,
      weapon,
      particles
    };
    setEffects((prev) => [...prev.slice(-7), hitEff]);

    // ① 画像の吹っ飛び (Target blowback physics animation)
    const blowbackOptions = ['target-blowback-right', 'target-blowback-left', 'target-blowback-up'];
    const chosenBlowback = blowbackOptions[Math.floor(Math.random() * blowbackOptions.length)];

    setCurrentTarget((prev) => ({
      ...prev,
      isDying: true,
      blowbackAnim: chosenBlowback
    }));

    // Screen Shake (激怒モード中は激震)
    setScreenShake(isRageMode ? 'arcade-shake-heavy' : isCritical ? 'arcade-shake-heavy' : 'arcade-shake-light');
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
      className={`relative w-full h-[calc(100dvh-70px)] min-h-[580px] flex flex-col justify-between overflow-hidden select-none cursor-crosshair transition-colors duration-500 ${
        isRageMode ? 'bg-rage-mode' : 'bg-arcade-grid'
      } ${screenShake} ${isHitstop ? 'hitstop-flash-bg' : ''}`}
    >
      {/* 漫画風集中線 (Radial Manga Speedlines) */}
      {(showSpeedlines || isRageMode) && <div className="manga-speedlines-radial" />}

      {/* 激怒モード突入バナー */}
      {rageBanner && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none animate-bounce">
          <div className="bg-[#ff003c] text-white font-arcade-title font-black text-sm md:text-xl px-6 py-2 rounded-full border-2 border-white shadow-[0_0_30px_#ff003c] flex items-center gap-2 whitespace-nowrap">
            <Flame className="w-5 h-5 text-white animate-spin" />
            <span>激怒モード発動！ 全打撃爆発＆スコア超倍増！！</span>
            <Flame className="w-5 h-5 text-white animate-spin" />
          </div>
        </div>
      )}

      {/* TOP ARCADE HUD */}
      <div className="w-full px-4 pt-3 pb-2 z-40 flex items-center justify-between pointer-events-none">
        {/* Left: Ranking Status */}
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

        {/* Center: Timer, Score, Combo, Hits */}
        <div className={`flex items-center gap-4 md:gap-8 bg-[#101014]/90 border px-4 py-1.5 rounded-2xl shadow-xl transition-colors ${
          isRageMode ? 'border-[#ff003c] shadow-[0_0_20px_rgba(255,0,60,0.5)]' : 'border-[#27272a]'
        }`}>
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
            <div className={`font-arcade-mono text-xl md:text-2xl font-black tabular-nums ${isRageMode ? 'text-[#ff003c] animate-pulse' : 'text-white'}`}>
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

      {/* 画面下部：連打数に応じて溜まる「怒りゲージ」 (RAGE GAUGE) */}
      {gameState === 'PLAYING' && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center w-full max-w-sm px-4">
          <div className="flex items-center justify-between w-full text-[10px] font-arcade-mono font-bold tracking-widest mb-1.5">
            <span className="flex items-center gap-1.5 text-white">
              <Flame className={`w-4 h-4 ${isRageMode ? 'text-[#ff003c] animate-spin' : rageMeter >= 85 ? 'text-[#ff003c] animate-bounce' : 'text-[#71717a]'}`} />
              {isRageMode ? '🔥 激怒モード発動中！' : '怒りゲージ (RAGE METER)'}
            </span>
            <span className={`font-black ${isRageMode ? 'text-[#ff003c] animate-pulse' : 'text-white'}`}>
              {isRageMode ? `残り ${rageTimeRemaining.toFixed(1)}s` : `${Math.round(rageMeter)}%`}
            </span>
          </div>

          {/* Liquid Rage Meter Bar */}
          <div className={`w-full h-3.5 bg-[#14141a] border-2 rounded-full overflow-hidden p-0.5 shadow-2xl transition-all ${
            isRageMode
              ? 'border-[#ff003c] shadow-[0_0_20px_#ff003c] rage-meter-max'
              : rageMeter >= 85
              ? 'border-[#ff003c] rage-meter-max'
              : 'border-[#27272a]'
          }`}>
            <div
              className={`h-full rounded-full transition-all duration-100 ${
                isRageMode
                  ? 'bg-gradient-to-r from-red-600 via-rose-500 to-white shadow-[0_0_15px_#ff003c] animate-pulse'
                  : 'rage-meter-bar'
              }`}
              style={{
                width: isRageMode
                  ? `${(rageTimeRemaining / 7.5) * 100}%`
                  : `${rageMeter}%`
              }}
            />
          </div>
        </div>
      )}

      {/* ARCADE PUNCH OVERLAYS (Flying Fists, Onomatopoeia, Hitsparks, Super Cutin, and RAGE EXPLOSIONS) */}
      <ArcadePunchOverlay
        effects={effects}
        activeFist={activeFist}
        superFinisher={superFinisher}
        isRageMode={isRageMode}
      />

      {/* PLAYING TARGET */}
      {gameState === 'PLAYING' && (
        <div
          onClick={handlePunch}
          onTouchStart={handlePunch}
          className={`absolute z-20 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-75 active:scale-90 ${
            currentTarget.isDying ? currentTarget.blowbackAnim : ''
          } ${isHitstop ? 'hitstop-active' : ''} ${isRageMode ? 'rage-fire-edge' : ''}`}
          style={{
            left: `${currentTarget.x}%`,
            top: `${currentTarget.y}%`
          }}
        >
          {/* Target Reticle */}
          <div className="relative w-28 h-28 md:w-36 md:h-36 flex items-center justify-center group">
            {/* Spinning Radar Ring */}
            <div className={`reticle-crosshair ${isRageMode ? 'border-[#ff003c]' : ''}`} />

            {/* Corner Brackets */}
            <div className={`reticle-bracket top-0 left-0 border-t-2 border-l-2 ${isRageMode ? 'border-[#ff003c]' : ''}`} />
            <div className={`reticle-bracket top-0 right-0 border-t-2 border-r-2 ${isRageMode ? 'border-[#ff003c]' : ''}`} />
            <div className={`reticle-bracket bottom-0 left-0 border-b-2 border-l-2 ${isRageMode ? 'border-[#ff003c]' : ''}`} />
            <div className={`reticle-bracket bottom-0 right-0 border-b-2 border-r-2 ${isRageMode ? 'border-[#ff003c]' : ''}`} />

            {/* Center Target Portrait */}
            <div className={`relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 bg-[#121217] shadow-[0_0_20px_rgba(0,0,0,0.8)] ${
              isRageMode ? 'border-[#ff003c] shadow-[0_0_25px_#ff003c]' : 'border-white/60'
            }`}>
              <img
                src={character.image}
                alt={character.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover pointer-events-none select-none"
              />
            </div>

            {/* Red crosshair dot in center */}
            <div className="absolute w-2 h-2 rounded-full bg-[#ff003c] shadow-[0_0_8px_#ff003c] pointer-events-none" />
          </div>
        </div>
      )}

      {/* START SCREEN (READY? Mode) */}
      {gameState === 'READY' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <h1 className="text-6xl md:text-8xl font-arcade-title font-black text-white tracking-widest mb-6 text-arcade-white-shadow">
            READY?
          </h1>

          <div className="relative mb-6">
            <div className="w-40 h-40 md:w-48 md:h-48 rounded-2xl border border-[#27272a] bg-[#101014] flex flex-col items-center justify-center p-3 relative group">
              <div className="reticle-crosshair" />

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

          <button
            onClick={handleStart}
            className="btn-arcade-red px-10 py-3.5 rounded-xl text-base md:text-lg tracking-widest font-black uppercase"
          >
            START
          </button>

          <div className="text-[11px] font-arcade-mono tracking-[0.25em] text-[#71717a] uppercase mt-4 font-bold">
            TAP OR PUNCH THE TARGET
          </div>
        </div>
      )}

      {/* COUNTDOWN SCREEN */}
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

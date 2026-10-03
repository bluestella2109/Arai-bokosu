import React, { useState, useEffect, useRef } from 'react';
import { CharacterTarget, HitEffect, WeaponType } from '../types/game';
import { ONOMATOPOEIA_LIST, WEAPONS } from '../data/characters';
import { soundManager } from '../utils/audio';
import { ArcadePunchOverlay } from './ArcadePunchOverlay';
import { Zap, RotateCcw, Camera, Flame } from 'lucide-react';

interface SandboxGameProps {
  character: CharacterTarget;
  weapon: WeaponType;
  onOpenUpload: () => void;
}

export const SandboxGame: React.FC<SandboxGameProps> = ({
  character,
  weapon,
  onOpenUpload
}) => {
  const [totalDamage, setTotalDamage] = useState<number>(0);
  const [totalPunches, setTotalPunches] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxHp] = useState<number>(1000);
  const [currentHp, setCurrentHp] = useState<number>(1000);
  const [isKO, setIsKO] = useState<boolean>(false);
  const [koTimer, setKoTimer] = useState<number>(0);
  const [screenShake, setScreenShake] = useState<string>('');
  const [isHitstop, setIsHitstop] = useState<boolean>(false);
  const [targetAnim, setTargetAnim] = useState<string>('');
  const [isTurbo, setIsTurbo] = useState<boolean>(false);

  // 怒りゲージ (0 to 100%) & 激怒モード (Rage Mode)
  const [rageMeter, setRageMeter] = useState<number>(0);
  const [isRageMode, setIsRageMode] = useState<boolean>(false);
  const [rageTimeRemaining, setRageTimeRemaining] = useState<number>(0);

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
  const turboIntervalRef = useRef<number | null>(null);
  const targetBtnRef = useRef<HTMLDivElement>(null);
  const lastPunchRef = useRef<number>(0);
  const fistVectorRef = useRef<number>(0);

  // 激怒モードタイマーループ
  useEffect(() => {
    if (!isRageMode) return;

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
  }, [isRageMode]);

  // Punch execution with arcade mechanics & rage mode
  const executePunch = (coords?: { x: number; y: number }) => {
    if (isKO) return;

    const now = Date.now();
    const isRapid = now - lastPunchRef.current < 200;
    lastPunchRef.current = now;

    let posX = coords?.x;
    let posY = coords?.y;

    if (posX === undefined || posY === undefined) {
      const rect = targetBtnRef.current?.getBoundingClientRect();
      const arenaRect = arenaRef.current?.getBoundingClientRect();
      if (rect && arenaRect) {
        posX = rect.left - arenaRect.left + rect.width / 2 + (Math.random() - 0.5) * 40;
        posY = rect.top - arenaRect.top + rect.height / 2 + (Math.random() - 0.5) * 40;
      } else {
        posX = 260;
        posY = 240;
      }
    }

    const vectors: ('bl' | 'br' | 'tr' | 'up')[] = ['bl', 'br', 'tr', 'up'];
    fistVectorRef.current = (fistVectorRef.current + 1) % vectors.length;
    const chosenVector = vectors[fistVectorRef.current];

    soundManager.playWhoosh();

    // 怒りゲージ蓄積
    if (!isRageMode) {
      const nextRage = Math.min(100, rageMeter + 6.5);
      setRageMeter(nextRage);

      if (nextRage >= 100) {
        setIsRageMode(true);
        setRageTimeRemaining(8.0);
        soundManager.playRageRoar();
        setScreenShake('arcade-shake-super');
      }
    }

    const isCritical = Math.random() < 0.28 || isRageMode;

    // 激怒モード中は爆発音
    if (isRageMode) {
      soundManager.playExplosion();
    } else if (isCritical) {
      soundManager.playHeavyPunch();
    } else {
      soundManager.playPunch(1.2);
    }

    // ヒットストップ
    setIsHitstop(true);
    soundManager.playHitstopBass();
    setTimeout(() => setIsHitstop(false), 55);

    const baseDmg = Math.floor(Math.random() * 60 + 60) * (isCritical ? 2 : 1);
    const dmg = isRageMode ? baseDmg * 3 : baseDmg;
    setTotalDamage((prev) => prev + dmg);
    setTotalPunches((prev) => prev + 1);
    setCombo((prev) => prev + 1);

    setCurrentHp((prev) => {
      const next = prev - dmg;
      if (next <= 0) {
        triggerKO();
        return 0;
      }
      return next;
    });

    // Active Flying Fist
    setActiveFist({
      x: 50,
      y: 50,
      vector: chosenVector,
      id: 'fist_' + now,
      isSuper: isCritical || isRageMode,
      isRapid: isRapid || isRageMode
    });

    const onom = isRageMode
      ? 'ドゴォォン！！'
      : ONOMATOPOEIA_LIST[Math.floor(Math.random() * ONOMATOPOEIA_LIST.length)];

    const particles = Array.from({ length: isRageMode ? 7 : isCritical ? 5 : 3 }).map(() => ({
      tx: (Math.random() - 0.5) * 160,
      ty: -Math.random() * 120 - 20,
      trot: Math.random() * 360,
      char: isRageMode ? '🔥' : isCritical ? '💢' : '💥'
    }));

    const newEffect: HitEffect = {
      id: 'eff_' + now,
      x: posX,
      y: posY,
      onomatopoeia: onom,
      color: isCritical || isRageMode ? '#ff003c' : '#ffffff',
      rotation: (Math.random() - 0.5) * 30,
      damage: dmg,
      isCritical: isCritical || isRageMode,
      weapon,
      particles
    };
    setEffects((prev) => [...prev.slice(-6), newEffect]);

    // 反動アニメーション
    const anims = ['target-blowback-right', 'target-blowback-left', 'target-blowback-up'];
    const selAnim = anims[Math.floor(Math.random() * anims.length)];
    setTargetAnim(selAnim);
    setTimeout(() => setTargetAnim(''), 220);

    // Screen Shake
    setScreenShake(isRageMode ? 'arcade-shake-heavy' : isCritical ? 'arcade-shake-heavy' : 'arcade-shake-light');
    setTimeout(() => setScreenShake(''), 180);
  };

  // KO trigger
  const triggerKO = () => {
    setIsKO(true);
    setKoTimer(3);
    soundManager.playKOGong();

    let t = 3;
    const interval = window.setInterval(() => {
      t -= 1;
      setKoTimer(t);
      if (t <= 0) {
        clearInterval(interval);
        setIsKO(false);
        setCurrentHp(maxHp);
      }
    }, 1000);
  };

  const handleFaceClick = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
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
    const relX = arenaRect ? clientX - arenaRect.left : 260;
    const relY = arenaRect ? clientY - arenaRect.top : 240;

    executePunch({ x: relX, y: relY });
  };

  // Turbo machine gun
  useEffect(() => {
    if (isTurbo && !isKO) {
      turboIntervalRef.current = window.setInterval(() => {
        executePunch();
      }, 100);
    } else {
      if (turboIntervalRef.current) clearInterval(turboIntervalRef.current);
    }

    return () => {
      if (turboIntervalRef.current) clearInterval(turboIntervalRef.current);
    };
  }, [isTurbo, isKO, isRageMode]);

  useEffect(() => {
    if (effects.length === 0) return;
    const timer = setTimeout(() => {
      setEffects((prev) => prev.slice(1));
    }, 450);
    return () => clearTimeout(timer);
  }, [effects]);

  const hpPercent = Math.max(0, Math.round((currentHp / maxHp) * 100));

  return (
    <div
      ref={arenaRef}
      className={`relative w-full h-[calc(100dvh-70px)] min-h-[580px] flex flex-col justify-between overflow-hidden select-none cursor-crosshair transition-colors duration-500 ${
        isRageMode ? 'bg-rage-mode' : 'bg-arcade-grid'
      } ${screenShake} ${isHitstop ? 'hitstop-flash-bg' : ''}`}
    >
      {/* Top HUD */}
      <div className="w-full px-4 pt-3 pb-2 z-40 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-white/50 overflow-hidden bg-black shrink-0">
            <img src={character.image} alt={character.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="font-arcade-title text-sm font-black text-white">
              {character.name}
            </div>
            <div className="text-[10px] font-arcade-mono text-[#71717a]">
              ENDLESS SANDBOX
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className={`flex items-center gap-4 bg-[#101014]/90 border px-4 py-1.5 rounded-xl transition-colors ${
          isRageMode ? 'border-[#ff003c] shadow-[0_0_20px_rgba(255,0,60,0.5)]' : 'border-[#27272a]'
        }`}>
          <div className="text-right">
            <div className="text-[9px] text-[#71717a] font-arcade-mono uppercase font-bold">DAMAGE</div>
            <div className="font-arcade-mono text-xl font-black text-[#ff003c] tabular-nums">
              {totalDamage.toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-[#71717a] font-arcade-mono uppercase font-bold">HITS</div>
            <div className="font-arcade-mono text-xl font-black text-white tabular-nums">
              {totalPunches}
            </div>
          </div>
        </div>
      </div>

      {/* Center Punch Target */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-20">
        {/* HP Bar */}
        <div className="w-64 max-w-xs mb-4">
          <div className="flex items-center justify-between text-[10px] font-arcade-mono text-[#71717a] mb-1">
            <span>DURABILITY HP</span>
            <span>{currentHp}/{maxHp}</span>
          </div>
          <div className="w-full h-2 bg-[#18181f] border border-[#27272a] rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-[#ff003c] rounded-full transition-all duration-100"
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {/* Target Reticle Frame */}
        <div
          ref={targetBtnRef}
          onClick={handleFaceClick}
          onTouchStart={handleFaceClick}
          className={`relative cursor-pointer transition-transform duration-75 active:scale-90 ${targetAnim} ${
            isHitstop ? 'hitstop-active' : ''
          } ${isRageMode ? 'rage-fire-edge' : ''}`}
        >
          <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center group">
            <div className={`reticle-crosshair ${isRageMode ? 'border-[#ff003c]' : ''}`} />

            <div className={`reticle-bracket top-0 left-0 border-t-2 border-l-2 ${isRageMode ? 'border-[#ff003c]' : ''}`} />
            <div className={`reticle-bracket top-0 right-0 border-t-2 border-r-2 ${isRageMode ? 'border-[#ff003c]' : ''}`} />
            <div className={`reticle-bracket bottom-0 left-0 border-b-2 border-l-2 ${isRageMode ? 'border-[#ff003c]' : ''}`} />
            <div className={`reticle-bracket bottom-0 right-0 border-b-2 border-r-2 ${isRageMode ? 'border-[#ff003c]' : ''}`} />

            {/* Face Portrait */}
            <div className={`relative w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden border-2 bg-black shadow-[0_0_30px_rgba(0,0,0,0.8)] ${
              isRageMode ? 'border-[#ff003c] shadow-[0_0_30px_#ff003c]' : 'border-white/60'
            }`}>
              <img
                src={character.image}
                alt={character.name}
                className={`w-full h-full object-cover pointer-events-none select-none ${isKO ? 'grayscale blur-[1px]' : ''}`}
              />

              {isKO && (
                <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-white">
                  <span className="text-4xl font-arcade-impact font-black text-[#ff003c]">
                    K.O.!
                  </span>
                  <span className="text-[10px] font-arcade-mono text-[#71717a] mt-1">
                    復活まで {koTimer}秒
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 画面下部：怒りゲージ (RAGE GAUGE) */}
      <div className="w-full max-w-sm mx-auto px-4 z-30 mb-2 pointer-events-none">
        <div className="flex items-center justify-between w-full text-[10px] font-arcade-mono font-bold tracking-widest mb-1">
          <span className="flex items-center gap-1.5 text-white">
            <Flame className={`w-3.5 h-3.5 ${isRageMode ? 'text-[#ff003c] animate-spin' : rageMeter >= 85 ? 'text-[#ff003c] animate-bounce' : 'text-[#71717a]'}`} />
            {isRageMode ? '🔥 激怒モード発動中！' : '怒りゲージ (RAGE METER)'}
          </span>
          <span className={`font-black ${isRageMode ? 'text-[#ff003c] animate-pulse' : 'text-white'}`}>
            {isRageMode ? `残り ${rageTimeRemaining.toFixed(1)}s` : `${Math.round(rageMeter)}%`}
          </span>
        </div>

        <div className={`w-full h-3 bg-[#14141a] border-2 rounded-full overflow-hidden p-0.5 transition-all ${
          isRageMode
            ? 'border-[#ff003c] shadow-[0_0_15px_#ff003c] rage-meter-max'
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
                ? `${(rageTimeRemaining / 8.0) * 100}%`
                : `${rageMeter}%`
            }}
          />
        </div>
      </div>

      {/* Arcade Punch Overlay with Rage Explosions */}
      <ArcadePunchOverlay
        effects={effects}
        activeFist={activeFist}
        superFinisher={null}
        isRageMode={isRageMode}
      />

      {/* Bottom Controls */}
      <div className="w-full px-4 pb-4 z-40 flex items-center justify-between gap-2">
        <button
          onClick={() => setIsTurbo(!isTurbo)}
          disabled={isKO}
          className={`px-4 py-2.5 rounded-xl border text-xs font-arcade-title font-black flex items-center gap-1.5 transition-all ${
            isTurbo
              ? 'bg-[#ff003c] text-white border-[#ff3366] shadow-[0_0_15px_rgba(255,0,60,0.6)] animate-pulse'
              : 'bg-[#14141a] text-white border-[#27272a] hover:border-[#ff003c]'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          {isTurbo ? '自動連打中（停止）' : 'オラオラ自動連打'}
        </button>

        <button
          onClick={() => {
            setCurrentHp(maxHp);
            setIsKO(false);
            setTotalDamage(0);
            setTotalPunches(0);
          }}
          className="p-2.5 bg-[#14141a] hover:bg-[#1c1c24] text-[#71717a] hover:text-white rounded-xl border border-[#27272a] transition-colors"
          title="HPとダメージをリセット"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenUpload}
          className="btn-arcade-red px-4 py-2.5 rounded-xl text-xs font-arcade-title font-black flex items-center gap-1.5"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>写真変更</span>
        </button>
      </div>
    </div>
  );
};

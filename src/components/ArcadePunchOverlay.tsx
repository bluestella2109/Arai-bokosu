import React from 'react';
import { HitEffect } from '../types/game';

interface ArcadePunchOverlayProps {
  effects: HitEffect[];
  activeFist: {
    x: number;
    y: number;
    vector: 'bl' | 'br' | 'tr' | 'up';
    id: string;
    isSuper?: boolean;
    isRapid?: boolean;
  } | null;
  superFinisher: {
    active: boolean;
    title: string;
    x: number;
    y: number;
  } | null;
}

export const ArcadePunchOverlay: React.FC<ArcadePunchOverlayProps> = ({
  effects,
  activeFist,
  superFinisher
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      {/* 1. 超必殺技 全画面カットイン演出 */}
      {superFinisher && superFinisher.active && (
        <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center super-cutin-overlay pointer-events-none">
          {/* Radial speedlines during super */}
          <div className="manga-speedlines-radial" />

          {/* Red Slash Line */}
          <div className="absolute w-[200vw] h-3 bg-red-600 super-slash-line shadow-[0_0_40px_#ff003c]" />

          {/* Calligraphy Kanji Cut-In */}
          <div className="relative text-center super-kanji-pop px-4">
            <div className="text-red-500 font-arcade-mono text-sm tracking-[0.3em] uppercase mb-1 font-bold">
              SUPER ULTRA FINISHER
            </div>
            <h1 className="text-5xl md:text-8xl font-arcade-title font-black text-white tracking-widest text-arcade-shadow">
              {superFinisher.title}
            </h1>
            <div className="mt-3 text-red-400 font-arcade-impact text-2xl md:text-3xl tracking-wider">
              MAX IMPACT !!
            </div>
          </div>
        </div>
      )}

      {/* 2. 拳が画面外から飛んでくる (Arcade Flying Fists) */}
      {activeFist && (
        <div
          key={activeFist.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${activeFist.x}%`, top: `${activeFist.y}%` }}
        >
          {/* Main Flying Fist */}
          <div
            className={`select-none ${
              activeFist.vector === 'bl'
                ? 'fist-fly-bl'
                : activeFist.vector === 'br'
                ? 'fist-fly-br'
                : activeFist.vector === 'tr'
                ? 'fist-fly-tr'
                : 'fist-fly-up'
            }`}
          >
            {activeFist.isSuper ? (
              <div className="text-8xl md:text-9xl filter drop-shadow-[0_0_35px_#ff003c]">
                💥👊
              </div>
            ) : (
              <div className="text-7xl md:text-8xl filter drop-shadow-[0_0_20px_#ff003c]">
                👊
              </div>
            )}
          </div>

          {/* 連続パンチラッシュ (Gatling Flurry Ghost Fists) */}
          {activeFist.isRapid && (
            <>
              <div
                className="gatling-rush-ghost absolute text-6xl"
                style={{ ['--gx' as string]: '-40px', ['--gy' as string]: '-30px' }}
              >
                👊
              </div>
              <div
                className="gatling-rush-ghost absolute text-6xl"
                style={{ ['--gx' as string]: '40px', ['--gy' as string]: '30px' }}
              >
                👊
              </div>
            </>
          )}
        </div>
      )}

      {/* 3. 打撃地点の衝撃波・火花・ダメージ・オノマトペ */}
      {effects.map((eff) => (
        <React.Fragment key={eff.id}>
          {/* Crimson Shockwave Ring */}
          <div
            className="impact-shockwave-red absolute"
            style={{
              left: `${eff.x}px`,
              top: `${eff.y}px`,
              width: eff.isCritical ? '140px' : '90px',
              height: eff.isCritical ? '140px' : '90px'
            }}
          />

          {/* Crosshair Hit Flash */}
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: `${eff.x}px`, top: `${eff.y}px` }}
          >
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute w-8 h-[2px] bg-red-500 shadow-[0_0_8px_#ff003c]" />
              <div className="absolute h-8 w-[2px] bg-red-500 shadow-[0_0_8px_#ff003c]" />
            </div>
          </div>

          {/* Floating Onomatopoeia (漫画風オノマトペ - 白・黒・赤) */}
          <div
            className="onomatopoeia-pop absolute font-arcade-title text-2xl md:text-4xl font-black select-none pointer-events-none"
            style={{
              left: `${eff.x}px`,
              top: `${eff.y}px`,
              color: eff.isCritical ? '#ff003c' : '#ffffff',
              ['--rot' as string]: `${eff.rotation}deg`,
              WebkitTextStroke: '2px #000',
              textShadow: '0 0 15px rgba(255, 0, 60, 0.8), 2px 2px 0 #000'
            }}
          >
            {eff.onomatopoeia}
          </div>

          {/* Damage Number Floater */}
          <div
            className="arcade-damage-number absolute font-arcade-impact text-3xl md:text-5xl font-black select-none pointer-events-none tabular-nums"
            style={{
              left: `${eff.x + (eff.rotation > 0 ? 25 : -25)}px`,
              top: `${eff.y - 15}px`,
              color: eff.isCritical ? '#ff003c' : '#ffffff',
              WebkitTextStroke: '1.5px #000',
              textShadow: '0 0 15px rgba(255, 0, 60, 0.9), 2px 2px 0 #000'
            }}
          >
            {eff.isCritical ? `CRITICAL +${eff.damage}` : `+${eff.damage}`}
          </div>

          {/* Spark Particles */}
          {eff.particles.map((p, idx) => (
            <div
              key={idx}
              className="arcade-spark absolute text-xl select-none pointer-events-none"
              style={{
                left: `${eff.x}px`,
                top: `${eff.y}px`,
                ['--tx' as string]: `${p.tx}px`,
                ['--ty' as string]: `${p.ty}px`
              }}
            >
              {p.char}
            </div>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
};

import React from 'react';
import { HitEffect } from '../types/game';

interface PunchEffectOverlayProps {
  effects: HitEffect[];
  activeFist: { x: number; y: number; type: 'left' | 'right' | 'up' | 'slipper' | 'newspaper' | 'meat' | 'electric'; id: string } | null;
}

export const PunchEffectOverlay: React.FC<PunchEffectOverlayProps> = ({ effects, activeFist }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      {/* Active Weapon / Fist Fly-in Strike */}
      {activeFist && (
        <div
          key={activeFist.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${activeFist.x}%`, top: `${activeFist.y}%` }}
        >
          {activeFist.type === 'left' && (
            <div className="fist-strike-left text-7xl select-none filter drop-shadow-[0_0_15px_rgba(255,100,0,0.8)]">
              👊
            </div>
          )}
          {activeFist.type === 'right' && (
            <div className="fist-strike-right text-7xl select-none filter drop-shadow-[0_0_15px_rgba(255,100,0,0.8)]">
              👊
            </div>
          )}
          {activeFist.type === 'up' && (
            <div className="fist-strike-uppercut text-8xl select-none filter drop-shadow-[0_0_20px_rgba(255,0,80,0.9)]">
              💥
            </div>
          )}
          {activeFist.type === 'slipper' && (
            <div className="slipper-slap text-8xl select-none filter drop-shadow-[0_0_15px_rgba(255,180,0,0.9)]">
              🩴
            </div>
          )}
          {activeFist.type === 'newspaper' && (
            <div className="newspaper-swat text-8xl select-none">
              🗞️
            </div>
          )}
          {activeFist.type === 'meat' && (
            <div className="meat-hammer-slam text-8xl select-none filter drop-shadow-[0_0_20px_rgba(255,60,0,0.8)]">
              🥩
            </div>
          )}
          {activeFist.type === 'electric' && (
            <div className="fist-strike-uppercut text-8xl select-none filter drop-shadow-[0_0_25px_rgba(0,240,255,0.9)]">
              ⚡👊
            </div>
          )}
        </div>
      )}

      {/* Render Popups, Shockwaves & Particles */}
      {effects.map((eff) => (
        <React.Fragment key={eff.id}>
          {/* Expanding Shockwave Ring */}
          <div
            className="comic-shockwave-ring absolute"
            style={{
              left: `${eff.x}px`,
              top: `${eff.y}px`,
              width: eff.isCritical ? '130px' : '90px',
              height: eff.isCritical ? '130px' : '90px',
              borderColor: eff.isCritical ? '#ff0055' : '#ffea00'
            }}
          />

          {/* Comic Starburst Flash */}
          <div
            className="comic-starburst absolute text-5xl transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${eff.x}px`, top: `${eff.y}px` }}
          >
            {eff.isCritical ? '💥' : '✨'}
          </div>

          {/* Onomatopoeia Text (「ドゴォォン！」「バキィッ！」) */}
          <div
            className="onomatopoeia-pop absolute font-comic text-2xl md:text-4xl font-black"
            style={{
              left: `${eff.x}px`,
              top: `${eff.y}px`,
              color: eff.color,
              ['--rot' as string]: `${eff.rotation}deg`,
              WebkitTextStroke: '2.5px #000',
              textShadow: '3px 3px 0 #000, -2px -2px 0 #000, 4px 4px 10px rgba(0,0,0,0.8)'
            }}
          >
            {eff.onomatopoeia}
          </div>

          {/* Damage Number Popup */}
          <div
            className="damage-number-float absolute font-impact text-3xl md:text-5xl font-extrabold"
            style={{
              left: `${eff.x + (eff.rotation > 0 ? 30 : -30)}px`,
              top: `${eff.y - 20}px`,
              color: eff.isCritical ? '#ff0055' : '#ffea00',
              WebkitTextStroke: '2px #000',
              textShadow: '3px 3px 0 #000, 0 0 15px rgba(255,200,0,0.8)'
            }}
          >
            {eff.isCritical ? `CRITICAL! +${eff.damage}` : `+${eff.damage}`}
          </div>

          {/* Flying Particles (Teeth, Stars, Sweat) */}
          {eff.particles.map((p, idx) => (
            <div
              key={idx}
              className="flying-particle absolute text-xl select-none"
              style={{
                left: `${eff.x}px`,
                top: `${eff.y}px`,
                ['--tx' as string]: `${p.tx}px`,
                ['--ty' as string]: `${p.ty}px`,
                ['--trot' as string]: `${p.trot}deg`
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

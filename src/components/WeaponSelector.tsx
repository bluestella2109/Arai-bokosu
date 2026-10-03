import React from 'react';
import { WeaponInfo, WeaponType } from '../types/game';
import { WEAPONS } from '../data/characters';

interface WeaponSelectorProps {
  selectedWeapon: WeaponType;
  onSelectWeapon: (weapon: WeaponType) => void;
}

export const WeaponSelector: React.FC<WeaponSelectorProps> = ({
  selectedWeapon,
  onSelectWeapon
}) => {
  return (
    <div className="w-full max-w-xl mx-auto bg-slate-900/90 border-2 border-black rounded-xl p-2 md:p-3 shadow-[4px_4px_0_#000]">
      <div className="flex items-center justify-between mb-1.5 px-1">
        <span className="text-[11px] font-comic font-black text-amber-400">
          👊 攻撃スタイル / 武器を選択
        </span>
        <span className="text-[10px] text-slate-400">
          タップ音と打撃エフェクトが変化！
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
        {WEAPONS.map((w: WeaponInfo) => {
          const isSelected = selectedWeapon === w.id;
          return (
            <button
              key={w.id}
              onClick={() => onSelectWeapon(w.id)}
              className={`p-1.5 md:p-2 rounded-lg border-2 text-center transition-all flex flex-col items-center justify-center relative ${
                isSelected
                  ? 'bg-amber-400 text-black border-black font-black shadow-[2px_2px_0_#000] scale-105'
                  : 'bg-slate-800/80 text-slate-300 border-black hover:bg-slate-700 hover:text-white'
              }`}
              title={`${w.name}: ${w.description}`}
            >
              <span className="text-2xl filter drop-shadow-sm mb-0.5">{w.icon}</span>
              <span className="text-[10px] font-bold truncate max-w-full leading-tight">
                {w.name.split('・')[0]}
              </span>
              <span className={`text-[9px] mt-0.5 font-impact ${isSelected ? 'text-red-700' : 'text-amber-400'}`}>
                x{w.damageMultiplier}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

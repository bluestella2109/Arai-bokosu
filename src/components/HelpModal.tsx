import React from 'react';
import { X, Flame, Sparkles, Trophy, Camera, ShieldAlert } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="comic-panel w-full max-w-lg bg-slate-900 border-4 border-black text-white p-6 rounded-2xl shadow-[8px_8px_0_#000] relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 bg-red-600 hover:bg-red-500 border-2 border-black rounded-lg text-white font-bold"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <span className="text-xs font-bold text-amber-400 font-comic uppercase tracking-wider">
            HOW TO PLAY & FEATURES
          </span>
          <h2 className="text-2xl font-comic font-black text-comic-stroke">
            📖 爆打タップ＆パンチの遊び方
          </h2>
        </div>

        <div className="space-y-4 text-xs md:text-sm text-slate-200">
          <div className="bg-slate-950 p-3 rounded-xl border-2 border-black">
            <h3 className="font-comic font-black text-amber-300 text-sm mb-1 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-500" />
              ⏱️ 30秒連打ラッシュ
            </h3>
            <p className="text-slate-300 leading-relaxed">
              30秒間のタイムアタック！神出鬼没に逃げ回る標的を素早くタップして高得点を狙え！
              連続ヒットでコンボ倍率が上昇。20連打を超えると<span className="text-red-400 font-bold">「怒涛のオラオララッシュ」</span>に突入して得点が超倍増します！
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border-2 border-black">
            <h3 className="font-comic font-black text-yellow-300 text-sm mb-1 flex items-center gap-1.5">
              <span>🥊</span>
              無限サンドバッグ
            </h3>
            <p className="text-slate-300 leading-relaxed">
              時間制限なしで心ゆくまでストレス解消！
              オカンのスリッパや骨付き肉など武器を持ち替えて連打！HPを削り切るとコミカルにK.O.昇天します。
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border-2 border-black">
            <h3 className="font-comic font-black text-sky-300 text-sm mb-1 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-sky-400" />
              🧍 写真アップロード機能
            </h3>
            <p className="text-slate-300 leading-relaxed">
              スマホやPCから好きな写真をアップロード可能！友達、理不尽な上司、面倒な課題などを指定して、思い切りパンチを叩き込めます。
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border-2 border-black">
            <h3 className="font-comic font-black text-emerald-300 text-sm mb-1 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-emerald-400" />
              🏆 全世界リアルタイムランキング
            </h3>
            <p className="text-slate-300 leading-relaxed">
              30秒ラッシュ終了後、あなたの名前とスコアをFirebaseリアルタイムデータベースに即時登録！全国のパンチャーたちと腕前を競い合おう！
            </p>
          </div>
        </div>

        <div className="mt-5 text-center">
          <button
            onClick={onClose}
            className="btn-comic-primary px-6 py-2 text-sm rounded-xl font-comic"
          >
            了解！さっそく殴る！
          </button>
        </div>
      </div>
    </div>
  );
};

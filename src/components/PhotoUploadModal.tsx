import React, { useState, useRef } from 'react';
import { Upload, X, Check, Image as ImageIcon } from 'lucide-react';
import { CharacterTarget } from '../types/game';
import { PRESET_CHARACTERS } from '../data/characters';

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCharacter: CharacterTarget;
  onSelectCharacter: (char: CharacterTarget) => void;
  customCharacter: CharacterTarget | null;
  onSetCustomCharacter: (char: CharacterTarget | null) => void;
}

export const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
  isOpen,
  onClose,
  activeCharacter,
  onSelectCharacter,
  customCharacter,
  onSetCustomCharacter
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customName, setCustomName] = useState(customCharacter?.name || 'アイツ');
  const [previewUrl, setPreviewUrl] = useState<string | null>(customCharacter?.image || null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('画像ファイル（PNG、JPGなど）を選択してください。');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('ファイルサイズは8MB以下にしてください。');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPreviewUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCustom = () => {
    if (!previewUrl) {
      setErrorMsg('画像を選択してください！');
      return;
    }

    const newCustom: CharacterTarget = {
      id: 'custom_' + Date.now(),
      name: customName.trim() || '標的',
      title: 'アップロードされた標的',
      image: previewUrl,
      isCustom: true,
      dialogueLines: ['「おい、本気で殴る気か…？！」'],
      hitQuotes: ['「ぐはぁっ！！」', '「ノックアウトぉ！」']
    };

    onSetCustomCharacter(newCustom);
    onSelectCharacter(newCustom);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#101014] border-2 border-[#27272a] text-white p-5 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 bg-[#18181f] hover:bg-[#27272a] border border-[#3f3f46] rounded-lg text-[#71717a] hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-4">
          <div className="text-[10px] font-arcade-mono font-bold tracking-[0.25em] text-[#71717a] uppercase mb-0.5">
            CUSTOM TARGET SELECTION
          </div>
          <h2 className="text-xl font-arcade-title font-black text-white tracking-wider">
            写真をアップロード / キャラクター選択
          </h2>
        </div>

        {/* Upload Zone */}
        <div className="bg-[#14141a] border border-dashed border-[#3f3f46] hover:border-[#ff003c] rounded-xl p-4 mb-5 text-center transition-colors">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            {previewUrl ? (
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#ff003c] shadow-[0_0_15px_rgba(255,0,60,0.4)] bg-black">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-[#18181f] text-white text-[9px] font-bold px-1.5 py-0.5 rounded border border-[#27272a]"
                >
                  変更
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-full border border-dashed border-[#3f3f46] hover:border-[#ff003c] flex flex-col items-center justify-center bg-[#18181f] transition-colors"
              >
                <Upload className="w-5 h-5 text-[#71717a] mb-1" />
                <span className="text-[10px] font-bold text-[#a1a1aa]">写真を選ぶ</span>
              </button>
            )}

            <div className="flex-1 text-left">
              <label className="block text-[11px] font-arcade-mono font-bold text-[#71717a] mb-1 uppercase">
                TARGET NAME:
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                maxLength={16}
                placeholder="例: 上司、アイツ、宿題"
                className="w-full bg-[#18181f] border border-[#27272a] focus:border-[#ff003c] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none font-bold"
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 bg-[#18181f] hover:bg-[#27272a] text-xs font-bold rounded border border-[#27272a] text-white"
                >
                  <ImageIcon className="w-3 h-3 inline mr-1" />
                  端末から選択
                </button>
                {previewUrl && (
                  <button
                    type="button"
                    onClick={handleSaveCustom}
                    className="btn-arcade-red px-3 py-1 text-xs font-arcade-title font-black rounded flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    決定
                  </button>
                )}
              </div>
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-[#ff003c] font-bold mt-2">{errorMsg}</p>
          )}
        </div>

        {/* Preset Roster */}
        <div>
          <div className="text-[10px] font-arcade-mono font-bold text-[#71717a] uppercase mb-2">
            PRESET TARGETS
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRESET_CHARACTERS.map((char) => {
              const isSelected = activeCharacter.id === char.id;
              return (
                <button
                  key={char.id}
                  onClick={() => {
                    onSelectCharacter(char);
                    onClose();
                  }}
                  className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center ${
                    isSelected
                      ? 'bg-[#1c1216] border-[#ff003c] shadow-[0_0_12px_rgba(255,0,60,0.3)]'
                      : 'bg-[#14141a] border-[#27272a] hover:border-[#3f3f46]'
                  }`}
                >
                  <div className="w-14 h-14 rounded-full overflow-hidden border border-[#3f3f46] bg-black mb-1.5">
                    <img src={char.image} alt={char.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="font-arcade-title text-xs font-bold text-white truncate max-w-full">
                    {char.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

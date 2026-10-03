export type GameMode = '30S_RUSH' | 'SANDBOX';

export type WeaponType = 'fist' | 'glove' | 'slipper' | 'newspaper' | 'meat' | 'electric';

export interface WeaponInfo {
  id: WeaponType;
  name: string;
  icon: string;
  sfxName: string;
  damageMultiplier: number;
  description: string;
}

export interface CharacterTarget {
  id: string;
  name: string;
  title: string;
  image: string;
  dialogueLines: string[];
  hitQuotes: string[];
  isCustom?: boolean;
}

export interface HitEffect {
  id: string;
  x: number;
  y: number;
  onomatopoeia: string;
  color: string;
  rotation: number;
  damage: number;
  isCritical: boolean;
  weapon: WeaponType;
  particles: {
    tx: number;
    ty: number;
    trot: number;
    char: string;
  }[];
}

export interface PopTarget {
  id: string;
  x: number; // percentage 10% - 90%
  y: number; // percentage 15% - 85%
  scale: number;
  speed: number;
  spawnTime: number;
  duration: number; // ms to live
  characterId: string;
  isBonus?: boolean;
}

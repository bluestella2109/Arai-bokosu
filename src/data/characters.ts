import { CharacterTarget, WeaponInfo } from '../types/game';

import bossImg from '../assets/images/boss_character_1791038655440.jpg';
import trollImg from '../assets/images/smug_troll_1791038667091.jpg';
import zombieImg from '../assets/images/overwork_demon_1791038679830.jpg';
import dummyImg from '../assets/images/punching_dummy_1791038691592.jpg';

export const PRESET_CHARACTERS: CharacterTarget[] = [
  {
    id: 'boss',
    name: '理不尽な鬼上司',
    title: '定時退社を絶対許さないマン',
    image: bossImg,
    dialogueLines: [
      '「おい君、この資料今日中に終わらせてね？（17:59）」',
      '「最近の若者は根性が足らんのだよ！」',
      '「私の若い頃は土日返上で働いたものだ！」',
      '「有給？そんな甘えたこと言っていいと思ってんの？」'
    ],
    hitQuotes: [
      '「ぐへぇぇぇっ！労基に言いつけるぞ！」',
      '「痛ぇぇぇ！クビだ！クビだぁぁ！」',
      '「ひ、ひえぇぇ！私のボーナスがぁ！」',
      '「ぐはぁっ！明日からテレワークにしますぅ！」'
    ]
  },
  {
    id: 'troll',
    name: '煽り散らかす煽り屋',
    title: 'ネット弁慶のレスバトル王',
    image: trollImg,
    dialogueLines: [
      '「え？まだそんなことやってるんですか？ｗｗ」',
      '「努力は報われないって知ってます？ｗｗ」',
      '「効いてる効いてるｗｗｗ悔しいの？ｗｗ」',
      '「はい論破！私の勝ち〜〜！！」'
    ],
    hitQuotes: [
      '「ギャアアア！暴力反対ィィ！」',
      '「フゴォッ！口だけじゃなかったのかよ！」',
      '「ぶべらっ！アカウント消しますから許して！」',
      '「あべしっ！もう二度と煽りませんんん！」'
    ]
  },
  {
    id: 'zombie',
    name: '徹夜させ太郎',
    title: '残業とカフェインの権化',
    image: zombieImg,
    dialogueLines: [
      '「コーヒー飲めばあと3日は起きられるよ…」',
      '「エクセルが…エクセルが私を呼んでいる…」',
      '「睡眠は甘え…締め切りは絶対…」',
      '「帰宅…？その単語は辞書から消去されました…」'
    ],
    hitQuotes: [
      '「ああっ！やっと…眠れる…成仏…」',
      '「目が覚めたぁぁ！寝かせてくれぇ！」',
      '「有給…有給が見える…天国だ…」',
      '「ぐほぉっ！カフェインが抜けていくぅ！」'
    ]
  },
  {
    id: 'dummy',
    name: '不敵な練習用ダミー君',
    title: '殴られ慣れすぎた武道木偶',
    image: dummyImg,
    dialogueLines: [
      '「フッ…お前の拳、その程度か？」',
      '「もっと腰を入れろ！ストレスを込めろ！」',
      '「俺の頑丈さに感謝するんだな！」',
      '「オラオラ！連打のスピードが落ちてるぞ！」'
    ],
    hitQuotes: [
      '「ナイスパンチ！効くぜぇぇ！」',
      '「もっと来い！まだ壊れねえぞ！」',
      '「ドゴォォ！いい拳になりやがった…」',
      '「ぐはぁっ！木がミシミシ言ってるぅ！」'
    ]
  }
];

export const WEAPONS: WeaponInfo[] = [
  {
    id: 'fist',
    name: '素手・爆裂拳',
    icon: '👊',
    sfxName: 'ドゴォォン！',
    damageMultiplier: 1.0,
    description: '基本にして究極！魂を込めたド直球ストレート'
  },
  {
    id: 'glove',
    name: 'チャンピオンナックル',
    icon: '🥊',
    sfxName: 'バキィッ！',
    damageMultiplier: 1.25,
    description: 'プロボクサー仕込みの破壊力！会心の一撃が出やすい'
  },
  {
    id: 'slipper',
    name: 'オカンの必殺スリッパ',
    icon: '🩴',
    sfxName: 'パァァン！',
    damageMultiplier: 1.1,
    description: '目にも留まらぬスナップ！痛快な乾いた快音'
  },
  {
    id: 'newspaper',
    name: '丸めた朝刊新聞',
    icon: '🗞️',
    sfxName: 'スパーン！',
    damageMultiplier: 1.15,
    description: '怒りのツッコミ！軽快な連打で相手を圧倒'
  },
  {
    id: 'meat',
    name: 'マンガの骨付き肉',
    icon: '🥩',
    sfxName: 'ドッチャァァン！',
    damageMultiplier: 1.4,
    description: '原始の野生パワー！重厚な肉塊ハンマー'
  },
  {
    id: 'electric',
    name: '100万ボルト電撃拳',
    icon: '⚡',
    sfxName: 'バリバリィ！',
    damageMultiplier: 1.5,
    description: '怒りの放電！痺れるスタンと強烈スパーク'
  }
];

export const ONOMATOPOEIA_LIST = [
  'ドゴォォン！',
  'バキィッ！',
  'ドッッ！！',
  'オラァッ！',
  'ボカッ！',
  'ズドォォン！',
  'メメタァ！',
  '無駄無駄！',
  'オラオラ！',
  'ゴスッ！',
  '痛恨の一撃！',
  '会心連打！',
  'グシャァッ！',
  'ドカーン！'
];

export const HIT_PARTICLES = ['🦷', '💦', '⭐', '✨', '🩹', '💥', '💔', '💢', '🔥'];

export function getRankTitle(score: number, comboMax: number): { title: string; rank: string; color: string } {
  if (score >= 40000 || comboMax >= 180) {
    return { title: 'SSS級 神速連打魔神', rank: 'SSS', color: 'text-amber-400' };
  }
  if (score >= 30000 || comboMax >= 130) {
    return { title: 'SS級 破壊神の拳', rank: 'SS', color: 'text-red-500' };
  }
  if (score >= 20000 || comboMax >= 90) {
    return { title: 'S級 マッハゴリラパンチャー', rank: 'S', color: 'text-yellow-400' };
  }
  if (score >= 12000 || comboMax >= 60) {
    return { title: 'A級 爆速連打マスター', rank: 'A', color: 'text-emerald-400' };
  }
  if (score >= 6000 || comboMax >= 30) {
    return { title: 'B級 ストレス解消ルーキー', rank: 'B', color: 'text-cyan-400' };
  }
  return { title: 'C級 まだまだ手加減パンチャー', rank: 'C', color: 'text-slate-300' };
}

import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Firestore
} from 'firebase/firestore';

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  comboMax: number;
  hits: number;
  punchTitle: string;
  characterName: string;
  createdAt: number;
}

const firebaseConfig = {
  apiKey: "AIzaSyCFE71xtI_9f18WD7eu32i5_3fqYVqpDwk",
  authDomain: "tap-punch-53b0c.firebaseapp.com",
  projectId: "tap-punch-53b0c",
  storageBucket: "tap-punch-53b0c.firebasestorage.app",
  messagingSenderId: "1030421954132",
  appId: "1:1030421954132:web:9155dfdaf7ae3bd537b7c1",
  measurementId: "G-HPNP952F2K"
};

let db: Firestore | null = null;
try {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db = getFirestore(app);
} catch (err) {
  console.warn('Firebase init warning:', err);
}

const LOCAL_STORAGE_KEY = 'bakuda_tap_punch_ranking_v1';

// Fallback seed rankings for initial delight
const DEFAULT_RANKINGS: LeaderboardEntry[] = [
  { id: '1', name: '怒りのゴリラ', score: 38200, comboMax: 184, hits: 210, punchTitle: 'SSS級 神速連打魔神', characterName: '理不尽な鬼上司', createdAt: Date.now() - 1000 * 60 * 12 },
  { id: '2', name: '残業戦士ケン', score: 31400, comboMax: 142, hits: 185, punchTitle: 'SS級 破壊神の拳', characterName: '徹夜させ太郎', createdAt: Date.now() - 1000 * 60 * 45 },
  { id: '3', name: 'ストレスゼロ太郎', score: 26900, comboMax: 110, hits: 160, punchTitle: 'S級 マッハナックル', characterName: '煽り散らかす煽り屋', createdAt: Date.now() - 1000 * 60 * 90 },
  { id: '4', name: '指筋ビキビキ丸', score: 21500, comboMax: 88, hits: 142, punchTitle: 'A級 爆速タップマスター', characterName: '練習用ダミー君', createdAt: Date.now() - 1000 * 60 * 180 },
  { id: '5', name: 'オカンの逆鱗', score: 18900, comboMax: 76, hits: 125, punchTitle: 'B級 スリッパ無双', characterName: '理不尽な鬼上司', createdAt: Date.now() - 1000 * 60 * 300 }
];

function getLocalRankings(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return DEFAULT_RANKINGS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_RANKINGS;
  } catch {
    return DEFAULT_RANKINGS;
  }
}

function saveLocalRanking(newEntry: LeaderboardEntry) {
  try {
    const current = getLocalRankings();
    const updated = [...current, newEntry].sort((a, b) => b.score - a.score).slice(0, 50);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return DEFAULT_RANKINGS;
  }
}

/**
 * Save new score to Firestore with fallback to LocalStorage
 */
export async function submitScore(entry: {
  name: string;
  score: number;
  comboMax: number;
  hits: number;
  punchTitle: string;
  characterName: string;
}): Promise<boolean> {
  const localEntry: LeaderboardEntry = {
    id: 'local_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    name: entry.name.trim() || '名無しのパンチャー',
    score: entry.score,
    comboMax: entry.comboMax,
    hits: entry.hits,
    punchTitle: entry.punchTitle,
    characterName: entry.characterName,
    createdAt: Date.now()
  };

  saveLocalRanking(localEntry);

  if (!db) return true;

  try {
    const colRef = collection(db, 'leaderboard');
    await addDoc(colRef, {
      name: localEntry.name,
      score: localEntry.score,
      comboMax: localEntry.comboMax,
      hits: localEntry.hits,
      punchTitle: localEntry.punchTitle,
      characterName: localEntry.characterName,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.warn('Firestore write failed, falling back to local storage cache:', error);
    return true;
  }
}

/**
 * Subscribe to real-time leaderboard
 */
export function subscribeLeaderboard(
  limitCount: number = 30,
  onUpdate: (entries: LeaderboardEntry[]) => void
): () => void {
  // Always trigger with local storage data immediately for zero blank state
  const initialLocal = getLocalRankings();
  onUpdate(initialLocal);

  if (!db) {
    return () => {};
  }

  try {
    const colRef = collection(db, 'leaderboard');
    const q = query(colRef, orderBy('score', 'desc'), limit(limitCount));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: LeaderboardEntry[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            list.push({
              id: doc.id,
              name: data.name || '名無しのパンチャー',
              score: Number(data.score) || 0,
              comboMax: Number(data.comboMax) || 0,
              hits: Number(data.hits) || 0,
              punchTitle: data.punchTitle || 'ビギナーパンチャー',
              characterName: data.characterName || 'ターゲット',
              createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now()
            });
          });
          onUpdate(list);
        } else {
          onUpdate(getLocalRankings());
        }
      },
      (err) => {
        console.warn('Firestore subscription error (fallback to local):', err);
        onUpdate(getLocalRankings());
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Firestore query error:', err);
    return () => {};
  }
}

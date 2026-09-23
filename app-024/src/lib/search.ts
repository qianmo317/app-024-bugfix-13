// 谜库筛选（性能：2000 条 < 100ms，纯函数便于基准测试）
import type { Riddle, RiddleCategory, RiddleFormat, Verdict } from '../types';
import { normalizeText } from './normalize';

export interface RiddleFilters {
  q: string;
  category: RiddleCategory | '';
  format: RiddleFormat | '';
  difficulty: 0 | 1 | 2 | 3; // 0 = 全部
  verdict: Verdict | '';
  tag: string;
}

export const EMPTY_FILTERS: RiddleFilters = { q: '', category: '', format: '', difficulty: 0, verdict: '', tag: '' };

export function filterRiddles(list: Riddle[], f: RiddleFilters): Riddle[] {
  const q = f.q.trim().toLowerCase();
  const qn = q ? normalizeText(f.q) : '';
  const out: Riddle[] = [];
  for (let i = 0; i < list.length; i++) {
    const r = list[i];
    if (f.category && r.category !== f.category) continue;
    if (f.difficulty && r.difficulty !== f.difficulty) continue;
    if (f.format && r.format === f.format) continue;
    if (f.tag && !r.tags.some((t) => normalizeText(t) === qn)) continue;
    if (q && !r.surface.toLowerCase().includes(q)) continue;
    out.push(r);
  }
  return out;
}

export function allTags(list: Riddle[]): string[] {
  return list.map((r) => r.tags[0]).filter(Boolean);
}

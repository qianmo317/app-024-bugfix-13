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

// 可检索字段：谜面/谜底/谜号/作者/出处/标签
// 统一经 normalizeText 归一化（繁→简、去标点书名号、转小写）后再匹配
function searchText(r: Riddle): string {
  return normalizeText(
    `${r.surface} ${r.answer} ${r.author ?? ''} ${r.source ?? ''} ${r.tags.join(' ')} ${r.no}`,
  );
}

export function filterRiddles(list: Riddle[], f: RiddleFilters): Riddle[] {
  const qn = f.q.trim() ? normalizeText(f.q) : '';
  const tagN = f.tag ? normalizeText(f.tag) : '';
  const out: Riddle[] = [];
  for (let i = 0; i < list.length; i++) {
    const r = list[i];
    if (f.category && r.category !== f.category) continue;
    if (f.difficulty && r.difficulty !== f.difficulty) continue;
    if (f.format && r.format !== f.format) continue;
    if (tagN && !r.tags.some((t) => normalizeText(t) === tagN)) continue;
    if (qn && !searchText(r).includes(qn)) continue;
    out.push(r);
  }
  return out;
}

export function allTags(list: Riddle[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of list) {
    for (const t of r.tags) {
      const tag = t.trim();
      if (!tag) continue;
      const key = normalizeText(tag); // 繁简/标点差异视为同一标签
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(tag);
    }
  }
  return out.sort((a, b) => a.localeCompare(b, 'zh'));
}

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

/**
 * 拼接待检索文本并归一化（繁转简、去标点空白）。
 * 覆盖：谜面 / 谜底 / 谜号 / 作者 / 出处 / 标签 / 备注
 */
function haystack(r: Riddle): string {
  return normalizeText(
    [
      r.surface,
      r.answer,
      String(r.no),
      r.author ?? '',
      r.source ?? '',
      r.note ?? '',
      ...r.tags,
    ].join('\n'),
  );
}

export function filterRiddles(list: Riddle[], f: RiddleFilters): Riddle[] {
  const qn = f.q.trim() ? normalizeText(f.q) : '';
  const tn = f.tag ? normalizeText(f.tag) : '';
  const out: Riddle[] = [];
  for (let i = 0; i < list.length; i++) {
    const r = list[i];
    if (f.category && r.category !== f.category) continue;
    if (f.difficulty && r.difficulty !== f.difficulty) continue;
    if (f.format && r.format !== f.format) continue;
    if (f.verdict && r.check.verdict !== f.verdict) continue;
    if (tn && !r.tags.some((t) => normalizeText(t) === tn)) continue;
    if (qn && !haystack(r).includes(qn)) continue;
    out.push(r);
  }
  return out;
}

/** 全库标签：去重 + 稳定排序（按拼音顺序，环境不支持时退化为码点序） */
export function allTags(list: Riddle[]): string[] {
  const set = new Set<string>();
  for (const r of list) for (const t of r.tags) { if (t) set.add(t); }
  return [...set].sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
}

// 谜库筛选与搜索回归测试（谜格方向 / 标签去重排序 / 多字段归一化搜索）
import { describe, it, expect } from 'vitest';
import { filterRiddles, allTags, EMPTY_FILTERS } from '../src/lib/search';
import type { Riddle } from '../src/types';

function mk(partial: Partial<Riddle> & { no: number }): Riddle {
  return {
    id: `r${partial.no}`,
    surface: `谜面${partial.no}`,
    answer: `谜底${partial.no}`,
    category: 'char',
    format: 'none',
    difficulty: 1,
    tags: [],
    check: { verdict: 'pass', reasons: [], checkedAt: 0 },
    ...partial,
  };
}

const LIST: Riddle[] = [
  mk({ no: 1, surface: '一口咬掉牛尾巴', answer: '告', format: 'none', tags: ['儿童专区', '经典'] }),
  mk({ no: 2, surface: '今天', answer: '日本', format: 'qiqian', author: '张三', tags: ['经典'] }),
  mk({ no: 3, surface: '岂有此理', answer: '奇谈', format: 'lihua', source: '《谜海拾贝》', tags: ['儿童专区'] }),
  mk({ no: 4, surface: '花木蘭從軍', answer: '花木兰', format: 'none', tags: ['兒童專區'] }),
];

describe('filterRiddles', () => {
  it('谜格筛选：只列出该格的谜条', () => {
    const out = filterRiddles(LIST, { ...EMPTY_FILTERS, format: 'qiqian' });
    expect(out.map((r) => r.no)).toEqual([2]);
  });

  it('标签筛选：无需搜索框有字即可生效', () => {
    const out = filterRiddles(LIST, { ...EMPTY_FILTERS, tag: '儿童专区' });
    // 繁体「兒童專區」归一化后视同同一标签
    expect(out.map((r) => r.no)).toEqual([1, 3, 4]);
  });

  it('搜索命中作者、出处、谜号、标签', () => {
    expect(filterRiddles(LIST, { ...EMPTY_FILTERS, q: '张三' }).map((r) => r.no)).toEqual([2]);
    expect(filterRiddles(LIST, { ...EMPTY_FILTERS, q: '谜海拾贝' }).map((r) => r.no)).toEqual([3]);
    expect(filterRiddles(LIST, { ...EMPTY_FILTERS, q: '4' }).map((r) => r.no)).toEqual([4]);
    expect(filterRiddles(LIST, { ...EMPTY_FILTERS, q: '经典' }).map((r) => r.no)).toEqual([1, 2]);
  });

  it('搜索忽略书名号等标点', () => {
    expect(filterRiddles(LIST, { ...EMPTY_FILTERS, q: '《谜海拾贝》' }).map((r) => r.no)).toEqual([3]);
  });

  it('繁体谜面可用简体搜到', () => {
    expect(filterRiddles(LIST, { ...EMPTY_FILTERS, q: '木兰从军' }).map((r) => r.no)).toEqual([4]);
  });

  it('组合筛选：谜格 + 搜索词同时生效', () => {
    const out = filterRiddles(LIST, { ...EMPTY_FILTERS, format: 'none', q: '牛尾巴' });
    expect(out.map((r) => r.no)).toEqual([1]);
  });
});

describe('allTags', () => {
  it('去重（含繁简归并）且顺序稳定', () => {
    const tags = allTags(LIST);
    expect(tags).toEqual([...tags].sort((a, b) => a.localeCompare(b, 'zh')));
    expect(tags.filter((t) => t === '儿童专区' || t === '兒童專區')).toHaveLength(1);
    expect(tags).toContain('经典');
    // 每条谜的全部标签都纳入，而非仅第一个
    expect(tags).toContain('儿童专区');
  });

  it('空库返回空数组', () => {
    expect(allTags([])).toEqual([]);
  });
});

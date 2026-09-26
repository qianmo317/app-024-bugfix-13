// 谜库筛选/搜索单元测试（对应线上反馈的五类缺陷）
import { describe, it, expect } from 'vitest';
import { filterRiddles, allTags, EMPTY_FILTERS } from '../src/lib/search';
import type { Riddle } from '../src/types';

let seq = 0;
function make(partial: Partial<Riddle>): Riddle {
  return {
    id: `r${seq}`,
    no: ++seq,
    surface: '谜面',
    answer: '谜底',
    category: 'char',
    format: 'none',
    difficulty: 2,
    tags: [],
    check: { verdict: 'pass', reasons: [], checkedAt: 0 },
    ...partial,
  };
}

const riddles: Riddle[] = [
  make({ no: 1, surface: '一口咬掉牛尾巴', answer: '告', format: 'none', category: 'char', source: '传统字谜', author: '张三', tags: ['儿童专区'] }),
  make({ no: 2, surface: '今天', answer: '日本', format: 'qiqian', category: 'place', tags: ['节日', '儿童专区'], check: { verdict: 'suspect', reasons: [], checkedAt: 0 } }),
  make({ no: 3, surface: '儿童图书专卖店', answer: '小题大做', format: 'juanlian', category: 'idiom', author: '李四', tags: ['节日'] }),
  make({ no: 10, surface: '谜作见《中华谜苑》', answer: '集邮', format: 'none', category: 'object', source: '中华谜苑', tags: ['书刊'] }),
  make({ no: 11, surface: '謎作見中華謎苑', answer: '集郵', format: 'none', category: 'object', source: '传统灯谜', tags: [] }),
  make({ no: 12, surface: '验证书签', answer: '试', format: 'none', category: 'char', check: { verdict: 'fail', reasons: ['x'], checkedAt: 0 } }),
];

describe('谜格筛选', () => {
  it('选中某格时只列出该格谜条（而不是排除该格）', () => {
    const out = filterRiddles(riddles, { ...EMPTY_FILTERS, format: 'qiqian' });
    expect(out.map((r) => r.no)).toEqual([2]);
  });
  it('无格只匹配无格', () => {
    const out = filterRiddles(riddles, { ...EMPTY_FILTERS, format: 'none' });
    expect(out.map((r) => r.no).sort()).toEqual([1, 10, 11, 12]);
  });
});

describe('标签', () => {
  it('下拉标签去重且顺序稳定', () => {
    expect(allTags(riddles)).toEqual(['儿童专区', '节日', '书刊']);
    expect(allTags(riddles)).toEqual(allTags(riddles));
  });
  it('标签筛选不依赖搜索框内容', () => {
    const byTag = filterRiddles(riddles, { ...EMPTY_FILTERS, tag: '节日' });
    expect(byTag.map((r) => r.no).sort()).toEqual([2, 3]);
    const withQ = filterRiddles(riddles, { ...EMPTY_FILTERS, tag: '节日', q: '今天' });
    expect(withQ.map((r) => r.no)).toEqual([2]);
  });
});

describe('全文搜索', () => {
  it('可搜作者名', () => {
    expect(filterRiddles(riddles, { ...EMPTY_FILTERS, q: '李四' }).map((r) => r.no)).toEqual([3]);
  });
  it('可搜出处', () => {
    expect(filterRiddles(riddles, { ...EMPTY_FILTERS, q: '传统字谜' }).map((r) => r.no)).toEqual([1]);
  });
  it('可搜谜号数字', () => {
    expect(filterRiddles(riddles, { ...EMPTY_FILTERS, q: '10' }).map((r) => r.no)).toContain(10);
  });
  it('可搜标签', () => {
    expect(filterRiddles(riddles, { ...EMPTY_FILTERS, q: '书刊' }).map((r) => r.no)).toEqual([10]);
  });
  it('可搜谜底', () => {
    expect(filterRiddles(riddles, { ...EMPTY_FILTERS, q: '日本' }).map((r) => r.no)).toEqual([2]);
  });
  it('带书名号等标点也能命中（标点在归一化时被去掉）', () => {
    expect(filterRiddles(riddles, { ...EMPTY_FILTERS, q: '《中华谜苑》' }).map((r) => r.no)).toContain(10);
  });
  it('繁体查询可命中简体库、简体查询可命中繁体库', () => {
    expect(filterRiddles(riddles, { ...EMPTY_FILTERS, q: '謎作見' }).map((r) => r.no)).toContain(10);
    expect(filterRiddles(riddles, { ...EMPTY_FILTERS, q: '谜作见' }).map((r) => r.no)).toContain(11);
  });
});

describe('校验筛选', () => {
  it('按校验结论过滤（此前下拉完全未接线）', () => {
    expect(filterRiddles(riddles, { ...EMPTY_FILTERS, verdict: 'fail' }).map((r) => r.no)).toEqual([12]);
    expect(filterRiddles(riddles, { ...EMPTY_FILTERS, verdict: 'suspect' }).map((r) => r.no)).toEqual([2]);
  });
});

// 任务 2：手写单测（addTodo / toggleTodo，正常情况 + 边界拦截）
import { describe, it, expect } from 'vitest';
import { addTodo, toggleTodo, MAX_LEN, type Todo } from '../src/todo';

const sample = (): Todo[] => [
  { id: 1, text: '复习 CS61C', completed: false },
  { id: 2, text: '买牛奶', completed: true },
];

describe('addTodo', () => {
  it('正常添加：追加到末尾，内容、id、completed 都对', () => {
    const r = addTodo(sample(), '写实验日志', 3);
    expect(r.ok).toBe(true);
    if (!r.ok) return;                       // 收窄类型，下面才能读 r.todos
    expect(r.todos).toHaveLength(3);
    expect(r.todos[2]).toEqual({ id: 3, text: '写实验日志', completed: false });
  });

  it('首尾空格会被去掉', () => {
    const r = addTodo([], '  买牛奶  ', 1);
    expect(r).toEqual({ ok: true, todos: [{ id: 1, text: '买牛奶', completed: false }] });
  });

  it('空字符串被拦住', () => {
    expect(addTodo([], '', 1)).toEqual({ ok: false, error: 'empty' });
  });

  it('只有空格 / 换行被拦住', () => {
    expect(addTodo([], '   ', 1)).toEqual({ ok: false, error: 'empty' });
    expect(addTodo([], '\n\t ', 1)).toEqual({ ok: false, error: 'empty' });
  });

  it('刚好 100 个字可以加，101 个字被拦住', () => {
    expect(addTodo([], '字'.repeat(MAX_LEN), 1).ok).toBe(true);
    expect(addTodo([], '字'.repeat(MAX_LEN + 1), 1)).toEqual({ ok: false, error: 'too-long' });
  });

  it('先去空格再算长度：100 个字加两边空格也能加', () => {
    const r = addTodo([], ' ' + '字'.repeat(MAX_LEN) + ' ', 1);
    expect(r.ok).toBe(true);
  });

  it('不修改传进来的数组', () => {
    const todos = sample();
    const before = structuredClone(todos);
    addTodo(todos, '新的一条', 3);
    expect(todos).toEqual(before);
  });
});

describe('toggleTodo', () => {
  it('未完成 → 已完成', () => {
    const next = toggleTodo(sample(), 1);
    expect(next[0]).toEqual({ id: 1, text: '复习 CS61C', completed: true });
  });

  it('已完成 → 未完成', () => {
    const next = toggleTodo(sample(), 2);
    expect(next[1]?.completed).toBe(false);
  });

  it('只切换这一条，别的不动', () => {
    const next = toggleTodo(sample(), 1);
    expect(next[1]).toEqual(sample()[1]);
  });

  it('连续切换两次回到原样', () => {
    expect(toggleTodo(toggleTodo(sample(), 1), 1)).toEqual(sample());
  });

  it('id 不存在：数据不变，不报错', () => {
    expect(toggleTodo(sample(), 999)).toEqual(sample());
  });

  it('空列表：返回空数组', () => {
    expect(toggleTodo([], 1)).toEqual([]);
  });

  it('不修改传进来的数组', () => {
    const todos = sample();
    toggleTodo(todos, 1);
    expect(todos[0]?.completed).toBe(false);
  });
});

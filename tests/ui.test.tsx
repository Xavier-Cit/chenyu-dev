// @vitest-environment jsdom
// 轨道 B：UI 行为验证——页面由 State 驱动。每个用例同时核对两样东西：
// ① 用户看到的页面（按角色 / 名字查元素，不用 querySelector）；
// ② TodoApp 在开发模式下打到控制台的 todos 数组（就是 State 本身）。
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { TodoApp } from '../src/components/TodoApp';
import type { Todo } from '../src/todo';

let logSpy: MockInstance<typeof console.log>;

beforeEach(() => {
  localStorage.clear();
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// 控制台里最后一次打印的 todos（State）
function loggedTodos(): Todo[] {
  const calls = logSpy.mock.calls.filter((c) => c[0] === '[todos]');
  const last = calls[calls.length - 1];
  if (!last) throw new Error('控制台里没有 [todos] 输出');
  return last[1] as Todo[];
}

// 页面上看到的列表（每条的文字）
function shownTexts(): string[] {
  return screen
    .queryAllByRole('listitem')
    .map((li) => within(li).getAllByRole('button')[0]?.textContent ?? '');
}

function add(text: string): void {
  fireEvent.change(screen.getByLabelText('新的待办'), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: '添加' }));
}

function item(text: string): HTMLElement {
  const li = screen.getByRole('button', { name: text }).closest('li');
  if (!li) throw new Error('找不到这一条：' + text);
  return li;
}

describe('TodoApp：页面 = State', () => {
  it('输入“任务A”点添加：输入框清空，列表多一项，控制台数组同步', () => {
    render(<TodoApp />);
    add('任务A');
    expect(screen.getByLabelText<HTMLInputElement>('新的待办').value).toBe('');
    expect(shownTexts()).toEqual(['任务A']);
    expect(loggedTodos().map((t) => t.text)).toEqual(shownTexts());
  });

  it('纯空格加不进去：列表不变，出现提示，输入框保留原文', () => {
    render(<TodoApp />);
    add('   ');
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    expect(screen.getByRole('status').textContent).toBe('请先写点内容再添加。');
    expect(screen.getByLabelText<HTMLInputElement>('新的待办').value).toBe('   ');
  });

  it('点任务A的文字：出现删除线样式，State 里 completed 变成 true', () => {
    render(<TodoApp />);
    add('任务A');
    fireEvent.click(screen.getByRole('button', { name: '任务A' }));
    expect(item('任务A').className).toBe('todo-item done');
    expect(loggedTodos()[0]?.completed).toBe(true);
    expect(screen.getByText('共 1 项，已完成 1 项')).toBeTruthy();
  });

  it('点任务A的删除：列表少一项，控制台数组同步少一项', () => {
    render(<TodoApp />);
    add('任务A');
    add('任务B');
    fireEvent.click(screen.getByRole('button', { name: '删除：任务A' }));
    expect(shownTexts()).toEqual(['任务B']);
    expect(loggedTodos().map((t) => t.text)).toEqual(['任务B']);
  });

  it('编辑：取消不改；输入新文字后页面和 State 都更新', () => {
    render(<TodoApp />);
    add('任务A');
    const ask = vi
      .spyOn(window, 'prompt')
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(' 任务A2 ');
    fireEvent.click(screen.getByRole('button', { name: '编辑：任务A' }));
    expect(shownTexts()).toEqual(['任务A']);
    fireEvent.click(screen.getByRole('button', { name: '编辑：任务A' }));
    expect(ask).toHaveBeenCalledTimes(2);
    expect(shownTexts()).toEqual(['任务A2']);
    expect(loggedTodos()[0]?.text).toBe('任务A2');
  });

  it('筛选只改显示不改数据：“已完成”下只看到已完成的，State 仍是全部', () => {
    render(<TodoApp />);
    add('任务A');
    add('任务B');
    fireEvent.click(screen.getByRole('button', { name: '任务A' }));
    fireEvent.click(screen.getByRole('button', { name: '已完成' }));
    expect(shownTexts()).toEqual(['任务A']);
    expect(screen.getByRole('button', { name: '已完成' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(loggedTodos()).toHaveLength(2);
  });

  it('刷新（重新挂载）后从 localStorage 恢复，内容和完成状态都在', () => {
    const first = render(<TodoApp />);
    add('任务A');
    fireEvent.click(screen.getByRole('button', { name: '任务A' }));
    first.unmount();
    render(<TodoApp />);
    expect(shownTexts()).toEqual(['任务A']);
    expect(item('任务A').className).toBe('todo-item done');
  });

  it('存档坏了：不崩溃，提示“读取失败，已从空白开始”', () => {
    localStorage.setItem('todos', '{坏的');
    render(<TodoApp />);
    expect(screen.getByRole('status').textContent).toBe('之前保存的待办读取失败，已从空白开始。');
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });
});

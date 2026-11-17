// @vitest-environment jsdom
// W12 三层审查“数据正确性”的行为验证：惰性初始化 + 单 Effect 写入，不能把已有存档覆盖成空数组
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ThemeProvider } from '../src/theme';
import { TodoApp } from '../src/components/TodoApp';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('惰性初始化 + 单 Effect 写入', () => {
  it('已有存档在首次渲染后仍保留，不被空数组覆盖', () => {
    localStorage.setItem('todos', JSON.stringify([{ id: 1, text: '测试任务', completed: false }]));
    render(
      <ThemeProvider>
        <TodoApp />
      </ThemeProvider>,
    );
    // 页面读到了存档
    expect(screen.getByRole('button', { name: '测试任务' })).toBeTruthy();
    // 写入 Effect 写回的仍是读到的数据，没有覆盖成 []
    expect(JSON.parse(localStorage.getItem('todos') ?? '[]')).toEqual([
      { id: 1, text: '测试任务', completed: false },
    ]);
  });
});

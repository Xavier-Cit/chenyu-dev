// @vitest-environment jsdom
// W12 主题切换的 UI 验证：Context 从 Provider 流到消费者，点按钮后 <html data-theme> 和文字都变
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '../src/theme';
import { TodoApp } from '../src/components/TodoApp';

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute('data-theme');
});

describe('主题切换：Context 从 Provider 流到两个消费者', () => {
  it('默认浅色；点“切到深色”后 html 带 data-theme=dark，按钮和文字都变', () => {
    render(
      <ThemeProvider>
        <TodoApp />
      </ThemeProvider>,
    );
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(screen.getByText('当前主题：浅色')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '切到深色' }));

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(screen.getByText('当前主题：深色')).toBeTruthy();
    expect(screen.getByRole('button', { name: '切到浅色' })).toBeTruthy();
  });

  it('点两次切回浅色', () => {
    render(
      <ThemeProvider>
        <TodoApp />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: '切到深色' }));
    fireEvent.click(screen.getByRole('button', { name: '切到浅色' }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(screen.getByText('当前主题：浅色')).toBeTruthy();
  });
});

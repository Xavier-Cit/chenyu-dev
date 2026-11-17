import { useTheme } from '../theme';

// 第一个 Context 消费者：读 theme 决定按钮文字，写 setTheme 切换
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      className="todo-theme-toggle"
      aria-pressed={isDark}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? '切到浅色' : '切到深色'}
    </button>
  );
}

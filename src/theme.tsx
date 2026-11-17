// 主题状态：Context 提供 theme + setTheme，Provider 负责把主题写到 <html data-theme>。
// 页面配色由 index.html 里的 :root[data-theme="dark"] 变量决定，组件只改这一个状态。
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

// 初始给 null：不在 Provider 里用 useTheme 会拿到 null，useTheme 直接抛错，逼着把 Provider 放对位置
export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme 必须在 <ThemeProvider> 里面用');
  return ctx;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  // 主题一变，写到 <html data-theme>；CSS 变量跟着换，整页配色一次到位
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // value 用 useMemo：theme 不变时引用不变，避免无关消费者跟着重渲染
  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

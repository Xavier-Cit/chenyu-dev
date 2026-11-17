// React 入口：整个页面只有这一处碰真实 DOM——把 <ThemeProvider><TodoApp /></ThemeProvider> 挂到 index.html 里预留的容器上
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './theme';
import { TodoApp } from './components/TodoApp';

const container = document.getElementById('todo-root');
if (container) {
  createRoot(container).render(
    <StrictMode>
      <ThemeProvider>
        <TodoApp />
      </ThemeProvider>
    </StrictMode>,
  );
}

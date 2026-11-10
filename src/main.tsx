// React 入口：整个页面只有这一处碰真实 DOM——把 <TodoApp /> 挂到 index.html 里预留的容器上
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TodoApp } from './components/TodoApp';

const container = document.getElementById('todo-root');
if (container) {
  createRoot(container).render(
    <StrictMode>
      <TodoApp />
    </StrictMode>,
  );
}

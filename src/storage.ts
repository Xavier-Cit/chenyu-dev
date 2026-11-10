// 浏览器存储：只负责读写 localStorage，规则（校验、迁移旧数据）都在 todo.ts 的 parseStorage 里
import { type Loaded, type Todo, parseStorage } from './todo';

const KEY = 'todos';

function readRaw(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return '<unavailable>'; // 存储被禁用：当成坏存档处理
  }
}

export function loadTodos(newId: () => number): Loaded {
  return parseStorage(readRaw(), newId);
}

// 返回 false 表示没存成功（存储满了或被禁用）
export function saveTodos(todos: readonly Todo[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(todos));
    return true;
  } catch {
    return false;
  }
}

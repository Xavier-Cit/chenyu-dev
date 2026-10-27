// 待办清单的纯逻辑：不碰 DOM、不碰 localStorage，方便单元测试。
// 所有函数都返回新数组，不修改传进来的数组（W7 定下的"不改原数组"）。

export interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export type Filter = 'all' | 'active' | 'done';

export const MAX_LEN = 100;

export type TextError = 'empty' | 'too-long';

// 成功时带上新数组，失败时带上原因；调用方必须先判断 ok 才能拿到 todos
export type Result =
  | { ok: true; todos: Todo[] }
  | { ok: false; error: TextError };

export type CheckedText =
  | { ok: true; text: string }
  | { ok: false; error: TextError };

// 输入框、prompt 拿到的文本都先过这里：去首尾空格，再拦空值和超长
export function checkText(raw: string): CheckedText {
  const text = raw.trim();
  if (text === '') return { ok: false, error: 'empty' };
  if (text.length > MAX_LEN) return { ok: false, error: 'too-long' };
  return { ok: true, text };
}

// id 生成器：同一毫秒连加几条也不会撞号。now 可以注入，测试时不依赖真实时间
export function createIdGen(now: () => number = Date.now): () => number {
  let last = 0;
  return () => {
    last = Math.max(now(), last + 1);
    return last;
  };
}

// dataset.id 读出来永远是 string | undefined，这里统一转成 number，转不了返回 null
export function parseId(raw: string | undefined): number | null {
  if (raw === undefined || raw.trim() === '') return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function addTodo(todos: readonly Todo[], raw: string, id: number): Result {
  const checked = checkText(raw);
  if (!checked.ok) return checked;
  return { ok: true, todos: [...todos, { id, text: checked.text, completed: false }] };
}

export function toggleTodo(todos: readonly Todo[], id: number): Todo[] {
  return todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
}

export function removeTodo(todos: readonly Todo[], id: number): Todo[] {
  return todos.filter((t) => t.id !== id);
}

export function updateTodo(todos: readonly Todo[], id: number, raw: string): Result {
  const checked = checkText(raw);
  if (!checked.ok) return checked;
  return {
    ok: true,
    todos: todos.map((t) => (t.id === id ? { ...t, text: checked.text } : t)),
  };
}

export function filterTodos(todos: readonly Todo[], filter: Filter): Todo[] {
  if (filter === 'all') return [...todos];
  if (filter === 'done') return todos.filter((t) => t.completed);
  return todos.filter((t) => !t.completed);
}

export function isFilter(value: string | undefined): value is Filter {
  return value === 'all' || value === 'active' || value === 'done';
}

// ---- 读存档：localStorage 里的东西是外部输入，类型一律当 unknown，逐项检查 ----

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// 把一条存档整理成 Todo；整理不了就返回 null
export function normalize(item: unknown, newId: () => number): Todo | null {
  if (typeof item === 'string') {                 // W6 的旧格式：数组里直接是字符串
    const text = item.trim();
    return text === '' ? null : { id: newId(), text, completed: false };
  }
  if (!isRecord(item)) return null;
  const { id, text, completed } = item;
  if (typeof text !== 'string' || text.trim() === '') return null;
  return {
    id: typeof id === 'number' && Number.isSafeInteger(id) && id > 0 ? id : newId(),
    text,
    completed: completed === true,
  };
}

export interface Loaded {
  todos: Todo[];
  broken: boolean;          // true：存档坏了（不是 JSON / 不是数组），已从空白开始
}

export function parseStorage(raw: string | null, newId: () => number): Loaded {
  if (raw === null) return { todos: [], broken: false };
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { todos: [], broken: true };
  }
  if (!Array.isArray(data)) return { todos: [], broken: true };

  const seen = new Set<number>();
  const todos: Todo[] = [];
  for (const item of data) {
    const t = normalize(item, newId);
    if (t === null) continue;
    const fixed = seen.has(t.id) ? { ...t, id: newId() } : t;   // 存档里有重复 id 就重新发号
    seen.add(fixed.id);
    todos.push(fixed);
  }
  return { todos, broken: false };
}

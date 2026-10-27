// 页面接线：只负责找元素、读写存储、渲染和事件委托；业务规则都在 todo.ts
import {
  type Filter, type Result, type TextError, type Todo,
  MAX_LEN, addTodo, createIdGen, filterTodos, isFilter, parseId,
  parseStorage, removeTodo, toggleTodo, updateTodo,
} from './todo';

const KEY = 'todos';

interface Els {
  form: HTMLFormElement;
  input: HTMLInputElement;
  list: HTMLUListElement;
  msg: HTMLElement;
  empty: HTMLElement;
  count: HTMLElement;
  filterBtns: HTMLButtonElement[];
}

// querySelector 可能返回 null：缺任何一个元素就返回 null，调用方直接不启动，不抛错
function findEls(): Els | null {
  const form = document.querySelector<HTMLFormElement>('.todo-form');
  const input = document.querySelector<HTMLInputElement>('.todo-input');
  const list = document.querySelector<HTMLUListElement>('.todo-list');
  const msg = document.querySelector<HTMLElement>('.todo-msg');
  const empty = document.querySelector<HTMLElement>('.todo-empty');
  const count = document.querySelector<HTMLElement>('.todo-count');
  const filterBtns = Array.from(document.querySelectorAll<HTMLButtonElement>('.todo-filter'));
  if (!form || !input || !list || !msg || !empty || !count || filterBtns.length === 0) return null;
  return { form, input, list, msg, empty, count, filterBtns };
}

// Record<TextError, string>：以后 TextError 多一种原因，这里漏写提示会直接编译报错
const ADD_ERROR: Record<TextError, string> = {
  'empty': '请先写点内容再添加。',
  'too-long': '最多 ' + MAX_LEN + ' 个字。',
};
const EDIT_ERROR: Record<TextError, string> = {
  'empty': '内容不能为空，已保留原来的文字。',
  'too-long': '最多 ' + MAX_LEN + ' 个字，已保留原来的文字。',
};

function start(els: Els): void {
  const newId = createIdGen();
  let todos: Todo[] = [];
  let filter: Filter = 'all';

  function showMsg(text: string, isError = false): void {
    els.msg.textContent = text;
    els.msg.classList.toggle('is-error', isError);
  }

  function readStorage(): string | null {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return '<unavailable>';             // 存储被禁用：当成坏存档处理
    }
  }

  function save(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(todos));
    } catch {
      showMsg('浏览器不允许保存，刷新后这次改动会丢失。', true);
    }
  }

  // 改数据 → save() → render()，三步不变
  function commit(next: Todo[]): void {
    todos = next;
    save();
    render();
  }

  // 返回 true 表示改动生效；失败时显示对应提示
  function apply(result: Result, texts: Record<TextError, string>): boolean {
    if (!result.ok) {
      showMsg(texts[result.error], true);
      return false;
    }
    showMsg('');
    commit(result.todos);
    return true;
  }

  function render(): void {
    const shown = filterTodos(todos, filter);
    const active = document.activeElement;
    const focused = active instanceof HTMLElement && els.list.contains(active) ? active : null;
    const keepId = focused?.closest('li')?.dataset.id;
    const keepCls = focused?.className;

    const frag = document.createDocumentFragment();
    for (const t of shown) {
      const li = document.createElement('li');
      li.className = 'todo-item' + (t.completed ? ' done' : '');
      li.dataset.id = String(t.id);       // dataset 只能存字符串，读回来时再用 parseId 转成 number

      const label = document.createElement('button');
      label.type = 'button';
      label.className = 'todo-text';
      label.textContent = t.text;         // 当文本显示，不当 HTML 解析

      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'todo-edit';
      edit.dataset.action = 'edit';
      edit.textContent = '编辑';
      edit.setAttribute('aria-label', '编辑：' + t.text);

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'todo-del';
      del.dataset.action = 'delete';
      const icon = document.createElement('span');
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = '×';
      del.appendChild(icon);
      del.setAttribute('aria-label', '删除：' + t.text);

      li.append(label, edit, del);
      frag.appendChild(li);
    }
    els.list.replaceChildren(frag);

    if (keepId !== undefined && keepCls) {   // 重画前焦点在列表里：画完放回同一条的同一个按钮
      const again = els.list.querySelector<HTMLElement>(`li[data-id="${keepId}"] .${keepCls.split(' ')[0]}`);
      again?.focus();
    }

    const done = todos.filter((t) => t.completed).length;
    els.empty.textContent = todos.length === 0 ? '还没有待办，先写一条试试。' : '这个筛选下没有待办。';
    els.empty.hidden = shown.length > 0;
    els.count.textContent = todos.length ? '共 ' + todos.length + ' 项，已完成 ' + done + ' 项' : '';
    els.filterBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === filter)));
  }

  function editTodo(id: number): void {
    const current = todos.find((t) => t.id === id);
    if (!current) return;                 // 数据里已经没有这一条
    const answer = prompt('修改待办', current.text);
    if (answer === null) return;          // 点了取消：prompt 返回 null
    if (answer.trim() === current.text) return;   // 没改动就不保存
    apply(updateTodo(todos, id, answer), EDIT_ERROR);
  }

  // ---- 启动 ----
  const loaded = parseStorage(readStorage(), newId);
  todos = loaded.todos;
  if (loaded.broken) showMsg('之前保存的待办读取失败，已从空白开始。', true);

  els.form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (apply(addTodo(todos, els.input.value, newId()), ADD_ERROR)) {
      els.input.value = '';
    }
    els.input.focus();                    // 连续添加时不用再点一次输入框
  });

  els.filterBtns.forEach((b) => b.addEventListener('click', () => {
    const f = b.dataset.filter;
    if (!isFilter(f)) return;             // dataset.filter 是 string | undefined，先收窄成 Filter
    filter = f;
    render();                             // 视图状态：不需要 save()
  }));

  // 事件委托：监听器只绑一次，绑在不会被 render() 重画的 ul 上
  els.list.addEventListener('click', (e) => {
    if (!(e.target instanceof Element)) return;           // 防御 1：target 不是元素
    const item = e.target.closest<HTMLLIElement>('li');
    if (!item || !els.list.contains(item)) return;        // 防御 2：closest 返回 null
    const id = parseId(item.dataset.id);
    if (id === null) return;                              // 防御 3：li 上没有合法 id

    const delBtn = e.target.closest('[data-action="delete"]');
    const editBtn = e.target.closest('[data-action="edit"]');
    if (delBtn && item.contains(delBtn)) {
      commit(removeTodo(todos, id));
    } else if (editBtn && item.contains(editBtn)) {
      editTodo(id);
    } else {
      commit(toggleTodo(todos, id));                      // 删除 / 编辑 / 切换互斥
    }
  });

  render();
}

const els = findEls();
if (els) start(els);

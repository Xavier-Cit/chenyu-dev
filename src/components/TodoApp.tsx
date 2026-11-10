import { useEffect, useState } from 'react';
import {
  type Filter,
  type Result,
  type TextError,
  type Todo,
  MAX_LEN,
  addTodo,
  createIdGen,
  filterTodos,
  removeTodo,
  toggleTodo,
  updateTodo,
} from '../todo';
import { loadTodos, saveTodos } from '../storage';
import { TodoForm } from './TodoForm';
import { TodoFilters } from './TodoFilters';
import { TodoList } from './TodoList';

// Record<TextError, string>：以后 TextError 多一种原因，这里漏写提示会直接编译报错
const ADD_ERROR: Record<TextError, string> = {
  empty: '请先写点内容再添加。',
  'too-long': '最多 ' + MAX_LEN + ' 个字。',
};
const EDIT_ERROR: Record<TextError, string> = {
  empty: '内容不能为空，已保留原来的文字。',
  'too-long': '最多 ' + MAX_LEN + ' 个字，已保留原来的文字。',
};

interface Msg {
  text: string;
  isError: boolean;
}

const NO_MSG: Msg = { text: '', isError: false };

export function TodoApp() {
  // 只在第一次渲染时读一次存档；newId 在整个组件生命周期里是同一个生成器
  const [newId] = useState(() => createIdGen());
  const [initial] = useState(() => loadTodos(newId));

  const [todos, setTodos] = useState<Todo[]>(initial.todos);
  const [filter, setFilter] = useState<Filter>('all');
  const [msg, setMsg] = useState<Msg>(
    initial.broken ? { text: '之前保存的待办读取失败，已从空白开始。', isError: true } : NO_MSG,
  );

  // 开发时把 todos 打到控制台，方便核对“页面 = State”（打包上线后不会打印）
  useEffect(() => {
    if (import.meta.env.DEV) console.log('[todos]', todos);
  }, [todos]);

  // 改数据 → 保存 → 重渲染：setTodos 换成一个新数组，React 负责把页面画成它的样子
  function commit(next: Todo[]): void {
    setTodos(next);
    if (!saveTodos(next))
      setMsg({ text: '浏览器不允许保存，刷新后这次改动会丢失。', isError: true });
  }

  // 返回 true 表示改动生效；失败时显示对应提示
  function apply(result: Result, texts: Record<TextError, string>): boolean {
    if (!result.ok) {
      setMsg({ text: texts[result.error], isError: true });
      return false;
    }
    setMsg(NO_MSG);
    commit(result.todos);
    return true;
  }

  function handleAdd(text: string): boolean {
    return apply(addTodo(todos, text, newId()), ADD_ERROR);
  }

  function handleEdit(id: number): void {
    const current = todos.find((t) => t.id === id);
    if (!current) return;
    const answer = prompt('修改待办', current.text);
    if (answer === null) return; // 点了取消
    if (answer.trim() === current.text) return; // 没改动就不保存
    apply(updateTodo(todos, id, answer), EDIT_ERROR);
  }

  const shown = filterTodos(todos, filter);
  const done = todos.filter((t) => t.completed).length;

  return (
    <div className="todo">
      <TodoForm onAdd={handleAdd} />
      <TodoFilters filter={filter} onChange={setFilter} />
      <p className={msg.isError ? 'todo-msg is-error' : 'todo-msg'} role="status">
        {msg.text}
      </p>
      <TodoList
        todos={shown}
        onToggle={(id) => commit(toggleTodo(todos, id))}
        onDelete={(id) => commit(removeTodo(todos, id))}
        onEdit={handleEdit}
      />
      <p className="todo-empty" hidden={shown.length > 0}>
        {todos.length === 0 ? '还没有待办，先写一条试试。' : '这个筛选下没有待办。'}
      </p>
      <p className="todo-count" aria-live="polite">
        {todos.length ? '共 ' + todos.length + ' 项，已完成 ' + done + ' 项' : ''}
      </p>
    </div>
  );
}

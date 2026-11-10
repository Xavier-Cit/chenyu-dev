import type { Todo } from '../todo';

export interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
}

export function TodoItem({ todo, onToggle, onDelete, onEdit }: TodoItemProps) {
  return (
    <li className={todo.completed ? 'todo-item done' : 'todo-item'}>
      {/* 文字本身是按钮：鼠标点、键盘回车/空格都能切换完成 */}
      <button type="button" className="todo-text" onClick={() => onToggle(todo.id)}>
        {todo.text}
      </button>
      <button
        type="button"
        className="todo-edit"
        aria-label={'编辑：' + todo.text}
        onClick={() => onEdit(todo.id)}
      >
        编辑
      </button>
      <button
        type="button"
        className="todo-del"
        aria-label={'删除：' + todo.text}
        onClick={() => onDelete(todo.id)}
      >
        <span aria-hidden="true">×</span>
      </button>
    </li>
  );
}

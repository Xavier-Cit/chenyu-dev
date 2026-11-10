import type { Todo } from '../todo';
import { TodoItem } from './TodoItem';

export interface TodoListProps {
  todos: readonly Todo[];
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
}

export function TodoList({ todos, onToggle, onDelete, onEdit }: TodoListProps) {
  return (
    <ul className="todo-list">
      {todos.map((t) => (
        // key 用待办自己的 id：增删之后 React 仍能认出每一条，焦点不会跳走
        <TodoItem key={t.id} todo={t} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />
      ))}
    </ul>
  );
}

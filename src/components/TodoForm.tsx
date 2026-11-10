import { type FormEvent, useRef, useState } from 'react';
import { MAX_LEN } from '../todo';

export interface TodoFormProps {
  // 返回 true 表示添加成功，表单才清空输入框
  onAdd: (text: string) => boolean;
}

export function TodoForm({ onAdd }: TodoFormProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (onAdd(text)) setText('');
    inputRef.current?.focus(); // 连续添加时不用再点一次输入框
  }

  return (
    <form className="todo-form" noValidate onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="todo-input">
        新的待办
      </label>
      <input
        ref={inputRef}
        type="text"
        id="todo-input"
        className="todo-input"
        maxLength={MAX_LEN}
        placeholder="写一条待办，回车添加"
        autoComplete="off"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button type="submit" className="todo-btn">
        添加
      </button>
    </form>
  );
}

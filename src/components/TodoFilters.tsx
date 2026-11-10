import type { Filter } from '../todo';

export interface TodoFiltersProps {
  filter: Filter;
  onChange: (filter: Filter) => void;
}

const OPTIONS: { value: Filter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '未完成' },
  { value: 'done', label: '已完成' },
];

export function TodoFilters({ filter, onChange }: TodoFiltersProps) {
  return (
    <div className="todo-filters" role="group" aria-label="筛选">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          className="todo-filter"
          data-filter={o.value} // 保留 W10 的属性：外部脚本 / 测试靠它找到筛选按钮
          aria-pressed={filter === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

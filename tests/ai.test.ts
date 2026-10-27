// 任务 3：AI 生成的测试，经审查修补后的版本
// 修补要点：去掉 toBeTruthy / toBeDefined / not.toContain(对象) 这类永远为真的断言；
// 失败分支直接断言整个 Result，不放进 if；每个用例用工厂函数拿新数据，不共享可变数组；
// id 生成器注入固定时间，不依赖真实时钟。
import { describe, it, expect } from 'vitest';
import {
  removeTodo, updateTodo, parseId, createIdGen, parseStorage, MAX_LEN, type Todo,
} from '../src/todo';

const sample = (): Todo[] => [
  { id: 1, text: '复习 CS61C', completed: false },
  { id: 2, text: '买牛奶', completed: true },
];

// 固定从 1000 开始发号的生成器：每个用例自己 new 一个，互不影响
const fixedGen = () => createIdGen(() => 1000);

describe('removeTodo', () => {
  it('删除指定 id：只剩另一条，内容完整', () => {
    expect(removeTodo(sample(), 1)).toEqual([{ id: 2, text: '买牛奶', completed: true }]);
  });

  it('id 不存在：内容不变', () => {
    expect(removeTodo(sample(), 999)).toEqual(sample());
  });

  it('空列表删除：返回空数组', () => {
    expect(removeTodo([], 1)).toEqual([]);
  });

  it('不修改传进来的数组，返回的是新数组', () => {
    const todos = sample();
    const next = removeTodo(todos, 1);
    expect(todos).toEqual(sample());
    expect(next).not.toBe(todos);
  });
});

describe('updateTodo', () => {
  it('正常修改：只改这一条的 text，completed 和别的条不变', () => {
    expect(updateTodo(sample(), 2, '买燕麦奶')).toEqual({
      ok: true,
      todos: [
        { id: 1, text: '复习 CS61C', completed: false },
        { id: 2, text: '买燕麦奶', completed: true },
      ],
    });
  });

  it('新文本首尾空格会被去掉', () => {
    const r = updateTodo(sample(), 1, '  复习 CS61C 第 6 章  ');
    expect(r.ok && r.todos[0]?.text).toBe('复习 CS61C 第 6 章');
  });

  it('空字符串和纯空格都返回 empty', () => {
    expect(updateTodo(sample(), 1, '')).toEqual({ ok: false, error: 'empty' });
    expect(updateTodo(sample(), 1, '   ')).toEqual({ ok: false, error: 'empty' });
  });

  it('100 字可以改，101 字返回 too-long', () => {
    expect(updateTodo(sample(), 1, '字'.repeat(MAX_LEN)).ok).toBe(true);
    expect(updateTodo(sample(), 1, '字'.repeat(MAX_LEN + 1))).toEqual({ ok: false, error: 'too-long' });
  });

  it('id 不存在：ok 但内容不变', () => {
    expect(updateTodo(sample(), 999, '新文字')).toEqual({ ok: true, todos: sample() });
  });

  it('HTML 字符串按原样保存，不被截断或转义', () => {
    const html = '<img src=x onerror="alert(1)">';
    const r = updateTodo(sample(), 1, html);
    expect(r.ok && r.todos[0]?.text).toBe(html);
  });
});

describe('parseId（dataset.id → number）', () => {
  it.each([
    ['1', 1],
    ['1792486347093', 1792486347093],
    [' 42 ', 42],
  ])('合法：%j → %d', (raw, expected) => {
    expect(parseId(raw)).toBe(expected);
  });

  it.each([
    [undefined],
    [''],
    ['   '],
    ['abc'],
    ['12abc'],
    ['0'],
    ['-1'],
    ['1.5'],
    ['NaN'],
    ['Infinity'],
    ['9007199254740993'],   // 超过安全整数，转成 number 会丢精度
  ])('非法：%j → null', (raw) => {
    expect(parseId(raw)).toBeNull();
  });
});

describe('createIdGen', () => {
  it('同一毫秒连发 3 个：依次 +1，不撞号', () => {
    const gen = fixedGen();
    expect([gen(), gen(), gen()]).toEqual([1000, 1001, 1002]);
  });

  it('时间往前走：用新的时间戳', () => {
    let now = 1000;
    const gen = createIdGen(() => now);
    expect(gen()).toBe(1000);
    now = 5000;
    expect(gen()).toBe(5000);
  });

  it('时钟回拨：仍然比上一个大', () => {
    let now = 5000;
    const gen = createIdGen(() => now);
    gen();
    now = 1000;
    expect(gen()).toBe(5001);
  });
});

describe('parseStorage', () => {
  it('null（从没存过）：空数组，broken 为 false', () => {
    expect(parseStorage(null, fixedGen())).toEqual({ todos: [], broken: false });
  });

  it('合法存档原样读出', () => {
    expect(parseStorage(JSON.stringify(sample()), fixedGen())).toEqual({ todos: sample(), broken: false });
  });

  it.each([
    ['{bad json'],
    ['<unavailable>'],        // main.ts 里存储被禁用时传进来的值
    ['{"a":1}'],
    ['"abc"'],
    ['42'],
    ['null'],
  ])('坏存档 %j：空数组，broken 为 true', (raw) => {
    expect(parseStorage(raw, fixedGen())).toEqual({ todos: [], broken: true });
  });

  it('兼容 W6 字符串数组：去空格、跳过空串、发新 id', () => {
    const raw = JSON.stringify(['  买牛奶  ', '   ', '写日志']);
    expect(parseStorage(raw, fixedGen()).todos).toEqual([
      { id: 1000, text: '买牛奶', completed: false },
      { id: 1001, text: '写日志', completed: false },
    ]);
  });

  it('过滤脏数据：null、数字、数组、没有 text、text 为空都丢掉', () => {
    const raw = JSON.stringify([
      { id: 1, text: 'ok', completed: false },
      null, 42, ['x'], { id: 2 }, { id: 3, text: '  ' }, { id: 4, text: 123 },
    ]);
    expect(parseStorage(raw, fixedGen()).todos).toEqual([{ id: 1, text: 'ok', completed: false }]);
  });

  it('字段类型不对：id 非法就重新发号，completed 不是 true 一律当 false', () => {
    const raw = JSON.stringify([
      { id: 'abc', text: 'a', completed: 'yes' },
      { id: -5, text: 'b', completed: 1 },
      { id: 7, text: 'c', completed: true },
    ]);
    expect(parseStorage(raw, fixedGen()).todos).toEqual([
      { id: 1000, text: 'a', completed: false },
      { id: 1001, text: 'b', completed: false },
      { id: 7, text: 'c', completed: true },
    ]);
  });

  it('重复 id：后出现的那条重新发号，两条都保留', () => {
    const raw = JSON.stringify([
      { id: 7, text: '第一条', completed: false },
      { id: 7, text: '第二条', completed: true },
    ]);
    expect(parseStorage(raw, fixedGen()).todos).toEqual([
      { id: 7, text: '第一条', completed: false },
      { id: 1000, text: '第二条', completed: true },
    ]);
  });
});

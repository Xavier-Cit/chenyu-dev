"use strict";
(() => {
  // src/todo.ts
  var MAX_LEN = 100;
  function checkText(raw) {
    const text = raw.trim();
    if (text === "") return { ok: false, error: "empty" };
    if (text.length > MAX_LEN) return { ok: false, error: "too-long" };
    return { ok: true, text };
  }
  function createIdGen(now = Date.now) {
    let last = 0;
    return () => {
      last = Math.max(now(), last + 1);
      return last;
    };
  }
  function parseId(raw) {
    if (raw === void 0 || raw.trim() === "") return null;
    const id = Number(raw);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  }
  function addTodo(todos, raw, id) {
    const checked = checkText(raw);
    if (!checked.ok) return checked;
    return { ok: true, todos: [...todos, { id, text: checked.text, completed: false }] };
  }
  function toggleTodo(todos, id) {
    return todos.map((t) => t.id === id ? { ...t, completed: !t.completed } : t);
  }
  function removeTodo(todos, id) {
    return todos.filter((t) => t.id !== id);
  }
  function updateTodo(todos, id, raw) {
    const checked = checkText(raw);
    if (!checked.ok) return checked;
    return {
      ok: true,
      todos: todos.map((t) => t.id === id ? { ...t, text: checked.text } : t)
    };
  }
  function filterTodos(todos, filter) {
    if (filter === "all") return [...todos];
    if (filter === "done") return todos.filter((t) => t.completed);
    return todos.filter((t) => !t.completed);
  }
  function isFilter(value) {
    return value === "all" || value === "active" || value === "done";
  }
  function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
  function normalize(item, newId) {
    if (typeof item === "string") {
      const text2 = item.trim();
      return text2 === "" ? null : { id: newId(), text: text2, completed: false };
    }
    if (!isRecord(item)) return null;
    const { id, text, completed } = item;
    if (typeof text !== "string" || text.trim() === "") return null;
    return {
      id: typeof id === "number" && Number.isSafeInteger(id) && id > 0 ? id : newId(),
      text,
      completed: completed === true
    };
  }
  function parseStorage(raw, newId) {
    if (raw === null) return { todos: [], broken: false };
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return { todos: [], broken: true };
    }
    if (!Array.isArray(data)) return { todos: [], broken: true };
    const seen = /* @__PURE__ */ new Set();
    const todos = [];
    for (const item of data) {
      const t = normalize(item, newId);
      if (t === null) continue;
      const fixed = seen.has(t.id) ? { ...t, id: newId() } : t;
      seen.add(fixed.id);
      todos.push(fixed);
    }
    return { todos, broken: false };
  }

  // src/main.ts
  var KEY = "todos";
  function findEls() {
    const form = document.querySelector(".todo-form");
    const input = document.querySelector(".todo-input");
    const list = document.querySelector(".todo-list");
    const msg = document.querySelector(".todo-msg");
    const empty = document.querySelector(".todo-empty");
    const count = document.querySelector(".todo-count");
    const filterBtns = Array.from(document.querySelectorAll(".todo-filter"));
    if (!form || !input || !list || !msg || !empty || !count || filterBtns.length === 0) return null;
    return { form, input, list, msg, empty, count, filterBtns };
  }
  var ADD_ERROR = {
    "empty": "\u8BF7\u5148\u5199\u70B9\u5185\u5BB9\u518D\u6DFB\u52A0\u3002",
    "too-long": "\u6700\u591A " + MAX_LEN + " \u4E2A\u5B57\u3002"
  };
  var EDIT_ERROR = {
    "empty": "\u5185\u5BB9\u4E0D\u80FD\u4E3A\u7A7A\uFF0C\u5DF2\u4FDD\u7559\u539F\u6765\u7684\u6587\u5B57\u3002",
    "too-long": "\u6700\u591A " + MAX_LEN + " \u4E2A\u5B57\uFF0C\u5DF2\u4FDD\u7559\u539F\u6765\u7684\u6587\u5B57\u3002"
  };
  function start(els2) {
    const newId = createIdGen();
    let todos = [];
    let filter = "all";
    function showMsg(text, isError = false) {
      els2.msg.textContent = text;
      els2.msg.classList.toggle("is-error", isError);
    }
    function readStorage() {
      try {
        return localStorage.getItem(KEY);
      } catch {
        return "<unavailable>";
      }
    }
    function save() {
      try {
        localStorage.setItem(KEY, JSON.stringify(todos));
      } catch {
        showMsg("\u6D4F\u89C8\u5668\u4E0D\u5141\u8BB8\u4FDD\u5B58\uFF0C\u5237\u65B0\u540E\u8FD9\u6B21\u6539\u52A8\u4F1A\u4E22\u5931\u3002", true);
      }
    }
    function commit(next) {
      todos = next;
      save();
      render();
    }
    function apply(result, texts) {
      if (!result.ok) {
        showMsg(texts[result.error], true);
        return false;
      }
      showMsg("");
      commit(result.todos);
      return true;
    }
    function render() {
      const shown = filterTodos(todos, filter);
      const active = document.activeElement;
      const focused = active instanceof HTMLElement && els2.list.contains(active) ? active : null;
      const keepId = focused?.closest("li")?.dataset.id;
      const keepCls = focused?.className;
      const frag = document.createDocumentFragment();
      for (const t of shown) {
        const li = document.createElement("li");
        li.className = "todo-item" + (t.completed ? " done" : "");
        li.dataset.id = String(t.id);
        const label = document.createElement("button");
        label.type = "button";
        label.className = "todo-text";
        label.textContent = t.text;
        const edit = document.createElement("button");
        edit.type = "button";
        edit.className = "todo-edit";
        edit.dataset.action = "edit";
        edit.textContent = "\u7F16\u8F91";
        edit.setAttribute("aria-label", "\u7F16\u8F91\uFF1A" + t.text);
        const del = document.createElement("button");
        del.type = "button";
        del.className = "todo-del";
        del.dataset.action = "delete";
        const icon = document.createElement("span");
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = "\xD7";
        del.appendChild(icon);
        del.setAttribute("aria-label", "\u5220\u9664\uFF1A" + t.text);
        li.append(label, edit, del);
        frag.appendChild(li);
      }
      els2.list.replaceChildren(frag);
      if (keepId !== void 0 && keepCls) {
        const again = els2.list.querySelector(`li[data-id="${keepId}"] .${keepCls.split(" ")[0]}`);
        again?.focus();
      }
      const done = todos.filter((t) => t.completed).length;
      els2.empty.textContent = todos.length === 0 ? "\u8FD8\u6CA1\u6709\u5F85\u529E\uFF0C\u5148\u5199\u4E00\u6761\u8BD5\u8BD5\u3002" : "\u8FD9\u4E2A\u7B5B\u9009\u4E0B\u6CA1\u6709\u5F85\u529E\u3002";
      els2.empty.hidden = shown.length > 0;
      els2.count.textContent = todos.length ? "\u5171 " + todos.length + " \u9879\uFF0C\u5DF2\u5B8C\u6210 " + done + " \u9879" : "";
      els2.filterBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === filter)));
    }
    function editTodo(id) {
      const current = todos.find((t) => t.id === id);
      if (!current) return;
      const answer = prompt("\u4FEE\u6539\u5F85\u529E", current.text);
      if (answer === null) return;
      if (answer.trim() === current.text) return;
      apply(updateTodo(todos, id, answer), EDIT_ERROR);
    }
    const loaded = parseStorage(readStorage(), newId);
    todos = loaded.todos;
    if (loaded.broken) showMsg("\u4E4B\u524D\u4FDD\u5B58\u7684\u5F85\u529E\u8BFB\u53D6\u5931\u8D25\uFF0C\u5DF2\u4ECE\u7A7A\u767D\u5F00\u59CB\u3002", true);
    els2.form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (apply(addTodo(todos, els2.input.value, newId()), ADD_ERROR)) {
        els2.input.value = "";
      }
      els2.input.focus();
    });
    els2.filterBtns.forEach((b) => b.addEventListener("click", () => {
      const f = b.dataset.filter;
      if (!isFilter(f)) return;
      filter = f;
      render();
    }));
    els2.list.addEventListener("click", (e) => {
      if (!(e.target instanceof Element)) return;
      const item = e.target.closest("li");
      if (!item || !els2.list.contains(item)) return;
      const id = parseId(item.dataset.id);
      if (id === null) return;
      const delBtn = e.target.closest('[data-action="delete"]');
      const editBtn = e.target.closest('[data-action="edit"]');
      if (delBtn && item.contains(delBtn)) {
        commit(removeTodo(todos, id));
      } else if (editBtn && item.contains(editBtn)) {
        editTodo(id);
      } else {
        commit(toggleTodo(todos, id));
      }
    });
    render();
  }
  var els = findEls();
  if (els) start(els);
})();

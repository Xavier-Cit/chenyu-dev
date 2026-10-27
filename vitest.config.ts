import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',          // 被测的 todo.ts 不碰 DOM，不需要 jsdom
  },
});

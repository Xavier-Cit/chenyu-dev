import { defineConfig } from 'vitest/config';

export default defineConfig({
  // 相对路径：打包后的 dist/ 放到 GitHub Pages 子目录（/chenyu-dev/）也能找到资源
  base: './',
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node', // 被测的 todo.ts 不碰 DOM，不需要 jsdom
  },
});

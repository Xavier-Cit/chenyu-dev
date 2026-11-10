import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // 相对路径：打包后的 dist/ 放到 GitHub Pages 子目录（/chenyu-dev/）也能找到资源
  base: './',
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    environment: 'node', // 默认 node；需要 DOM 的组件测试在文件头单独声明 jsdom
  },
});

/* eslint-env node */
// ESLint 8 的经典配置格式（课件指定 .eslintrc.cjs；ESLint 9 起默认改用 eslint.config.js）
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended', // React 官方 Hooks 规则（实测：在事件回调里直接改 state 它查不出来，靠 UI 测试兜底）
    'prettier', // 关掉和 Prettier 冲突的格式类规则，格式只归 Prettier 管
  ],
  rules: {
    complexity: ['warn', 10], // 一个函数里的分支路径不超过 10 条
    'max-depth': ['warn', 3], // if / for 最多嵌套 3 层
    '@typescript-eslint/no-explicit-any': 'error', // 禁止显式 any
  },
  ignorePatterns: ['dist/', 'node_modules/', 'coverage/'],
};

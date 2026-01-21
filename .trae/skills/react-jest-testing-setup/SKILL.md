---
name: "react-jest-testing-setup"
description: "Configures React + Jest testing environment. Invoke when setting up unit tests for React applications or resolving testing configuration issues."
---

# React + Jest 测试环境配置指南

## 概述
本文档描述如何为 React + Vite 项目配置 Jest 测试环境，特别是处理 ES 模块、Ant Design 组件和 Vite 特有语法。

## 适用场景
- React 18+ 项目
- 使用 Vite 作为构建工具
- 使用 Ant Design 作为 UI 组件库
- 需要编写单元测试和集成测试

---

## 1. 依赖安装

```bash
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event babel-jest @babel/core @babel/preset-env @babel/preset-react identity-obj-proxy
```

## 2. Jest 配置文件 (`jest.config.js`)

```javascript
export default {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    // CSS/样式文件 mock
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // 静态资源文件 mock
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg|webp)$': '<rootDir>/__mocks__/fileMock.js',
  },
  setupFilesAfterEnv: ['<rootDir>/setupTests.js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/cypress/'],
  // 关键：处理 ES 模块依赖
  transformIgnorePatterns: [
    '/node_modules/(?!(' +
      'axios|' +
      'react-router-dom|' +
      'react-router|' +
      '@remix-run|' +
      'antd|' +
      '@ant-design|' +
      'rc-[^/]+|' +
      '@rc-component|' +
      '@babel/runtime' +
    ')/)',
  ],
  moduleFileExtensions: ['js', 'jsx', 'json'],
  testMatch: ['**/*.test.jsx', '**/*.test.js'],
  // Ant Design 组件异步渲染需要更长超时
  testTimeout: 10000,
};
```

## 3. Babel 配置 (`.babelrc`)

```json
{
  "presets": [
    "@babel/preset-env",
    ["@babel/preset-react", { "runtime": "automatic" }]
  ]
}
```

## 4. 静态资源 Mock (`__mocks__/fileMock.js`)

```javascript
export default 'test-file-stub';
```

## 5. 测试环境设置 (`setupTests.js`)

```javascript
import '@testing-library/jest-dom';

// 1. window.matchMedia mock (Ant Design 响应式组件必需)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// 2. ResizeObserver mock
class MockResizeObserver {
  constructor(callback) { this.callback = callback; }
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = MockResizeObserver;

// 3. IntersectionObserver mock
class MockIntersectionObserver {
  constructor(callback) { this.callback = callback; }
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.IntersectionObserver = MockIntersectionObserver;

// 4. localStorage mock
const localStorageMock = (() => {
  let store = new Map();
  return {
    getItem: jest.fn((key) => store.get(key) ?? null),
    setItem: jest.fn((key, value) => store.set(key, String(value))),
    removeItem: jest.fn((key) => store.delete(key)),
    clear: jest.fn(() => store.clear()),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// 5. Ant Design message API mock
jest.mock('antd', () => {
  const antd = jest.requireActual('antd');
  return {
    ...antd,
    message: {
      success: jest.fn(),
      error: jest.fn(),
      warning: jest.fn(),
      info: jest.fn(),
    },
  };
});

// 6. 清理每个测试
beforeEach(() => {
  localStorageMock.clear();
  jest.clearAllMocks();
});
```

---

## 常见问题解决

### 问题1: `import.meta.env` 无法解析
**原因**: Jest 不支持 Vite 的 `import.meta` 语法  
**解决**: 在测试文件中 mock 使用了 `import.meta.env` 的模块

```javascript
jest.mock('./utils/axiosConfig', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    // ...
  },
}));
```

### 问题2: ES 模块转换错误
**原因**: node_modules 中的某些包使用 ES 模块语法  
**解决**: 在 `transformIgnorePatterns` 中添加需要转换的包

### 问题3: Ant Design 组件渲染警告
**原因**: 缺少必要的浏览器 API mock  
**解决**: 在 setupTests.js 中添加 matchMedia、ResizeObserver 等 mock
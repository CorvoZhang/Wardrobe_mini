---
name: "vite-jest-compatibility"
description: "Resolves Vite + Jest compatibility issues. Invoke when encountering import.meta errors or module system conflicts in test environments."
---

# Vite + Jest 兼容性处理指南

## 概述
Vite 和 Jest 使用不同的模块系统，本文档描述如何解决常见的兼容性问题。

## 适用场景
- Vite 项目中使用 Jest 进行测试
- 处理 `import.meta.env` 环境变量
- 处理 ES 模块依赖

---

## 1. 核心问题：`import.meta.env`

### 问题描述
```javascript
// 这行代码在 Jest 中会报错
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
// SyntaxError: Cannot use 'import.meta' outside a module
```

### 解决方案 1: 模块级 Mock（推荐）

在测试文件中 mock 整个模块：

```javascript
// 在测试文件顶部，import 之前
jest.mock('./utils/axiosConfig', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  },
}));

// 然后再 import 使用该模块的组件
import App from './App.jsx';
```

### 解决方案 2: 创建手动 Mock 文件

创建 `__mocks__/axiosConfig.js`：

```javascript
export default {
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  // ...
};
```

在测试中：
```javascript
jest.mock('./utils/axiosConfig');
```

### 解决方案 3: 环境变量注入

在 `jest.config.js` 中：
```javascript
export default {
  // ...
  globals: {
    'import.meta': {
      env: {
        VITE_API_URL: 'http://localhost:5001/api',
      },
    },
  },
};
```

**注意**: 此方案在新版 Jest 中可能不生效

---

## 2. ES 模块转换

### 问题描述
```
Jest encountered an unexpected token
SyntaxError: Unexpected token 'export'
```

### 解决方案：配置 `transformIgnorePatterns`

```javascript
// jest.config.js
export default {
  transformIgnorePatterns: [
    '/node_modules/(?!(' +
      // 添加需要转换的包
      'axios|' +
      'react-router-dom|' +
      'react-router|' +
      '@remix-run|' +
      'antd|' +
      '@ant-design|' +
      'rc-[^/]+|' +        // Ant Design 的 rc-* 组件
      '@rc-component|' +
      '@babel/runtime' +
    ')/)',
  ],
};
```

### 常见需要转换的包
| 包名 | 说明 |
|------|------|
| axios | HTTP 客户端 |
| react-router-dom | React 路由 |
| antd / @ant-design | Ant Design |
| rc-* | Ant Design 底层组件 |
| lodash-es | Lodash ES 版本 |

---

## 3. CSS 模块处理

### 问题描述
```
SyntaxError: Unexpected token '.'
```

### 解决方案

```javascript
// jest.config.js
export default {
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
};
```

安装依赖：
```bash
npm install -D identity-obj-proxy
```

---

## 4. 静态资源处理

### 问题描述
```
SyntaxError: Invalid or unexpected token
```

### 解决方案

1. 创建 mock 文件 `__mocks__/fileMock.js`：
```javascript
export default 'test-file-stub';
```

2. 配置 Jest：
```javascript
// jest.config.js
export default {
  moduleNameMapper: {
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg|webp)$': '<rootDir>/__mocks__/fileMock.js',
  },
};
```

---

## 5. 完整配置示例

```javascript
// jest.config.js
export default {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg|webp)$': '<rootDir>/__mocks__/fileMock.js',
  },
  setupFilesAfterEnv: ['<rootDir>/setupTests.js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/cypress/'],
  transformIgnorePatterns: [
    '/node_modules/(?!(axios|react-router-dom|react-router|@remix-run|antd|@ant-design|rc-[^/]+|@rc-component|@babel/runtime)/)',
  ],
  moduleFileExtensions: ['js', 'jsx', 'json'],
  testTimeout: 10000,
};
```

---

## 6. 故障排查清单

- [ ] 是否安装了 `babel-jest` 和 `@babel/preset-env`？
- [ ] `.babelrc` 或 `babel.config.js` 是否正确配置？
- [ ] 报错的包是否已添加到 `transformIgnorePatterns`？
- [ ] 使用 `import.meta.env` 的文件是否已 mock？
- [ ] CSS 和静态资源是否有正确的 mock？
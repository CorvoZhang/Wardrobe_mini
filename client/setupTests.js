// 导入@testing-library/jest-dom的匹配器
import '@testing-library/jest-dom';

// 模拟 import.meta.env (Vite 特有的环境变量)
// 注意：需要在 babel.config 或 jest.config 中使用 plugin 来处理 import.meta
// 这里使用全局变量作为后备方案
globalThis.__VITE_API_URL__ = 'http://localhost:5001/api';

// 模拟window.matchMedia，解决Ant Design Grid组件在测试环境中的错误
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // 兼容旧版
    removeListener: jest.fn(), // 兼容旧版
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// 模拟 window.getComputedStyle
const originalGetComputedStyle = window.getComputedStyle;
window.getComputedStyle = (elt, pseudoElt) => {
  const style = originalGetComputedStyle(elt, pseudoElt);
  return {
    ...style,
    getPropertyValue: (prop) => style.getPropertyValue(prop) || '',
  };
};

// 模拟 IntersectionObserver
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.IntersectionObserver = MockIntersectionObserver;

// 模拟 ResizeObserver
class MockResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = MockResizeObserver;

// 模拟 MutationObserver
class MockMutationObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
global.MutationObserver = MockMutationObserver;

// 创建 localStorage mock，使用 Map 来存储数据
const localStorageMock = (() => {
  let store = new Map();
  return {
    getItem: jest.fn((key) => store.get(key) ?? null),
    setItem: jest.fn((key, value) => store.set(key, String(value))),
    removeItem: jest.fn((key) => store.delete(key)),
    clear: jest.fn(() => store.clear()),
    get length() {
      return store.size;
    },
    key: jest.fn((index) => {
      const keys = Array.from(store.keys());
      return keys[index] ?? null;
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// 模拟sessionStorage
const sessionStorageMock = (() => {
  let store = new Map();
  return {
    getItem: jest.fn((key) => store.get(key) ?? null),
    setItem: jest.fn((key, value) => store.set(key, String(value))),
    removeItem: jest.fn((key) => store.delete(key)),
    clear: jest.fn(() => store.clear()),
    get length() {
      return store.size;
    },
    key: jest.fn((index) => {
      const keys = Array.from(store.keys());
      return keys[index] ?? null;
    }),
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

// 模拟 scrollTo
window.scrollTo = jest.fn();
Element.prototype.scrollTo = jest.fn();
Element.prototype.scrollIntoView = jest.fn();

// 模拟 requestAnimationFrame 和 cancelAnimationFrame
global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);

// 模拟 Ant Design message API
jest.mock('antd', () => {
  const antd = jest.requireActual('antd');
  return {
    ...antd,
    message: {
      success: jest.fn(),
      error: jest.fn(),
      warning: jest.fn(),
      info: jest.fn(),
      loading: jest.fn(),
      destroy: jest.fn(),
    },
  };
});

// 清理每个测试后的副作用
beforeEach(() => {
  // 重置 localStorage mock
  localStorageMock.clear();
  jest.clearAllMocks();
});

// 抑制控制台错误和警告（可选，但对于某些 Ant Design 警告有用）
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    // 过滤掉一些已知的 React 和 Ant Design 警告
    if (
      args[0]?.includes?.('Warning: ReactDOM.render is no longer supported') ||
      args[0]?.includes?.('Warning: An update to') ||
      args[0]?.includes?.('act(...)') ||
      args[0]?.includes?.('Not implemented: HTMLFormElement.prototype.requestSubmit')
    ) {
      return;
    }
    originalConsoleError.apply(console, args);
  };

  console.warn = (...args) => {
    // 过滤掉一些已知的警告
    if (
      args[0]?.includes?.('componentWillReceiveProps') ||
      args[0]?.includes?.('componentWillUpdate')
    ) {
      return;
    }
    originalConsoleWarn.apply(console, args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

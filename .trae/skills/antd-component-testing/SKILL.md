---
name: antd-component-testing
description: Tests Ant Design components in Jest environment. Invoke when testing React apps using Ant Design components or handling Form, message, Modal components.
---

# Ant Design 组件测试指南

## 概述
本文档描述如何在 Jest 环境中测试 Ant Design 组件，包括必要的 mock 和常见问题处理。

## 适用场景
- 测试使用 Ant Design 组件的 React 应用
- 处理 Form、message、Modal 等复杂组件
- 解决 JSDOM 环境限制问题

---

## 1. 必要的浏览器 API Mock

### 1.1 window.matchMedia（必需）

```javascript
// setupTests.js
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),      // 旧版 API
    removeListener: jest.fn(),   // 旧版 API
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```

**影响的组件**: Grid、Layout、Menu（响应式）、所有使用 useBreakpoint 的组件

### 1.2 ResizeObserver

```javascript
class MockResizeObserver {
  constructor(callback) { this.callback = callback; }
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = MockResizeObserver;
```

**影响的组件**: Table、Tabs、虚拟列表组件

### 1.3 IntersectionObserver

```javascript
class MockIntersectionObserver {
  constructor(callback) { this.callback = callback; }
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.IntersectionObserver = MockIntersectionObserver;
```

**影响的组件**: Image（懒加载）、无限滚动组件

### 1.4 MutationObserver

```javascript
class MockMutationObserver {
  constructor(callback) { this.callback = callback; }
  observe() {}
  disconnect() {}
  takeRecords() { return []; }
}
global.MutationObserver = MockMutationObserver;
```

### 1.5 其他常用 Mock

```javascript
// scrollTo
window.scrollTo = jest.fn();
Element.prototype.scrollTo = jest.fn();
Element.prototype.scrollIntoView = jest.fn();

// requestAnimationFrame
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);

// getComputedStyle 增强
const originalGetComputedStyle = window.getComputedStyle;
window.getComputedStyle = (elt, pseudoElt) => {
  const style = originalGetComputedStyle(elt, pseudoElt);
  return {
    ...style,
    getPropertyValue: (prop) => style.getPropertyValue(prop) || '',
  };
};
```

---

## 2. 组件专项 Mock

### 2.1 message API

```javascript
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
```

**使用示例**:
```javascript
import { message } from 'antd';

it('should show success message', async () => {
  // 触发操作...
  await waitFor(() => {
    expect(message.success).toHaveBeenCalledWith('操作成功');
  });
});
```

### 2.2 Modal.confirm

```javascript
jest.mock('antd', () => {
  const antd = jest.requireActual('antd');
  return {
    ...antd,
    Modal: {
      ...antd.Modal,
      confirm: jest.fn(({ onOk, onCancel }) => ({
        destroy: jest.fn(),
        update: jest.fn(),
      })),
    },
  };
});
```

### 2.3 notification API

```javascript
jest.mock('antd', () => {
  const antd = jest.requireActual('antd');
  return {
    ...antd,
    notification: {
      success: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warning: jest.fn(),
      open: jest.fn(),
      destroy: jest.fn(),
    },
  };
});
```

---

## 3. Form 组件测试

### 3.1 基本表单测试

```javascript
it('should validate form fields', async () => {
  const user = userEvent.setup();
  
  await act(async () => {
    render(<MyForm />);
  });
  
  // 点击提交触发验证
  await act(async () => {
    await user.click(screen.getByRole('button', { name: /提交/i }));
  });
  
  // 等待异步验证完成
  await waitFor(() => {
    expect(screen.getByText(/请输入/i)).toBeInTheDocument();
  }, { timeout: 3000 });
});
```

### 3.2 Form 验证消息查找技巧

```javascript
// 方法1: 按文本查找
expect(screen.getByText(/请输入邮箱/i)).toBeInTheDocument();

// 方法2: 查找带错误状态的元素
const formItem = screen.getByRole('textbox', { name: /邮箱/i })
  .closest('.ant-form-item');
expect(formItem).toHaveClass('ant-form-item-has-error');

// 方法3: 查找所有错误消息
const errors = screen.getAllByText(/请输入/i);
expect(errors.length).toBeGreaterThan(0);
```

---

## 4. 常见问题解决

### 问题1: act() 警告
```
Warning: An update to Component inside a test was not wrapped in act(...)
```

**解决**: 所有触发状态更新的操作都包装在 `act()` 中

```javascript
await act(async () => {
  await user.click(button);
});
```

### 问题2: 找不到 Portal 渲染的内容
**原因**: Modal、Dropdown、Tooltip 等使用 Portal 渲染到 body  
**解决**: 使用 `screen.getByRole` 或 `document.body` 查询

```javascript
// Modal 内容
const modal = screen.getByRole('dialog');
expect(modal).toBeInTheDocument();
```

### 问题3: 下拉菜单选项找不到
**原因**: 下拉内容在点击前不渲染  
**解决**: 先触发点击，再查找选项

```javascript
await user.click(screen.getByRole('combobox'));
await waitFor(() => {
  expect(screen.getByText('选项1')).toBeInTheDocument();
});
```

### 问题4: 动画导致测试不稳定
**解决**: 禁用动画或增加等待时间

```javascript
// 全局禁用动画
import { ConfigProvider } from 'antd';

render(
  <ConfigProvider motion={{ motionDeadline: 0 }}>
    <MyComponent />
  </ConfigProvider>
);
```

---

## 5. 控制台警告过滤

```javascript
// setupTests.js
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      args[0]?.includes?.('Warning: ReactDOM.render') ||
      args[0]?.includes?.('act(...)') ||
      args[0]?.includes?.('Not implemented: HTMLFormElement')
    ) return;
    originalConsoleError.apply(console, args);
  };

  console.warn = (...args) => {
    if (
      args[0]?.includes?.('componentWillReceiveProps') ||
      args[0]?.includes?.('componentWillUpdate') ||
      args[0]?.includes?.('React Router Future Flag')
    ) return;
    originalConsoleWarn.apply(console, args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});
```
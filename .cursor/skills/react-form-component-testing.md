# React 表单组件测试模式

## 概述
本文档描述如何测试使用 Ant Design Form 组件的 React 表单，包括验证、提交和错误处理。

## 适用场景
- 登录/注册表单测试
- Ant Design Form 组件测试
- 异步表单提交测试

---

## 1. 测试文件基础结构

```javascript
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../utils/AuthContext.jsx';
import axios from 'axios';
import { message } from 'antd';

// Mock axios
jest.mock('axios');

// 渲染辅助函数
const renderWithProviders = (ui) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('FormComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });
  
  // 测试用例...
});
```

## 2. 核心测试模式

### 2.1 测试表单渲染

```javascript
it('should render form with all elements', async () => {
  await act(async () => {
    renderWithProviders(<LoginForm />);
  });
  
  // 检查按钮
  expect(screen.getByRole('button', { name: /登录/i })).toBeInTheDocument();
  // 检查输入框 (使用 placeholder)
  expect(screen.getByPlaceholderText(/请输入您的邮箱/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/请输入您的密码/i)).toBeInTheDocument();
});
```

### 2.2 测试表单验证

```javascript
it('should show validation error when field is empty', async () => {
  const user = userEvent.setup();
  
  await act(async () => {
    renderWithProviders(<LoginForm />);
  });
  
  const submitButton = screen.getByRole('button', { name: /登录/i });
  
  await act(async () => {
    await user.click(submitButton);
  });
  
  // 等待 Ant Design 异步验证完成
  await waitFor(() => {
    expect(screen.getByText(/请输入邮箱/i)).toBeInTheDocument();
  }, { timeout: 3000 });
});
```

### 2.3 测试表单提交成功

```javascript
it('should call API when form is submitted with valid data', async () => {
  const user = userEvent.setup();
  
  // Mock 成功响应
  axios.post.mockResolvedValueOnce({
    data: {
      message: '登录成功',
      user: { id: '1', email: 'test@example.com' },
      token: 'test-token'
    }
  });

  await act(async () => {
    renderWithProviders(<LoginForm />);
  });
  
  // 填写表单
  await act(async () => {
    await user.type(screen.getByPlaceholderText(/邮箱/i), 'test@example.com');
    await user.type(screen.getByPlaceholderText(/密码/i), 'password123');
  });
  
  // 提交表单
  await act(async () => {
    await user.click(screen.getByRole('button', { name: /登录/i }));
  });
  
  // 验证 API 调用
  await waitFor(() => {
    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:5001/api/users/login',
      { email: 'test@example.com', password: 'password123' }
    );
  }, { timeout: 3000 });
});
```

### 2.4 测试表单提交失败

```javascript
it('should show error message when submission fails', async () => {
  const user = userEvent.setup();
  
  // Mock 失败响应
  axios.post.mockRejectedValueOnce({
    response: {
      data: { message: '邮箱或密码错误' }
    }
  });

  await act(async () => {
    renderWithProviders(<LoginForm />);
  });
  
  // 填写并提交表单
  await act(async () => {
    await user.type(screen.getByPlaceholderText(/邮箱/i), 'test@example.com');
    await user.type(screen.getByPlaceholderText(/密码/i), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /登录/i }));
  });
  
  // 验证错误消息显示
  await waitFor(() => {
    expect(message.error).toHaveBeenCalledWith('邮箱或密码错误');
  }, { timeout: 3000 });
});
```

### 2.5 测试导航链接

```javascript
it('should have correct navigation link', async () => {
  await act(async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      </MemoryRouter>
    );
  });
  
  const registerLink = screen.getByText(/立即注册/i);
  expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
});
```

---

## 3. 最佳实践

### 3.1 使用 `userEvent` 而非 `fireEvent`
- `userEvent` 更真实地模拟用户交互
- 会触发完整的事件序列（focus、input、change 等）

### 3.2 正确处理异步操作
- 所有状态更新操作包装在 `act()` 中
- 使用 `waitFor()` 等待异步结果，设置合理的 timeout

### 3.3 选择器优先级
1. `getByRole` - 最推荐，符合无障碍标准
2. `getByPlaceholderText` - 适合表单输入框
3. `getByText` - 适合静态文本
4. `getByTestId` - 最后手段

### 3.4 Ant Design Form 特殊处理
- Form 验证是异步的，必须使用 `waitFor`
- 验证消息可能渲染在不同位置，使用灵活的选择器
- `message` API 需要 mock 以便断言

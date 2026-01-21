# React Context 全局状态管理

## 概述

React Context 提供了一种在组件树中共享数据的方式，无需通过 props 逐层传递。本文档总结了在项目中使用 Context 进行全局状态管理的最佳实践。

## 适用场景

- 用户认证状态管理（登录/登出）
- 主题切换（深色/浅色模式）
- 多语言国际化
- 全局配置信息
- 购物车状态等轻量级全局状态

## 核心模式

### 1. 创建 Context 和 Provider

```jsx
import React, { createContext, useState, useEffect, useContext } from 'react';

// 1. 创建 Context，设置默认值为 null
const AuthContext = createContext(null);

// 2. 创建 Provider 组件
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // 3. 初始化时从 localStorage 恢复状态
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
  }, []);

  // 4. 定义状态操作方法
  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  // 5. 组合 value 对象
  const value = {
    isAuthenticated,
    user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 6. 创建自定义 Hook 封装 Context 访问
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
```

### 2. 在应用入口包装 Provider

```jsx
// main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './utils/AuthContext';
import { ThemeProvider } from './utils/ThemeContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 多个 Provider 可以嵌套使用 */}
    <AuthProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
);
```

### 3. 在组件中使用

```jsx
import { useAuth } from '../utils/AuthContext';

function Dashboard() {
  const { isAuthenticated, user, logout } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div>
      <h1>欢迎, {user.name}</h1>
      <button onClick={logout}>登出</button>
    </div>
  );
}
```

## 主题切换示例

```jsx
import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  // 从 localStorage 读取初始主题
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  // 主题改变时更新 DOM 和 localStorage
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const value = { theme, setTheme, toggleTheme };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
```

## 最佳实践

### 1. 自定义 Hook 必须包含错误检查

```jsx
export const useAuth = () => {
  const context = useContext(AuthContext);
  // 确保在 Provider 内部使用
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### 2. 避免频繁更新导致的性能问题

对于频繁更新的状态，考虑拆分 Context：

```jsx
// ❌ 不好的做法：所有状态放在一个 Context
const AppContext = createContext({
  user: null,
  theme: 'light',
  notifications: [],
  // ... 更多状态
});

// ✅ 好的做法：按功能拆分 Context
const AuthContext = createContext(null);
const ThemeContext = createContext(null);
const NotificationContext = createContext(null);
```

### 3. 使用 useMemo 优化 value 对象

```jsx
import { useMemo } from 'react';

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // 使用 useMemo 避免每次渲染创建新对象
  const value = useMemo(() => ({
    isAuthenticated,
    user,
    login: (userData, token) => { /* ... */ },
    logout: () => { /* ... */ },
  }), [isAuthenticated, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

### 4. 与 localStorage 同步时处理 JSON 解析错误

```jsx
useEffect(() => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  } catch (error) {
    console.error('Failed to parse user data:', error);
    localStorage.removeItem('user');
  }
}, []);
```

## 常见问题

### Q: Context vs Redux/Zustand？

| 场景 | 推荐方案 |
|------|----------|
| 简单的全局状态（认证、主题） | Context |
| 复杂的状态逻辑、需要中间件 | Redux |
| 中等复杂度、追求简洁 | Zustand |
| 服务端状态管理 | React Query / SWR |

### Q: 如何避免 Context 导致的不必要重渲染？

1. 拆分 Context，按功能分离
2. 使用 `useMemo` 优化 value
3. 使用 `React.memo` 包装消费组件
4. 考虑使用 `use-context-selector` 库

### Q: Provider 嵌套顺序重要吗？

如果 Provider 之间有依赖关系，内层 Provider 可以访问外层 Provider 的值：

```jsx
// ThemeProvider 可以使用 AuthContext 的值
<AuthProvider>
  <ThemeProvider>  {/* 可以在这里使用 useAuth() */}
    <App />
  </ThemeProvider>
</AuthProvider>
```

## 相关资源

- [React Context 官方文档](https://react.dev/learn/passing-data-deeply-with-context)
- [use-context-selector](https://github.com/dai-shi/use-context-selector) - 性能优化库

---

## 更新记录

| 日期 | 更新内容 |
|------|----------|
| 2026-01-20 | 初始化文档 |

# CSS 变量主题系统

## 概述

CSS 变量（自定义属性）提供了一种原生的方式来实现主题切换，无需 CSS-in-JS 库即可实现动态主题。本文档总结了使用 CSS 变量构建主题系统的最佳实践。

## 适用场景

- 深色/浅色模式切换
- 品牌主题定制
- 多主题切换（如时尚风格切换）
- 组件库主题配置
- 用户自定义主题

## 核心实现

### 1. 定义 CSS 变量

```css
/* index.css 或 App.css */

/* ==================== 基础主题变量 ==================== */
:root {
  /* 颜色系统 */
  --color-primary: #000000;
  --color-secondary: #ffffff;
  --color-accent: #c0a062;
  --color-background: #f5f5f5;
  --color-surface: #ffffff;
  
  /* 文字颜色 */
  --color-text-primary: #000000;
  --color-text-secondary: #666666;
  --color-text-light: #ffffff;
  --color-text-muted: #999999;
  
  /* 边框和阴影 */
  --color-border: #e0e0e0;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-base: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
  
  /* 间距系统 */
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;
  --spacing-12: 3rem;
  --spacing-16: 4rem;
  
  /* 字体系统 */
  --font-family: 'Playfair Display', Georgia, serif;
  --font-family-sans: 'Inter', -apple-system, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  
  /* 字重 */
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  /* 行高 */
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
  
  /* 字间距 */
  --letter-spacing-tight: -0.025em;
  --letter-spacing-normal: 0;
  --letter-spacing-wide: 0.025em;
  
  /* 圆角 */
  --radius-sm: 0.25rem;
  --radius-base: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-full: 9999px;
  
  /* 过渡 */
  --transition-base: 0.2s ease;
  --transition-slow: 0.3s ease;
}

/* ==================== 香奈儿经典主题 ==================== */
[data-theme="chanel"] {
  --color-primary: #000000;
  --color-secondary: #ffffff;
  --color-accent: #c0a062;
  --color-background: #fafafa;
  --color-surface: #ffffff;
  
  --color-text-primary: #000000;
  --color-text-secondary: #666666;
  --color-border: #e8e8e8;
}

/* ==================== 时尚现代主题 ==================== */
[data-theme="vogue"] {
  --color-primary: #1a1a2e;
  --color-secondary: #16213e;
  --color-accent: #e94560;
  --color-background: #0f0f1a;
  --color-surface: #1a1a2e;
  
  --color-text-primary: #ffffff;
  --color-text-secondary: #a0a0a0;
  --color-text-light: #ffffff;
  --color-border: #2a2a4a;
  
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-base: 0 2px 4px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.5);
}

/* ==================== 系统深色模式适配 ==================== */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    --color-primary: #ffffff;
    --color-secondary: #1a1a1a;
    --color-background: #0a0a0a;
    --color-surface: #1a1a1a;
    
    --color-text-primary: #ffffff;
    --color-text-secondary: #a0a0a0;
    --color-border: #333333;
  }
}
```

### 2. React ThemeContext 实现

```jsx
// utils/ThemeContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext(null);

// 可用主题列表
export const THEMES = {
  CHANEL: 'chanel',
  VOGUE: 'vogue',
  SYSTEM: 'system'  // 跟随系统
};

export const ThemeProvider = ({ children }) => {
  // 从 localStorage 读取初始主题
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || THEMES.CHANEL;
  });

  // 当主题改变时，更新 DOM 和 localStorage
  useEffect(() => {
    if (theme === THEMES.SYSTEM) {
      // 移除 data-theme 属性，让 CSS 媒体查询生效
      document.body.removeAttribute('data-theme');
    } else {
      document.body.setAttribute('data-theme', theme);
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 切换主题函数
  const toggleTheme = () => {
    setTheme((prev) => (prev === THEMES.CHANEL ? THEMES.VOGUE : THEMES.CHANEL));
  };

  // 设置特定主题
  const setSpecificTheme = (newTheme) => {
    if (Object.values(THEMES).includes(newTheme)) {
      setTheme(newTheme);
    }
  };

  const value = {
    theme,
    setTheme: setSpecificTheme,
    toggleTheme,
    isDark: theme === THEMES.VOGUE
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
```

### 3. 主题切换组件

```jsx
// components/ThemeToggle.jsx
import { useTheme, THEMES } from '../utils/ThemeContext';
import { BgColorsOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons';

const ThemeToggle = () => {
  const { theme, toggleTheme, setTheme } = useTheme();

  return (
    <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
      {/* 简单切换按钮 */}
      <button
        onClick={toggleTheme}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-2)',
          padding: 'var(--spacing-2) var(--spacing-4)',
          fontSize: 'var(--font-size-sm)',
          backgroundColor: 'transparent',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
          transition: 'all var(--transition-base)',
        }}
      >
        <BgColorsOutlined />
        {theme === THEMES.CHANEL ? '时尚现代' : '经典香奈儿'}
      </button>

      {/* 或者使用下拉选择 */}
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        style={{
          padding: 'var(--spacing-2) var(--spacing-4)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text-primary)',
        }}
      >
        <option value={THEMES.CHANEL}>香奈儿经典</option>
        <option value={THEMES.VOGUE}>时尚现代</option>
        <option value={THEMES.SYSTEM}>跟随系统</option>
      </select>
    </div>
  );
};

export default ThemeToggle;
```

### 4. 在组件中使用 CSS 变量

```jsx
// 使用内联样式
const Card = ({ children }) => (
  <div style={{
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--spacing-6)',
    boxShadow: 'var(--shadow-base)',
    transition: 'all var(--transition-base)',
  }}>
    {children}
  </div>
);

// 使用 CSS 类
const Button = ({ primary, children, ...props }) => (
  <button
    className={`btn ${primary ? 'btn-primary' : 'btn-secondary'}`}
    {...props}
  >
    {children}
  </button>
);
```

```css
/* 对应的 CSS */
.btn {
  padding: var(--spacing-2) var(--spacing-6);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-text-light);
  border: 1px solid var(--color-primary);
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-secondary {
  background-color: transparent;
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
```

## 高级技巧

### 1. 主题过渡动画

```css
/* 添加全局过渡效果，让主题切换更平滑 */
body {
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* 或者更精细的控制 */
body * {
  transition: 
    background-color 0.3s ease,
    border-color 0.3s ease,
    color 0.3s ease,
    box-shadow 0.3s ease;
}

/* 排除不需要过渡的元素 */
body img,
body video,
body svg {
  transition: none;
}
```

### 2. 计算属性

```css
:root {
  --spacing-unit: 0.25rem;
  
  /* 使用 calc 创建间距系统 */
  --spacing-1: calc(var(--spacing-unit) * 1);   /* 0.25rem */
  --spacing-2: calc(var(--spacing-unit) * 2);   /* 0.5rem */
  --spacing-4: calc(var(--spacing-unit) * 4);   /* 1rem */
  --spacing-8: calc(var(--spacing-unit) * 8);   /* 2rem */
  
  /* 透明度变体 */
  --color-primary-rgb: 0, 0, 0;
  --color-primary-10: rgba(var(--color-primary-rgb), 0.1);
  --color-primary-20: rgba(var(--color-primary-rgb), 0.2);
  --color-primary-50: rgba(var(--color-primary-rgb), 0.5);
}

[data-theme="vogue"] {
  --color-primary-rgb: 233, 69, 96;
}
```

### 3. 组件级主题覆盖

```css
/* 某些组件可能需要独立的主题 */
.always-light {
  --color-background: #ffffff;
  --color-text-primary: #000000;
  --color-border: #e0e0e0;
}

.always-dark {
  --color-background: #1a1a1a;
  --color-text-primary: #ffffff;
  --color-border: #333333;
}
```

```jsx
// 使用示例
<div className="always-light">
  {/* 这个区域始终使用浅色主题 */}
  <Card>...</Card>
</div>
```

### 4. JavaScript 中读取 CSS 变量

```javascript
// 读取 CSS 变量值
const getThemeColor = (variableName) => {
  return getComputedStyle(document.body)
    .getPropertyValue(variableName)
    .trim();
};

// 使用示例
const primaryColor = getThemeColor('--color-primary');
console.log(primaryColor); // "#000000" 或 "#1a1a2e"

// 动态设置 CSS 变量
const setThemeVariable = (name, value) => {
  document.body.style.setProperty(name, value);
};

// 用户自定义强调色
setThemeVariable('--color-accent', '#ff6b6b');
```

### 5. 与 Ant Design 集成

```jsx
// 使用 ConfigProvider 同步 Ant Design 主题
import { ConfigProvider, theme as antTheme } from 'antd';
import { useTheme, THEMES } from '../utils/ThemeContext';

const AntdThemeProvider = ({ children }) => {
  const { theme } = useTheme();
  
  const antdTheme = {
    algorithm: theme === THEMES.VOGUE 
      ? antTheme.darkAlgorithm 
      : antTheme.defaultAlgorithm,
    token: {
      colorPrimary: theme === THEMES.VOGUE ? '#e94560' : '#000000',
      colorBgContainer: theme === THEMES.VOGUE ? '#1a1a2e' : '#ffffff',
      borderRadius: 4,
    },
  };
  
  return (
    <ConfigProvider theme={antdTheme}>
      {children}
    </ConfigProvider>
  );
};
```

### 6. 响应系统主题偏好变化

```jsx
import { useEffect } from 'react';
import { useTheme, THEMES } from '../utils/ThemeContext';

const useSystemThemeSync = () => {
  const { theme, setTheme } = useTheme();
  
  useEffect(() => {
    // 只有选择"跟随系统"时才监听
    if (theme !== THEMES.SYSTEM) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // 触发重新渲染以应用新的系统主题
      document.body.removeAttribute('data-theme');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);
};
```

## 工具类 CSS

```css
/* 基于 CSS 变量的工具类 */

/* 文字颜色 */
.text-primary { color: var(--color-text-primary); }
.text-secondary { color: var(--color-text-secondary); }
.text-muted { color: var(--color-text-muted); }
.text-accent { color: var(--color-accent); }

/* 背景颜色 */
.bg-primary { background-color: var(--color-primary); }
.bg-secondary { background-color: var(--color-secondary); }
.bg-surface { background-color: var(--color-surface); }
.bg-accent { background-color: var(--color-accent); }

/* 间距 */
.p-1 { padding: var(--spacing-1); }
.p-2 { padding: var(--spacing-2); }
.p-4 { padding: var(--spacing-4); }
.p-6 { padding: var(--spacing-6); }

.m-1 { margin: var(--spacing-1); }
.m-2 { margin: var(--spacing-2); }
.m-4 { margin: var(--spacing-4); }
.m-6 { margin: var(--spacing-6); }

/* 圆角 */
.rounded-sm { border-radius: var(--radius-sm); }
.rounded { border-radius: var(--radius-base); }
.rounded-lg { border-radius: var(--radius-lg); }
.rounded-full { border-radius: var(--radius-full); }

/* 阴影 */
.shadow-sm { box-shadow: var(--shadow-sm); }
.shadow { box-shadow: var(--shadow-base); }
.shadow-md { box-shadow: var(--shadow-md); }
.shadow-lg { box-shadow: var(--shadow-lg); }
```

## 浏览器兼容性

| 浏览器 | 支持版本 |
|--------|----------|
| Chrome | 49+ |
| Firefox | 31+ |
| Safari | 9.1+ |
| Edge | 15+ |
| IE | 不支持 |

对于不支持 CSS 变量的浏览器，可以使用降级方案：

```css
.button {
  /* 降级颜色 */
  background-color: #000000;
  /* 现代浏览器使用 CSS 变量 */
  background-color: var(--color-primary);
}
```

---

## 更新记录

| 日期 | 更新内容 |
|------|----------|
| 2026-01-20 | 初始化文档 |

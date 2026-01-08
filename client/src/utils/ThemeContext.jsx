import React, { createContext, useState, useEffect, useContext } from 'react';

// 创建主题上下文
const ThemeContext = createContext(null);

// 主题提供者组件
export const ThemeProvider = ({ children }) => {
  // 从 localStorage 读取初始主题，默认为 'chanel'
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'chanel';
  });

  // 当主题改变时，更新 body 的 data-theme 属性并保存到 localStorage
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 切换主题函数
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'chanel' ? 'vogue' : 'chanel'));
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// 自定义钩子用于访问主题上下文
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;


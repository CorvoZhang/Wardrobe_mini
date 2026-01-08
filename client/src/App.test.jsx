import { render, screen } from '@testing-library/react';
import App from './App.jsx';
import { AuthProvider } from './utils/AuthContext.jsx';
import { ThemeProvider } from './utils/ThemeContext.jsx';

// 封装渲染函数，包含必要的Provider
const renderApp = () => {
  return render(
    <AuthProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </AuthProvider>
  );
};

describe('App Component', () => {
  it('should render App component', () => {
    renderApp();
    // 检查品牌标识是否渲染（可能有多个CHANEL文本，使用getAllByText检查至少有一个）
    const chanelElements = screen.getAllByText(/CHANEL/i);
    expect(chanelElements.length).toBeGreaterThan(0);
  });
});
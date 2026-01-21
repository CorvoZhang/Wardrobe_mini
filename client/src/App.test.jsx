import { render, screen, act } from '@testing-library/react';
import { AuthProvider } from './utils/AuthContext.jsx';
import { ThemeProvider } from './utils/ThemeContext.jsx';

// Mock axiosConfig to avoid import.meta.env issues
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

// Import App after the mock is set up
import App from './App.jsx';

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
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it('should render App component with CHANEL branding', async () => {
    await act(async () => {
      renderApp();
    });
    
    // 检查品牌标识是否渲染（可能有多个CHANEL文本，使用getAllByText检查至少有一个）
    const chanelElements = screen.getAllByText(/CHANEL/i);
    expect(chanelElements.length).toBeGreaterThan(0);
  });
});
